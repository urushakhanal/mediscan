const CarePlan = require('../../../database/models/carePlan.model');
const { CarePlanBooking } = require('../../../database/models/carePlanBooking.model');
const CarePlanPaymentSession = require('../../../database/models/carePlanPaymentSession.model');
const User = require('../../../database/models/user.model');
const { DOCTOR_SPECIALIZATIONS } = require('../../../constants/user.constants');
const { createNotification } = require('../../notifications/services/notification.service');
const config = require('../../../config/env');

const DOCTOR_SELECT = 'name email phone specialization qualification experienceYears currentlyWorkingAt isVerified isActive role';
const BOOKING_POPULATE = [
    { path: 'carePlan', populate: { path: 'assignedDoctors', select: DOCTOR_SELECT } },
    { path: 'patient', select: 'name email phone role isActive' },
    { path: 'doctor', select: DOCTOR_SELECT },
];

const sanitizeUser = (user) => {
    if (!user) {
        return null;
    }

    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
};

const sanitizeCarePlan = (carePlan) => {
    const obj = carePlan.toObject ? carePlan.toObject() : { ...carePlan };
    delete obj.__v;

    if (Array.isArray(obj.assignedDoctors)) {
        obj.assignedDoctors = obj.assignedDoctors.map(sanitizeUser);
    }

    return obj;
};

const sanitizeBooking = (booking) => {
    const obj = booking.toObject ? booking.toObject() : { ...booking };
    delete obj.__v;
    obj.patient = sanitizeUser(obj.patient);
    obj.doctor = sanitizeUser(obj.doctor);
    if (obj.carePlan) {
        obj.carePlan = sanitizeCarePlan(obj.carePlan);
    }
    return obj;
};

const notifySafely = (payload) => {
    void createNotification(payload).catch((error) => {
        console.error('Failed to create care plan notification:', error.message);
    });
};

const toSlug = (value) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeText = (value, fallback = '') => String(value || fallback).trim();
const KHALTI_PAYMENT_PROVIDER = 'khalti';
const normalizeOptionalText = (value) => String(value || '').trim();
const ensureKhaltiIsEnabled = () => {
    if (!config.khalti.enabled) {
        throw createHttpError('Khalti payment is not configured on the server.', 503);
    }
};
const toPaisaAmount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.round(numericValue * 100) : 0;
};

const normalizeIncludes = (includes) => {
    const source = Array.isArray(includes) ? includes : [];
    const normalized = [...new Set(
        source
            .map((item) => normalizeText(item))
            .filter(Boolean)
            .slice(0, 10)
    )];

    if (normalized.length === 0) {
        throw createHttpError('Please add at least one care plan inclusion.', 400);
    }

    return normalized;
};

const normalizeDoctorIds = (doctorIds) => {
    const source = Array.isArray(doctorIds) ? doctorIds : [];
    const normalized = [...new Set(source.map((doctorId) => normalizeText(doctorId)).filter(Boolean))];

    if (normalized.length === 0) {
        throw createHttpError('Please assign at least one doctor to the care plan.', 400);
    }

    return normalized;
};

const ensureUniqueSlug = async (name, excludeId) => {
    const baseSlug = toSlug(name);

    if (!baseSlug) {
        throw createHttpError('A valid care plan name is required.', 400);
    }

    let slug = baseSlug;
    let suffix = 1;

    while (await CarePlan.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
    }

    return slug;
};

const validateAssignedDoctors = async (doctorIds, specialty) => {
    const doctors = await User.find({ _id: { $in: doctorIds } }).select(DOCTOR_SELECT);

    if (doctors.length !== doctorIds.length) {
        throw createHttpError('One or more selected doctors could not be found. Please refresh and choose the doctor again.', 400);
    }

    const invalidRoleDoctor = doctors.find((doctor) => doctor.role !== 'doctor');
    if (invalidRoleDoctor) {
        throw createHttpError('Only doctor accounts can be assigned to a care plan.', 400);
    }

    const unverifiedDoctor = doctors.find((doctor) => doctor.isVerified !== true);
    if (unverifiedDoctor) {
        throw createHttpError(`"${unverifiedDoctor.name}" is not verified yet. Please verify the doctor first.`, 400);
    }

    const inactiveDoctor = doctors.find((doctor) => doctor.isActive === false);
    if (inactiveDoctor) {
        throw createHttpError(`"${inactiveDoctor.name}" is blocked or inactive. Please activate the doctor first.`, 400);
    }

    if (specialty && doctors.some((doctor) => doctor.specialization !== specialty)) {
        throw createHttpError('Assigned doctors must match the selected specialty.', 400);
    }

    return doctors;
};

const validateCarePlanPayload = async (payload = {}, excludeId) => {
    const name = normalizeText(payload.name);
    const summary = normalizeText(payload.summary);
    const description = normalizeText(payload.description);
    const specialty = normalizeText(payload.specialty);
    const whoItsFor = normalizeText(payload.whoItsFor);
    const iconKey = normalizeText(payload.iconKey, 'heart');
    const durationWeeks = Number(payload.durationWeeks);
    const price = Number(payload.price);
    const doctorIds = normalizeDoctorIds(payload.doctorIds);
    const includes = normalizeIncludes(payload.includes);

    if (name.length < 3 || name.length > 120) {
        throw createHttpError('Care plan name must be between 3 and 120 characters.', 400);
    }

    if (summary.length < 10 || summary.length > 240) {
        throw createHttpError('Summary must be between 10 and 240 characters.', 400);
    }

    if (description.length < 20 || description.length > 2000) {
        throw createHttpError('Description must be between 20 and 2000 characters.', 400);
    }

    if (!specialty) {
        throw createHttpError('Specialty is required.', 400);
    }

    if (!DOCTOR_SPECIALIZATIONS.includes(specialty)) {
        throw createHttpError('Please choose a valid doctor specialty for this care plan.', 400);
    }

    if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
        throw createHttpError('Duration must be a whole number between 1 and 52 weeks.', 400);
    }

    if (!Number.isFinite(price) || price < 0) {
        throw createHttpError('Price must be a valid positive amount.', 400);
    }

    await validateAssignedDoctors(doctorIds, specialty);

    return {
        name,
        slug: await ensureUniqueSlug(name, excludeId),
        summary,
        description,
        specialty,
        durationWeeks,
        price,
        whoItsFor,
        iconKey,
        includes,
        assignedDoctors: doctorIds,
    };
};

const getDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const validatePreferredDate = (preferredDate) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate || '')) {
        throw createHttpError('Preferred date must use YYYY-MM-DD format.', 400);
    }

    if (preferredDate < getDateString()) {
        throw createHttpError('Preferred date cannot be in the past.', 400);
    }
};

const listPublicCarePlans = async () => {
    const carePlans = await CarePlan.find({ isActive: true })
        .populate('assignedDoctors', DOCTOR_SELECT)
        .sort({ createdAt: -1 });

    return carePlans.map(sanitizeCarePlan);
};

const getPublicCarePlanById = async (carePlanId) => {
    const carePlan = await CarePlan.findOne({ _id: carePlanId, isActive: true })
        .populate('assignedDoctors', DOCTOR_SELECT);

    if (!carePlan) {
        throw createHttpError('Care plan not found.', 404);
    }

    return sanitizeCarePlan(carePlan);
};

const listAdminCarePlans = async () => {
    const carePlans = await CarePlan.find()
        .populate('assignedDoctors', DOCTOR_SELECT)
        .sort({ createdAt: -1 });

    return carePlans.map(sanitizeCarePlan);
};

const createCarePlan = async (payload = {}) => {
    const validatedPayload = await validateCarePlanPayload(payload);
    const carePlan = await CarePlan.create(validatedPayload);
    const populatedCarePlan = await CarePlan.findById(carePlan._id).populate('assignedDoctors', DOCTOR_SELECT);
    return sanitizeCarePlan(populatedCarePlan);
};

const updateCarePlan = async (carePlanId, payload = {}) => {
    const carePlan = await CarePlan.findById(carePlanId);

    if (!carePlan) {
        throw createHttpError('Care plan not found.', 404);
    }

    const validatedPayload = await validateCarePlanPayload(payload, carePlanId);
    Object.assign(carePlan, validatedPayload);
    await carePlan.save();

    const populatedCarePlan = await CarePlan.findById(carePlan._id).populate('assignedDoctors', DOCTOR_SELECT);
    return sanitizeCarePlan(populatedCarePlan);
};

const setCarePlanStatus = async (carePlanId, isActive) => {
    const carePlan = await CarePlan.findById(carePlanId);

    if (!carePlan) {
        throw createHttpError('Care plan not found.', 404);
    }

    carePlan.isActive = Boolean(isActive);
    await carePlan.save();

    const populatedCarePlan = await CarePlan.findById(carePlan._id).populate('assignedDoctors', DOCTOR_SELECT);
    return sanitizeCarePlan(populatedCarePlan);
};

const deleteCarePlan = async (carePlanId) => {
    const bookingCount = await CarePlanBooking.countDocuments({ carePlan: carePlanId });
    if (bookingCount > 0) {
        throw createHttpError('This care plan already has bookings. Deactivate it instead of deleting it.', 400);
    }

    const deleted = await CarePlan.findByIdAndDelete(carePlanId);
    if (!deleted) {
        throw createHttpError('Care plan not found.', 404);
    }
};

const createBooking = async ({ carePlanId, patientId, doctorId, preferredDate, preferredTime, notes }) => {
    validatePreferredDate(preferredDate);

    const normalizedDoctorId = normalizeText(doctorId);
    const normalizedTime = normalizeText(preferredTime);
    const normalizedNotes = normalizeText(notes);

    if (!normalizedDoctorId) {
        throw createHttpError('Please choose a doctor for this care plan.', 400);
    }

    if (!normalizedTime) {
        throw createHttpError('Preferred time is required.', 400);
    }

    const [carePlan, patient] = await Promise.all([
        CarePlan.findOne({ _id: carePlanId, isActive: true }).populate('assignedDoctors', DOCTOR_SELECT),
        User.findById(patientId).select('name email phone role isActive'),
    ]);

    if (!carePlan) {
        throw createHttpError('Care plan not found or unavailable.', 404);
    }

    if (!patient) {
        throw createHttpError('Patient account not found.', 404);
    }

    if (patient.role !== 'patient') {
        throw createHttpError('Only patient accounts can request a care plan.', 403);
    }

    if (patient.isActive === false) {
        throw createHttpError('Your account has been blocked. Please contact the superadmin.', 403);
    }

    const selectedDoctor = carePlan.assignedDoctors.find((doctor) => String(doctor._id) === normalizedDoctorId);
    if (!selectedDoctor) {
        throw createHttpError('Selected doctor is not assigned to this care plan.', 400);
    }

    const booking = await CarePlanBooking.create({
        carePlan: carePlanId,
        patient: patientId,
        doctor: normalizedDoctorId,
        preferredDate,
        preferredTime: normalizedTime,
        notes: normalizedNotes,
    });

    const populatedBooking = await CarePlanBooking.findById(booking._id).populate(BOOKING_POPULATE);
    notifySafely({
        recipientId: selectedDoctor._id,
        type: 'care-plan-booking-request',
        title: 'New care plan request',
        message: `${patient.name} requested the ${carePlan.name} care plan.`,
        link: '/doctor/care-plan-requests',
        createdByRole: 'patient',
        metadata: {
            bookingId: booking._id.toString(),
            carePlanId: carePlan._id.toString(),
            doctorId: selectedDoctor._id.toString(),
            patientId: patient._id.toString(),
        },
    });
    return sanitizeBooking(populatedBooking);
};

const createKhaltiPaymentSessionForBooking = async ({ carePlanId, patientId, payload = {} }) => {
    ensureKhaltiIsEnabled();
    validatePreferredDate(payload?.preferredDate);

    const normalizedDoctorId = normalizeText(payload?.doctorId);
    const normalizedTime = normalizeText(payload?.preferredTime);
    const normalizedNotes = normalizeText(payload?.notes);

    if (!normalizedDoctorId) {
        throw createHttpError('Please choose a doctor for this care plan.', 400);
    }

    if (!normalizedTime) {
        throw createHttpError('Preferred time is required.', 400);
    }

    const [carePlan, patient] = await Promise.all([
        CarePlan.findOne({ _id: carePlanId, isActive: true }).populate('assignedDoctors', DOCTOR_SELECT),
        User.findById(patientId).select('name email phone role isActive'),
    ]);

    if (!carePlan) {
        throw createHttpError('Care plan not found or unavailable.', 404);
    }

    if (!patient) {
        throw createHttpError('Patient account not found.', 404);
    }

    if (patient.role !== 'patient') {
        throw createHttpError('Only patient accounts can request a care plan.', 403);
    }

    if (patient.isActive === false) {
        throw createHttpError('Your account has been blocked. Please contact the superadmin.', 403);
    }

    const selectedDoctor = carePlan.assignedDoctors.find((doctor) => String(doctor._id) === normalizedDoctorId);
    if (!selectedDoctor) {
        throw createHttpError('Selected doctor is not assigned to this care plan.', 400);
    }

    const amount = Number(carePlan.price);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw createHttpError('This care plan does not require Khalti payment. Submit the request directly.', 400);
    }

    const transactionUuid = `${carePlan._id}-${patient._id}-${Date.now()}`;
    const returnUrl = `${config.clientUrl}/patient/care-plans/payment/khalti/success?session=${transactionUuid}`;
    const websiteUrl = config.clientUrl;
    const initiateResponse = await fetch(config.khalti.initiateUrl, {
        method: 'POST',
        headers: {
            Authorization: `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            return_url: returnUrl,
            website_url: websiteUrl,
            amount: toPaisaAmount(amount),
            purchase_order_id: transactionUuid,
            purchase_order_name: `Care Plan - ${carePlan.name}`,
            customer_info: {
                name: patient.name || 'Patient',
                email: patient.email || undefined,
                phone: patient.phone || undefined,
            },
            amount_breakdown: [
                {
                    label: 'Care plan',
                    amount: toPaisaAmount(amount),
                },
            ],
            product_details: [
                {
                    identity: String(carePlan._id),
                    name: carePlan.name,
                    total_price: toPaisaAmount(amount),
                    quantity: 1,
                    unit_price: toPaisaAmount(amount),
                },
            ],
            merchant_username: 'mediscan',
            merchant_extra: JSON.stringify({
                carePlanId: String(carePlan._id),
                doctorId: String(selectedDoctor._id),
                preferredDate: payload.preferredDate,
                preferredTime: normalizedTime,
            }),
        }),
    });

    const initiatePayload = await initiateResponse.json().catch(() => null);
    if (!initiateResponse.ok || !initiatePayload?.pidx || !initiatePayload?.payment_url) {
        const message = initiatePayload?.detail || initiatePayload?.message || 'Unable to start Khalti payment.';
        throw createHttpError(message, 502);
    }

    const paymentSession = await CarePlanPaymentSession.create({
        provider: KHALTI_PAYMENT_PROVIDER,
        status: 'initiated',
        patient: patient._id,
        doctor: selectedDoctor._id,
        carePlan: carePlan._id,
        amount,
        currency: 'NPR',
        transactionUuid,
        providerSessionId: normalizeOptionalText(initiatePayload.pidx),
        productCode: 'careplan-booking',
        bookingPayload: {
            carePlanId: carePlan._id,
            patientId: patient._id,
            doctorId: selectedDoctor._id,
            preferredDate: payload.preferredDate,
            preferredTime: normalizedTime,
            notes: normalizedNotes,
        },
        expiresAt: new Date(Date.now() + (30 * 60 * 1000)),
    });

    return {
        provider: KHALTI_PAYMENT_PROVIDER,
        sessionId: paymentSession._id.toString(),
        transactionUuid,
        pidx: initiatePayload.pidx,
        redirectUrl: initiatePayload.payment_url,
        expiresAt: paymentSession.expiresAt,
        amount,
        currency: 'NPR',
    };
};

const verifyKhaltiPaymentSessionForBooking = async ({ sessionId, patientId, pidx }) => {
    ensureKhaltiIsEnabled();

    const paymentSession = await CarePlanPaymentSession.findOne({
        transactionUuid: normalizeOptionalText(sessionId),
        patient: patientId,
        provider: KHALTI_PAYMENT_PROVIDER,
    });

    if (!paymentSession) {
        throw createHttpError('Payment session not found.', 404);
    }

    if (paymentSession.booking) {
        const existingBooking = await CarePlanBooking.findById(paymentSession.booking).populate(BOOKING_POPULATE);
        if (existingBooking) {
            return {
                booking: sanitizeBooking(existingBooking),
                payment: {
                    provider: KHALTI_PAYMENT_PROVIDER,
                    status: paymentSession.status,
                    amount: paymentSession.amount,
                    currency: paymentSession.currency || 'NPR',
                    transactionUuid: paymentSession.transactionUuid,
                    referenceId: paymentSession.referenceId || '',
                    providerSessionId: paymentSession.providerSessionId || '',
                },
            };
        }
    }

    if (paymentSession.expiresAt && paymentSession.expiresAt.getTime() < Date.now()) {
        paymentSession.status = 'expired';
        paymentSession.failedAt = paymentSession.failedAt || new Date();
        await paymentSession.save();
        throw createHttpError('This payment session has expired. Please start again.', 410);
    }

    if (!normalizeOptionalText(pidx) || normalizeOptionalText(pidx) !== normalizeOptionalText(paymentSession.providerSessionId)) {
        throw createHttpError('The Khalti payment reference does not match this session.', 400);
    }

    const lookupResponse = await fetch(config.khalti.lookupUrl, {
        method: 'POST',
        headers: {
            Authorization: `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: normalizeOptionalText(pidx) }),
    });

    const lookupPayload = await lookupResponse.json().catch(() => null);
    if (!lookupResponse.ok || !lookupPayload) {
        const message = lookupPayload?.detail || lookupPayload?.message || 'Unable to confirm the Khalti payment.';
        throw createHttpError(message, 502);
    }

    const lookupStatus = normalizeOptionalText(lookupPayload.status).toLowerCase();
    if (lookupStatus !== 'completed') {
        paymentSession.status = lookupStatus || 'failed';
        paymentSession.failedAt = paymentSession.failedAt || new Date();
        paymentSession.verificationPayload = lookupPayload;
        await paymentSession.save();
        throw createHttpError('Khalti did not confirm this payment as completed.', 400);
    }

    if (
        normalizeOptionalText(lookupPayload.pidx) !== normalizeOptionalText(paymentSession.providerSessionId)
        || Number(lookupPayload.total_amount) !== toPaisaAmount(paymentSession.amount)
    ) {
        throw createHttpError('The Khalti lookup response does not match the original payment request.', 400);
    }

    const booking = await createBooking({
        carePlanId: paymentSession.bookingPayload.carePlanId,
        patientId: paymentSession.bookingPayload.patientId,
        doctorId: paymentSession.bookingPayload.doctorId,
        preferredDate: paymentSession.bookingPayload.preferredDate,
        preferredTime: paymentSession.bookingPayload.preferredTime,
        notes: paymentSession.bookingPayload.notes,
    });

    paymentSession.status = 'paid';
    paymentSession.referenceId = normalizeOptionalText(lookupPayload.transaction_id || lookupPayload.transactionId);
    paymentSession.providerSessionId = normalizeOptionalText(lookupPayload.pidx || paymentSession.providerSessionId);
    paymentSession.paidAt = new Date();
    paymentSession.booking = booking?._id || null;
    paymentSession.verificationPayload = lookupPayload;
    await paymentSession.save();

    return {
        booking,
        payment: {
            provider: KHALTI_PAYMENT_PROVIDER,
            status: 'paid',
            amount: paymentSession.amount,
            currency: paymentSession.currency || 'NPR',
            transactionUuid: paymentSession.transactionUuid,
            referenceId: paymentSession.referenceId || '',
            providerSessionId: paymentSession.providerSessionId || '',
        },
    };
};

const listPatientBookings = async (patientId) => {
    const bookings = await CarePlanBooking.find({ patient: patientId })
        .populate(BOOKING_POPULATE)
        .sort({ createdAt: -1 });

    return bookings.map(sanitizeBooking);
};

const listDoctorBookings = async (doctorId) => {
    const bookings = await CarePlanBooking.find({ doctor: doctorId })
        .populate(BOOKING_POPULATE)
        .sort({ createdAt: -1 });

    return bookings.map(sanitizeBooking);
};

const listAdminBookings = async () => {
    const bookings = await CarePlanBooking.find()
        .populate(BOOKING_POPULATE)
        .sort({ createdAt: -1 });

    return bookings.map(sanitizeBooking);
};

const listDoctorCarePlans = async (doctorId) => {
    const carePlans = await CarePlan.find({ assignedDoctors: doctorId, isActive: true })
        .populate('assignedDoctors', DOCTOR_SELECT)
        .sort({ createdAt: -1 });

    return carePlans.map(sanitizeCarePlan);
};

const updateBookingStatus = async ({ bookingId, doctorId, status }) => {
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        throw createHttpError('Care plan booking status must be pending, confirmed, cancelled, or completed.', 400);
    }

    const booking = await CarePlanBooking.findOne({ _id: bookingId, doctor: doctorId });
    if (!booking) {
        throw createHttpError('Care plan booking not found.', 404);
    }

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    const populatedBooking = await CarePlanBooking.findById(booking._id).populate(BOOKING_POPULATE);
    if (previousStatus !== status) {
        notifySafely({
            recipientId: booking.patient,
            type: `care-plan-booking-${status}`,
            title: `Care plan booking ${status}`,
            message: `Your care plan booking for ${populatedBooking.carePlan?.name || 'the care plan'} has been ${status}.`,
            link: '/patient/care-plans',
            createdByRole: 'doctor',
            metadata: {
                bookingId: booking._id.toString(),
                carePlanId: booking.carePlan.toString(),
                doctorId: booking.doctor.toString(),
                patientId: booking.patient.toString(),
                status,
            },
        });
    }
    return sanitizeBooking(populatedBooking);
};

module.exports = {
    listPublicCarePlans,
    getPublicCarePlanById,
    listAdminCarePlans,
    createCarePlan,
    updateCarePlan,
    setCarePlanStatus,
    deleteCarePlan,
    createBooking,
    listPatientBookings,
    listDoctorBookings,
    listAdminBookings,
    listDoctorCarePlans,
    updateBookingStatus,
    createKhaltiPaymentSessionForBooking,
    verifyKhaltiPaymentSessionForBooking,
};
