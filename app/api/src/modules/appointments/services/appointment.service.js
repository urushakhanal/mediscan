const mongoose = require('mongoose');
const Appointment = require('../../../database/models/appointment.model');
const PaymentSession = require('../../../database/models/paymentSession.model');
const User = require('../../../database/models/user.model');
const { ACTIVE_APPOINTMENT_STATUSES } = require('../../../constants/appointment.constants');
const { createDefaultDoctorAvailabilitySettings } = require('../../../constants/user.constants');
const { createNotification } = require('../../notifications/services/notification.service');
const config = require('../../../config/env');
const fs = require('fs/promises');
const path = require('path');

const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

const sanitizeUser = (user) => {
    if (!user) {
        return null;
    }

    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
};

const sanitizeAppointment = (appointment) => {
    const obj = appointment.toObject ? appointment.toObject() : { ...appointment };
    delete obj.__v;
    delete obj.activeSlotKey;
    if (obj.doctor) {
        obj.doctor = sanitizeUser(obj.doctor);
    }
    if (obj.patient) {
        obj.patient = sanitizeUser(obj.patient);
    }
    if (Array.isArray(obj.medicalDocuments)) {
        obj.medicalDocuments = obj.medicalDocuments.map((document) => ({
            ...document,
            fileUrl: document?.fileUrl || '',
        }));
    }
    return obj;
};

const formatLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeSlot = (slot) => String(slot || '').trim().replace(/\s+/g, '');

const validateTimeSlot = (slot) => {
    const normalizedSlot = normalizeSlot(slot);
    const match = normalizedSlot.match(TIME_SLOT_PATTERN);

    if (!match) {
        const error = new Error('Time slots must use HH:MM-HH:MM format.');
        error.statusCode = 400;
        throw error;
    }

    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = Number(match[3]) * 60 + Number(match[4]);

    if (start >= end) {
        const error = new Error('Time slot end time must be after start time.');
        error.statusCode = 400;
        throw error;
    }

    return normalizedSlot;
};

const parseTimeToMinutes = (timeValue) => {
    const normalizedTime = normalizeSlot(timeValue);
    const match = normalizedTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
        return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
};

const parseSlotToRange = (slotValue) => {
    const normalizedSlot = validateTimeSlot(slotValue);
    const [startText, endText] = normalizedSlot.split('-');
    const start = parseTimeToMinutes(startText);
    const end = parseTimeToMinutes(endText);

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
        const error = new Error('Time slots must use HH:MM-HH:MM format.');
        error.statusCode = 400;
        throw error;
    }

    return {
        normalizedSlot,
        start,
        end,
    };
};

const overlapsTimeRange = (left, right) => left.start < right.end && right.start < left.end;

const normalizeAvailabilityDate = (dateValue) => {
    const normalized = normalizeOptionalText(dateValue);
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
};

const normalizeAvailabilitySettings = (doctor) => {
    const fallback = createDefaultDoctorAvailabilitySettings();
    const settings = doctor?.availabilitySettings || fallback;

    const availableTimeSlots = [...new Set((settings.availableTimeSlots || fallback.availableTimeSlots).map(validateTimeSlot))]
        .sort((left, right) => parseSlotToRange(left).start - parseSlotToRange(right).start);

    const blockedDates = (settings.blockedDates || []).map((entry) => ({
        date: normalizeAvailabilityDate(entry?.date),
        label: normalizeOptionalText(entry?.label),
        type: normalizeOptionalText(entry?.type) || 'leave',
        notes: normalizeOptionalText(entry?.notes),
    })).filter((entry) => entry.date);

    const weeklyBreaks = (settings.weeklyBreaks || []).map((entry) => {
        const dayOfWeek = Number(entry?.dayOfWeek);
        const start = parseTimeToMinutes(entry?.startTime);
        const end = parseTimeToMinutes(entry?.endTime);

        return {
            dayOfWeek: Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : null,
            startTime: start === null ? '' : `${String(entry.startTime || '').slice(0, 5)}`,
            endTime: end === null ? '' : `${String(entry.endTime || '').slice(0, 5)}`,
            label: normalizeOptionalText(entry?.label),
            notes: normalizeOptionalText(entry?.notes),
            range: start !== null && end !== null ? { start, end } : null,
        };
    }).filter((entry) => Number.isInteger(entry.dayOfWeek) && entry.range);

    const emergencySlots = (settings.emergencySlots || []).map((entry) => {
        const normalizedDate = normalizeAvailabilityDate(entry?.date);
        const slotValue = `${normalizeOptionalText(entry?.startTime)}-${normalizeOptionalText(entry?.endTime)}`;
        const range = (() => {
            try {
                return parseSlotToRange(slotValue);
            } catch {
                return null;
            }
        })();

        if (!range) {
            return {
                date: normalizedDate,
                label: normalizeOptionalText(entry?.label),
                notes: normalizeOptionalText(entry?.notes),
                startTime: '',
                endTime: '',
                range: null,
            };
        }

        const [startTime, endTime] = range.normalizedSlot.split('-');
        return {
            date: normalizedDate,
            label: normalizeOptionalText(entry?.label),
            notes: normalizeOptionalText(entry?.notes),
            startTime,
            endTime,
            range: { start: range.start, end: range.end },
        };
    }).filter((entry) => entry.date && entry.range);

    return {
        maxAppointmentsPerDay: Number(settings.maxAppointmentsPerDay) || fallback.maxAppointmentsPerDay,
        availableTimeSlots,
        blockedDates,
        weeklyBreaks,
        emergencySlots,
    };
};

const getWeekdayFromDate = (dateValue) => {
    const normalized = normalizeAvailabilityDate(dateValue);
    if (!normalized) {
        return null;
    }

    const [year, month, day] = normalized.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date.getDay();
};

const getDoctorAvailabilityForDate = (doctor, dateValue) => {
    const settings = normalizeAvailabilitySettings(doctor);
    const normalizedDate = normalizeAvailabilityDate(dateValue);
    const weekday = getWeekdayFromDate(normalizedDate);
    const blockedDate = settings.blockedDates.find((entry) => entry.date === normalizedDate) || null;
    const dateEmergencySlots = settings.emergencySlots.filter((entry) => entry.date === normalizedDate);
    const weeklyBreaks = weekday === null
        ? []
        : settings.weeklyBreaks.filter((entry) => entry.dayOfWeek === weekday);

    const baseSlots = settings.availableTimeSlots
        .map((slot) => {
            const range = parseSlotToRange(slot);
            return { slot: range.normalizedSlot, range };
        })
        .filter(({ range }) => !weeklyBreaks.some((breakRule) => overlapsTimeRange(range, breakRule.range)))
        .map(({ slot }) => slot);

    const emergencySlots = dateEmergencySlots.map((entry) => `${entry.startTime}-${entry.endTime}`);
    const availableSlots = blockedDate && emergencySlots.length === 0
        ? []
        : [...new Set([...baseSlots, ...emergencySlots])]
            .sort((left, right) => parseSlotToRange(left).start - parseSlotToRange(right).start);

    return {
        ...settings,
        blockedDate,
        weeklyBreaks: weeklyBreaks.map(({ range: _range, ...entry }) => entry),
        emergencySlots: dateEmergencySlots.map(({ range: _range, ...entry }) => entry),
        availableSlots,
    };
};

const ensureFutureDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
        const error = new Error('Appointment date must use YYYY-MM-DD format.');
        error.statusCode = 400;
        throw error;
    }

    if (date <= formatLocalDate()) {
        const error = new Error('Appointments can only be booked for a future date.');
        error.statusCode = 400;
        throw error;
    }
};

const getDoctorForAppointments = async (doctorId) => {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isVerified: true });
    if (!doctor) {
        const error = new Error('Doctor not found or not available for booking.');
        error.statusCode = 404;
        throw error;
    }
    return doctor;
};

const getAvailabilityForDoctor = async (doctorId, date) => {
    ensureFutureDate(date);

    const doctor = await getDoctorForAppointments(doctorId);
    const settings = getDoctorAvailabilityForDate(doctor, date);

    const activeAppointments = await Appointment.find({
        doctor: doctorId,
        date,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    }).select('slot status');

    const bookedSlots = activeAppointments.map((appointment) => normalizeSlot(appointment.slot));
    const uniqueBookedSlots = [...new Set(bookedSlots)];
    const remainingCapacity = Math.max(settings.availableSlots.length - activeAppointments.length, 0);
    const dailyLimitReached = settings.availableSlots.length === 0 || activeAppointments.length >= settings.availableSlots.length;
    const availableSlots = dailyLimitReached
        ? []
        : settings.availableSlots.filter((slot) => !uniqueBookedSlots.includes(slot));

    return {
        date,
        maxAppointmentsPerDay: settings.maxAppointmentsPerDay,
        activeAppointmentsCount: activeAppointments.length,
        remainingCapacity,
        dailyLimitReached,
        configuredSlots: settings.availableTimeSlots,
        bookedSlots: uniqueBookedSlots,
        availableSlots,
        blockedDate: settings.blockedDate,
        weeklyBreaks: settings.weeklyBreaks,
        emergencySlots: settings.emergencySlots,
    };
};

const normalizeOptionalText = (value) => String(value || '').trim();
const normalizeBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';
const UPLOADS_DIR = path.resolve(__dirname, '../../../../uploads');
const KHALTI_PAYMENT_PROVIDER = 'khalti';

const getDoctorConsultationFee = (doctor) => {
    const fee = Number(doctor?.consultationFee);
    return Number.isFinite(fee) && fee >= 0 ? fee : config.defaultConsultationFee;
};

const ensureKhaltiIsEnabled = () => {
    if (!config.khalti.enabled) {
        const error = new Error('Khalti payment is not configured on the server.');
        error.statusCode = 503;
        throw error;
    }
};

const toPaisaAmount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.round(numericValue * 100) : 0;
};

const buildStoredAppointmentPayload = ({ doctor, patient, date, normalizedSlot, payload = {} }) => ({
    doctorId: doctor._id,
    patientId: patient._id,
    date,
    slot: normalizedSlot,
    previousMedicalCondition: normalizeOptionalText(payload?.previousMedicalCondition),
    symptoms: normalizeOptionalText(payload?.symptoms),
    reportTitle: normalizeOptionalText(payload?.reportTitle),
    reportFileName: normalizeOptionalText(payload?.reportFileName),
    reportFileData: normalizeOptionalText(payload?.reportFileData),
    reportReviewNote: normalizeOptionalText(payload?.reportReviewNote),
});

const getExistingPaymentAppointmentResult = async (paymentSession) => {
    if (!paymentSession?.appointment) {
        return null;
    }

    const existingAppointment = await populateDoctorAppointment(Appointment.findById(paymentSession.appointment));
    if (!existingAppointment) {
        return null;
    }

    return {
        appointment: sanitizeAppointment(existingAppointment),
        payment: {
            provider: paymentSession.provider,
            status: paymentSession.status,
            amount: paymentSession.amount,
            currency: paymentSession.currency || 'NPR',
            transactionUuid: paymentSession.transactionUuid,
            referenceId: paymentSession.referenceId || '',
            providerSessionId: paymentSession.providerSessionId || '',
        },
    };
};

const expirePaymentSessionIfNeeded = async (paymentSession) => {
    if (!paymentSession?.expiresAt || paymentSession.expiresAt.getTime() >= Date.now()) {
        return;
    }

    paymentSession.status = 'expired';
    paymentSession.failedAt = paymentSession.failedAt || new Date();
    await paymentSession.save();

    const error = new Error('This payment session has expired. Please start the booking again.');
    error.statusCode = 410;
    throw error;
};

const finalizeSuccessfulPaymentSession = async ({
    paymentSession,
    provider,
    referenceId,
    providerSessionId = '',
}) => {
    const appointment = await createAppointment({
        ...paymentSession.appointmentPayload,
        payment: {
            provider,
            status: 'paid',
            amount: paymentSession.amount,
            currency: paymentSession.currency || 'NPR',
            transactionUuid: paymentSession.transactionUuid,
            referenceId: normalizeOptionalText(referenceId),
            paidAt: new Date(),
        },
    });

    paymentSession.status = 'paid';
    paymentSession.referenceId = normalizeOptionalText(referenceId);
    paymentSession.providerSessionId = normalizeOptionalText(providerSessionId || paymentSession.providerSessionId);
    paymentSession.paidAt = new Date();
    paymentSession.appointment = appointment?._id || null;
    await paymentSession.save();

    return {
        appointment,
        payment: {
            provider,
            status: 'paid',
            amount: paymentSession.amount,
            currency: paymentSession.currency || 'NPR',
            transactionUuid: paymentSession.transactionUuid,
            referenceId: paymentSession.referenceId,
            providerSessionId: paymentSession.providerSessionId || '',
        },
    };
};

const ensureUploadsDir = async () => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
};

const sanitizeFileName = (value) =>
    String(value || 'report')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'report';

const getExtensionFromMimeType = (mimeType) => {
    const lookup = {
        'application/pdf': '.pdf',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/webp': '.webp',
    };

    return lookup[String(mimeType || '').toLowerCase()] || '';
};

const parseUploadData = (value) => {
    const match = String(value || '').match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
        const error = new Error('Upload data is invalid.');
        error.statusCode = 400;
        throw error;
    }

    return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], 'base64'),
    };
};

const buildMedicalDocumentEntry = async ({
    appointmentId,
    title,
    fileName,
    fileData,
    reviewNote = '',
    uploadedByRole = 'patient',
}) => {
    const parsedUpload = parseUploadData(fileData);
    const safeBaseName = sanitizeFileName(fileName.replace(/\.[^.]+$/, ''));
    const extension = path.extname(fileName) || getExtensionFromMimeType(parsedUpload.mimeType) || '';
    const storedFileName = `${appointmentId}-${Date.now()}-${safeBaseName}${extension}`;
    const relativeFilePath = path.posix.join('uploads', storedFileName);
    const absoluteFilePath = path.join(UPLOADS_DIR, storedFileName);

    await ensureUploadsDir();
    await fs.writeFile(absoluteFilePath, parsedUpload.buffer);

    return {
        title,
        fileName: storedFileName,
        fileUrl: `/${relativeFilePath.replace(/\\/g, '/')}`,
        mimeType: parsedUpload.mimeType,
        reviewNote,
        uploadedByRole,
        uploadedAt: new Date(),
    };
};

const populateDoctorAppointment = (query) =>
    query
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role consultationFee')
        .populate('patient', 'name email phone role');

const clearAppointmentChangeRequests = (appointment) => {
    appointment.rescheduleRequestedDate = '';
    appointment.rescheduleRequestedSlot = '';
    appointment.rescheduleRequestedReason = '';
    appointment.rescheduleRequestedByRole = '';
    appointment.rescheduleRequestedAt = null;
    appointment.cancellationRequestedReason = '';
    appointment.cancellationRequestedByRole = '';
    appointment.cancellationRequestedAt = null;
};

const clearAppointmentReminderState = (appointment) => {
    appointment.reminderLeadMinutesSent = [];
};

const ensureAppointmentSlotAvailability = async ({ appointmentId, doctorId, date, slot }) => {
    ensureFutureDate(date);
    const normalizedSlot = validateTimeSlot(slot);
    const doctor = await getDoctorForAppointments(doctorId);
    const settings = getDoctorAvailabilityForDate(doctor, date);

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    const activeAppointmentsCount = await Appointment.countDocuments({
        doctor: doctorId,
        date,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
        _id: { $ne: appointmentId },
    });

    if (settings.availableSlots.length === 0) {
        const error = new Error('Doctor is unavailable on the selected date.');
        error.statusCode = 409;
        throw error;
    }

    if (!settings.availableSlots.includes(normalizedSlot)) {
        const error = new Error('Selected time slot is not part of the doctor availability for that date.');
        error.statusCode = 400;
        throw error;
    }

    if (activeAppointmentsCount >= settings.availableSlots.length) {
        const error = new Error('Doctor has reached the maximum number of appointments for that day.');
        error.statusCode = 409;
        throw error;
    }

    const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointmentId },
        doctor: doctorId,
        date,
        slot: normalizedSlot,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });

    if (conflictingAppointment) {
        const error = new Error('That time slot has already been booked.');
        error.statusCode = 409;
        throw error;
    }

    return { normalizedSlot };
};

const buildAppointmentBookingContext = async ({ doctorId, patientId, date, slot }) => {
    ensureFutureDate(date);
    const normalizedSlot = validateTimeSlot(slot);

    const [doctor, patient] = await Promise.all([
        getDoctorForAppointments(doctorId),
        User.findOne({ _id: patientId, role: 'patient' }),
    ]);

    if (!patient) {
        const error = new Error('Patient account not found.');
        error.statusCode = 404;
        throw error;
    }

    const settings = getDoctorAvailabilityForDate(doctor, date);
    const activeAppointmentsCount = await Appointment.countDocuments({
        doctor: doctorId,
        date,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });

    if (settings.availableSlots.length === 0) {
        const error = new Error('Doctor is unavailable on the selected date.');
        error.statusCode = 409;
        throw error;
    }

    if (!settings.availableSlots.includes(normalizedSlot)) {
        const error = new Error('Selected time slot is not part of the doctor availability for that date.');
        error.statusCode = 400;
        throw error;
    }

    if (activeAppointmentsCount >= settings.availableSlots.length) {
        const error = new Error('Doctor has reached the maximum number of appointments for that day.');
        error.statusCode = 409;
        throw error;
    }

    return {
        doctor,
        patient,
        normalizedSlot,
    };
};

const createAppointment = async ({
    doctorId,
    patientId,
    date,
    slot,
    previousMedicalCondition,
    symptoms,
    reportTitle,
    reportFileName,
    reportFileData,
    reportReviewNote,
    status = 'pending',
    createdByRole = 'patient',
    payment = null,
}) => {
    const normalizedStatus = normalizeOptionalText(status);
    const appointmentStatus = ['pending', 'confirmed'].includes(normalizedStatus)
        ? normalizedStatus
        : 'pending';
    const { doctor, patient, normalizedSlot } = await buildAppointmentBookingContext({
        doctorId,
        patientId,
        date,
        slot,
    });

    try {
        const appointmentId = new mongoose.Types.ObjectId();
        const medicalDocuments = [];

        if (reportTitle || reportFileName || reportFileData) {
            if (!reportTitle) {
                const error = new Error('Report title is required when attaching a report.');
                error.statusCode = 400;
                throw error;
            }

            if (!reportFileName) {
                const error = new Error('A report file is required when attaching a report.');
                error.statusCode = 400;
                throw error;
            }

            if (!reportFileData) {
                const error = new Error('A report file is required when attaching a report.');
                error.statusCode = 400;
                throw error;
            }

            medicalDocuments.push(await buildMedicalDocumentEntry({
                appointmentId,
                title: reportTitle,
                fileName: reportFileName,
                fileData: reportFileData,
                reviewNote: normalizeOptionalText(reportReviewNote),
                uploadedByRole: 'patient',
            }));
        }

        const appointment = await Appointment.create({
            _id: appointmentId,
            doctor: doctorId,
            patient: patientId,
            date,
            slot: normalizedSlot,
            status: appointmentStatus,
            activeSlotKey: `${doctorId}:${date}:${normalizedSlot}`,
            previousMedicalCondition: normalizeOptionalText(previousMedicalCondition),
            symptoms: normalizeOptionalText(symptoms),
            payment: payment ? {
                provider: normalizeOptionalText(payment.provider),
                status: normalizeOptionalText(payment.status),
                amount: Number(payment.amount) || 0,
                currency: normalizeOptionalText(payment.currency) || 'NPR',
                transactionUuid: normalizeOptionalText(payment.transactionUuid),
                referenceId: normalizeOptionalText(payment.referenceId),
                paidAt: payment.paidAt || null,
            } : undefined,
            medicalDocuments,
        });

        const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
        if (createdByRole !== 'doctor') {
            notifySafely({
                recipientId: doctor._id,
                type: 'appointment-request',
                title: 'New appointment request',
                message: `${patient.name} requested an appointment.${medicalDocuments.length ? ' They attached a report.' : ''}`,
                link: `/doctor/appointments/${appointment._id}`,
                createdByRole: 'patient',
                metadata: {
                    appointmentId: appointment._id.toString(),
                    doctorId: doctor._id.toString(),
                    patientId: patient._id.toString(),
                    date,
                    slot: normalizedSlot,
                },
            });
        }

        return sanitizeAppointment(populatedAppointment);
    } catch (error) {
        if (error?.code === 11000) {
            const duplicateError = new Error('That time slot has already been booked.');
            duplicateError.statusCode = 409;
            throw duplicateError;
        }

        throw error;
    }
};

const createKhaltiPaymentSession = async ({ patientId, payload = {} }) => {
    ensureKhaltiIsEnabled();

    const doctorId = payload?.doctorId;
    const date = normalizeOptionalText(payload?.date);
    const slot = normalizeOptionalText(payload?.slot);

    const { doctor, patient, normalizedSlot } = await buildAppointmentBookingContext({
        doctorId,
        patientId,
        date,
        slot,
    });

    const amount = getDoctorConsultationFee(doctor);
    const amountInPaisa = toPaisaAmount(amount);
    const transactionUuid = `${Date.now()}-${new mongoose.Types.ObjectId().toString().slice(-8)}`;
    const returnUrl = `${config.clientUrl}/patient/payment/khalti/success?session=${transactionUuid}`;

    const initiateResponse = await fetch(config.khalti.initiateUrl, {
        method: 'POST',
        headers: {
            Authorization: `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            return_url: returnUrl,
            website_url: config.clientUrl,
            amount: amountInPaisa,
            purchase_order_id: transactionUuid,
            purchase_order_name: `Doctor appointment with ${doctor.name || 'doctor'}`,
            customer_info: {
                name: patient.name || 'Patient',
                email: patient.email || '',
                phone: patient.phone || '',
            },
        }),
    });

    const initiatePayload = await initiateResponse.json().catch(() => null);
    if (!initiateResponse.ok || !initiatePayload?.pidx || !initiatePayload?.payment_url) {
        const error = new Error(initiatePayload?.detail || initiatePayload?.message || 'Unable to start Khalti payment.');
        error.statusCode = 502;
        throw error;
    }

    const paymentSession = await PaymentSession.create({
        provider: KHALTI_PAYMENT_PROVIDER,
        status: 'initiated',
        patient: patient._id,
        doctor: doctor._id,
        amount,
        currency: 'NPR',
        transactionUuid,
        providerSessionId: normalizeOptionalText(initiatePayload.pidx),
        productCode: 'appointment-booking',
        appointmentPayload: buildStoredAppointmentPayload({
            doctor,
            patient,
            date,
            normalizedSlot,
            payload,
        }),
        expiresAt: initiatePayload.expires_at ? new Date(initiatePayload.expires_at) : new Date(Date.now() + (30 * 60 * 1000)),
    });

    return {
        sessionId: paymentSession._id.toString(),
        provider: KHALTI_PAYMENT_PROVIDER,
        amount,
        currency: 'NPR',
        doctor: sanitizeUser(doctor),
        redirectUrl: initiatePayload.payment_url,
        pidx: initiatePayload.pidx,
        expiresAt: initiatePayload.expires_at || null,
    };
};

const verifyKhaltiPaymentSession = async ({ sessionId, patientId, pidx }) => {
    ensureKhaltiIsEnabled();

    const paymentSession = await PaymentSession.findOne({
        transactionUuid: sessionId,
        patient: patientId,
        provider: KHALTI_PAYMENT_PROVIDER,
    });

    if (!paymentSession) {
        const error = new Error('Payment session not found.');
        error.statusCode = 404;
        throw error;
    }

    const existingResult = await getExistingPaymentAppointmentResult(paymentSession);
    if (existingResult) {
        return existingResult;
    }

    await expirePaymentSessionIfNeeded(paymentSession);

    const normalizedPidx = normalizeOptionalText(pidx);
    if (!normalizedPidx || normalizedPidx !== normalizeOptionalText(paymentSession.providerSessionId)) {
        const error = new Error('The Khalti payment reference does not match this session.');
        error.statusCode = 400;
        throw error;
    }

    const lookupResponse = await fetch(config.khalti.lookupUrl, {
        method: 'POST',
        headers: {
            Authorization: `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: normalizedPidx }),
    });

    const lookupPayload = await lookupResponse.json().catch(() => null);
    if (!lookupResponse.ok || !lookupPayload) {
        const error = new Error(lookupPayload?.detail || lookupPayload?.message || 'Unable to confirm the Khalti payment.');
        error.statusCode = 502;
        throw error;
    }

    const lookupStatus = normalizeOptionalText(lookupPayload.status).toLowerCase();
    if (lookupStatus !== 'completed') {
        paymentSession.status = lookupStatus || 'failed';
        paymentSession.failedAt = paymentSession.failedAt || new Date();
        paymentSession.verificationPayload = lookupPayload;
        await paymentSession.save();

        const error = new Error('Khalti did not confirm this payment as completed.');
        error.statusCode = 400;
        throw error;
    }

    if (
        normalizeOptionalText(lookupPayload.pidx) !== normalizeOptionalText(paymentSession.providerSessionId)
        || Number(lookupPayload.total_amount) !== toPaisaAmount(paymentSession.amount)
    ) {
        const error = new Error('The Khalti lookup response does not match the original payment request.');
        error.statusCode = 400;
        throw error;
    }

    paymentSession.verificationPayload = lookupPayload;
    return finalizeSuccessfulPaymentSession({
        paymentSession,
        provider: KHALTI_PAYMENT_PROVIDER,
        referenceId: lookupPayload.transaction_id || lookupPayload.pidx,
        providerSessionId: lookupPayload.pidx,
    });
};

const rescheduleAppointment = async ({
    appointmentId,
    actorId,
    actorRole,
    date,
    slot,
    reason = '',
}) => {
    const query = actorRole === 'doctor'
        ? { _id: appointmentId, doctor: actorId }
        : { _id: appointmentId, patient: actorId };

    const appointment = await Appointment.findOne(query)
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role consultationFee')
        .populate('patient', 'name email phone role');

    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (['completed', 'cancelled', 'rejected'].includes(appointment.status)) {
        const error = new Error('This appointment can no longer be rescheduled.');
        error.statusCode = 400;
        throw error;
    }

    const normalizedReason = normalizeOptionalText(reason);

    const requestedDate = normalizeOptionalText(date) || appointment.rescheduleRequestedDate || '';
    const requestedSlot = normalizeOptionalText(slot) || appointment.rescheduleRequestedSlot || '';

    if (actorRole === 'patient' && appointment.status === 'confirmed') {
        if (!requestedDate || !requestedSlot) {
            const error = new Error('Please choose a new date and time slot to request a reschedule.');
            error.statusCode = 400;
            throw error;
        }

        appointment.rescheduleRequestedDate = requestedDate;
        appointment.rescheduleRequestedSlot = requestedSlot;
        appointment.rescheduleRequestedReason = normalizedReason;
        appointment.rescheduleRequestedByRole = 'patient';
        appointment.rescheduleRequestedAt = new Date();
        appointment.cancellationRequestedReason = '';
        appointment.cancellationRequestedByRole = '';
        appointment.cancellationRequestedAt = null;
        await appointment.save();

        notifySafely({
            recipientId: appointment.doctor?._id,
            type: 'appointment-reschedule-request',
            title: 'Reschedule requested',
            message: `${appointment.patient?.name || 'A patient'} requested to reschedule the appointment.`,
            link: `/doctor/appointments/${appointment._id}`,
            createdByRole: 'patient',
            metadata: {
                appointmentId: appointment._id.toString(),
                doctorId: appointment.doctor?._id?.toString(),
                patientId: appointment.patient?._id?.toString(),
                requestedDate,
                requestedSlot,
            },
        });

        return sanitizeAppointment(await populateDoctorAppointment(Appointment.findById(appointment._id)));
    }

    if (!requestedDate || !requestedSlot) {
        const error = new Error('A new date and time slot are required to reschedule this appointment.');
        error.statusCode = 400;
        throw error;
    }

    const { normalizedSlot } = await ensureAppointmentSlotAvailability({
        appointmentId: appointment._id,
        doctorId: appointment.doctor._id,
        date: requestedDate,
        slot: requestedSlot,
    });

    appointment.date = requestedDate;
    appointment.slot = normalizedSlot;
    appointment.activeSlotKey = `${appointment.doctor._id.toString()}:${requestedDate}:${normalizedSlot}`;
    clearAppointmentChangeRequests(appointment);
    clearAppointmentReminderState(appointment);
    appointment.status = appointment.status === 'pending' ? 'pending' : appointment.status;

    await appointment.save();

    const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
    notifySafely({
        recipientId: actorRole === 'doctor' ? appointment.patient?._id : appointment.doctor?._id,
        type: actorRole === 'doctor' ? 'appointment-rescheduled' : 'appointment-reschedule-approved',
        title: 'Appointment rescheduled',
        message: `Your appointment has been rescheduled to ${requestedDate}.`,
        link: actorRole === 'doctor' ? '/patient/appointments' : `/doctor/appointments/${appointment._id}`,
        createdByRole: actorRole,
        metadata: {
            appointmentId: appointment._id.toString(),
            doctorId: appointment.doctor?._id?.toString(),
            patientId: appointment.patient?._id?.toString(),
            date: requestedDate,
            slot: normalizedSlot,
        },
    });

    return sanitizeAppointment(populatedAppointment);
};

const cancelAppointment = async ({
    appointmentId,
    actorId,
    actorRole,
    reason = '',
}) => {
    const query = actorRole === 'doctor'
        ? { _id: appointmentId, doctor: actorId }
        : { _id: appointmentId, patient: actorId };

    const appointment = await Appointment.findOne(query)
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role consultationFee')
        .populate('patient', 'name email phone role');

    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (['completed', 'cancelled', 'rejected'].includes(appointment.status)) {
        const error = new Error('This appointment can no longer be cancelled.');
        error.statusCode = 400;
        throw error;
    }

    const normalizedReason = normalizeOptionalText(reason);

    if (actorRole === 'patient' && appointment.status === 'confirmed') {
        if (!normalizedReason) {
            const error = new Error('Please add a cancellation reason.');
            error.statusCode = 400;
            throw error;
        }

        appointment.cancellationRequestedReason = normalizedReason;
        appointment.cancellationRequestedByRole = 'patient';
        appointment.cancellationRequestedAt = new Date();
        appointment.rescheduleRequestedDate = '';
        appointment.rescheduleRequestedSlot = '';
        appointment.rescheduleRequestedReason = '';
        appointment.rescheduleRequestedByRole = '';
        appointment.rescheduleRequestedAt = null;
        await appointment.save();

        notifySafely({
            recipientId: appointment.doctor?._id,
            type: 'appointment-cancel-request',
            title: 'Cancellation requested',
            message: `${appointment.patient?.name || 'A patient'} requested to cancel the appointment.`,
            link: `/doctor/appointments/${appointment._id}`,
            createdByRole: 'patient',
            metadata: {
                appointmentId: appointment._id.toString(),
                doctorId: appointment.doctor?._id?.toString(),
                patientId: appointment.patient?._id?.toString(),
            },
        });

        return sanitizeAppointment(await populateDoctorAppointment(Appointment.findById(appointment._id)));
    }

    const finalCancellationReason = normalizedReason || appointment.cancellationRequestedReason || '';
    if (!finalCancellationReason) {
        const error = new Error('Please add a cancellation reason.');
        error.statusCode = 400;
        throw error;
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancelledByRole = actorRole;
    appointment.cancellationReason = finalCancellationReason;
    appointment.activeSlotKey = undefined;
    clearAppointmentChangeRequests(appointment);
    clearAppointmentReminderState(appointment);
    await appointment.save();

    const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
    notifySafely({
        recipientId: actorRole === 'doctor' ? appointment.patient?._id : appointment.doctor?._id,
        type: actorRole === 'doctor' ? 'appointment-cancelled' : 'appointment-cancelled',
        title: 'Appointment cancelled',
        message: `Your appointment scheduled for ${appointment.date} has been cancelled.`,
        link: actorRole === 'doctor' ? '/patient/appointments' : `/doctor/appointments/${appointment._id}`,
        createdByRole: actorRole,
        metadata: {
            appointmentId: appointment._id.toString(),
            doctorId: appointment.doctor?._id?.toString(),
            patientId: appointment.patient?._id?.toString(),
        },
    });

    return sanitizeAppointment(populatedAppointment);
};

const createDoctorFollowUpAppointment = async ({ doctorId, patientId, date, slot }) =>
    createAppointment({
        doctorId,
        patientId,
        date,
        slot,
        previousMedicalCondition: '',
        symptoms: 'Follow-up visit',
        status: 'confirmed',
        createdByRole: 'doctor',
    }).then(async (appointment) => {
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (doctor) {
            notifySafely({
                recipientId: patientId,
                type: 'follow-up',
                title: 'Follow-up scheduled',
                message: `Dr. ${doctor.name || 'your doctor'} scheduled a follow-up appointment.`,
                link: '/patient/appointments',
                createdByRole: 'doctor',
                metadata: {
                    appointmentId: appointment._id.toString(),
                    doctorId: doctor._id.toString(),
                    patientId,
                    date,
                    slot,
                },
            });
        }

        return appointment;
    });

const listPatientAppointments = async (patientId) => {
    const appointments = await populateDoctorAppointment(Appointment.find({ patient: patientId }))
        .sort({ date: 1, slot: 1, createdAt: -1 });

    return appointments.map(sanitizeAppointment);
};

const listDoctorAppointments = async (doctorId) => {
    const appointments = await populateDoctorAppointment(Appointment.find({ doctor: doctorId }))
        .sort({ date: 1, slot: 1, createdAt: -1 });

    return appointments.map(sanitizeAppointment);
};

const compareAppointmentOrder = (left, right) => `${left?.date || ''}-${left?.slot || ''}`.localeCompare(`${right?.date || ''}-${right?.slot || ''}`);

const notifySafely = (payload) => {
    void createNotification(payload).catch((error) => {
        console.error('Failed to create notification:', error.message);
    });
};

const listDoctorPatients = async (doctorId) => {
    const appointments = await populateDoctorAppointment(Appointment.find({ doctor: doctorId }))
        .sort({ date: 1, slot: 1, createdAt: 1 });

    const patients = new Map();

    appointments.forEach((appointment) => {
        const patientId = appointment?.patient?._id ? String(appointment.patient._id) : '';
        if (!patientId) {
            return;
        }

        if (!patients.has(patientId)) {
            patients.set(patientId, {
                patient: sanitizeUser(appointment.patient),
                totalAppointments: 0,
                completedAppointments: 0,
                pendingAppointments: 0,
                latestAppointment: null,
                latestCompletedAppointment: null,
                appointments: [],
            });
        }

        const entry = patients.get(patientId);
        const sanitizedAppointment = sanitizeAppointment(appointment);

        entry.totalAppointments += 1;
        if (appointment.status === 'completed') {
            entry.completedAppointments += 1;
            entry.latestCompletedAppointment = sanitizedAppointment;
        } else if (['pending', 'confirmed'].includes(appointment.status)) {
            entry.pendingAppointments += 1;
        }

        entry.appointments.push(sanitizedAppointment);

        if (!entry.latestAppointment || compareAppointmentOrder(appointment, entry.latestAppointment) >= 0) {
            entry.latestAppointment = sanitizedAppointment;
        }
    });

    return [...patients.values()].sort((a, b) => compareAppointmentOrder(b.latestAppointment, a.latestAppointment));
};

const updateAppointmentStatus = async ({ appointmentId, doctorId, status }) => {
    if (!['confirmed', 'rejected'].includes(status)) {
        const error = new Error('Appointment status can only be changed to confirmed or rejected.');
        error.statusCode = 400;
        throw error;
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctorId });
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.status !== 'pending') {
        const error = new Error('Only pending appointments can be updated.');
        error.statusCode = 400;
        throw error;
    }

    appointment.status = status;
    if (status === 'rejected') {
        appointment.activeSlotKey = undefined;
    }
    clearAppointmentChangeRequests(appointment);
    clearAppointmentReminderState(appointment);

    await appointment.save();

    const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
    notifySafely({
        recipientId: populatedAppointment.patient._id,
        type: status === 'confirmed' ? 'appointment-confirmed' : 'appointment-rejected',
        title: status === 'confirmed' ? 'Appointment confirmed' : 'Appointment rejected',
        message: status === 'confirmed'
            ? 'Your appointment has been confirmed.'
            : 'Your appointment has been rejected.',
        link: '/patient/appointments',
        createdByRole: 'doctor',
        metadata: {
            appointmentId: appointment._id.toString(),
            doctorId: doctorId.toString(),
            patientId: populatedAppointment.patient._id.toString(),
            date: populatedAppointment.date,
            slot: populatedAppointment.slot,
        },
    });

    return sanitizeAppointment(populatedAppointment);
};

const getDoctorAppointmentById = async (doctorId, appointmentId) => {
    const appointment = await populateDoctorAppointment(
        Appointment.findOne({ _id: appointmentId, doctor: doctorId })
    );

    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    return sanitizeAppointment(appointment);
};

const buildPatientTimelineEvent = ({
    appointment,
    type,
    title,
    timestamp,
    summary = '',
    details = [],
    appointmentId = appointment?._id?.toString() || '',
    status = appointment?.status || '',
    link = '',
    actionLabel = 'Open visit',
}) => {
    const resolvedTimestamp = timestamp ? new Date(timestamp) : null;
    return {
        id: `${appointmentId || 'event'}:${type}:${resolvedTimestamp ? resolvedTimestamp.toISOString() : Date.now()}`,
        type,
        title,
        summary,
        details: details.filter(Boolean),
        timestamp: resolvedTimestamp ? resolvedTimestamp.toISOString() : null,
        appointmentId,
        status,
        link,
        actionLabel,
    };
};

const getAppointmentTimelineForPatient = (appointment) => {
    const events = [];
    const visitDate = appointment.date ? new Date(`${appointment.date}T00:00:00`) : null;
    const appointmentLink = `/doctor/appointments/${appointment._id}`;

    events.push(
        buildPatientTimelineEvent({
            appointment,
            type: 'appointment-requested',
            title: appointment.status === 'confirmed' ? 'Appointment confirmed' : 'Appointment requested',
            timestamp: appointment.createdAt || visitDate,
            summary: `${appointment.date || 'Unknown date'} at ${appointment.slot || 'Unknown slot'}`,
            details: [
                appointment.previousMedicalCondition && `Previous condition: ${appointment.previousMedicalCondition}`,
                appointment.symptoms && `Symptoms: ${appointment.symptoms}`,
            ],
            link: appointmentLink,
        })
    );

    if (appointment.rescheduleRequestedAt) {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'reschedule-requested',
                title: 'Reschedule requested',
                timestamp: appointment.rescheduleRequestedAt,
                summary: `${appointment.rescheduleRequestedDate || appointment.date || 'Unknown date'}${appointment.rescheduleRequestedSlot ? ` at ${appointment.rescheduleRequestedSlot}` : ''}`,
                details: [
                    appointment.rescheduleRequestedReason && `Reason: ${appointment.rescheduleRequestedReason}`,
                    appointment.rescheduleRequestedByRole ? `Requested by ${appointment.rescheduleRequestedByRole}` : '',
                ],
                link: appointmentLink,
            })
        );
    }

    if (appointment.cancellationRequestedAt) {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'cancellation-requested',
                title: 'Cancellation requested',
                timestamp: appointment.cancellationRequestedAt,
                summary: appointment.cancellationRequestedReason || 'Cancellation requested by the patient',
                details: [
                    appointment.cancellationRequestedByRole ? `Requested by ${appointment.cancellationRequestedByRole}` : '',
                ],
                link: appointmentLink,
            })
        );
    }

    if (appointment.scanRequestedAt || appointment.scanRequestNote) {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'scan-request',
                title: 'Report requested',
                timestamp: appointment.scanRequestedAt || appointment.updatedAt || appointment.createdAt || visitDate,
                summary: appointment.scanRequestNote || 'Doctor requested a report or scan',
                details: [],
                link: appointmentLink,
                actionLabel: 'Open request',
            })
        );
    }

    if (appointment.consultationNotes || appointment.diagnosis || appointment.prescription || appointment.doctorAdvice || appointment.recommendedTests || appointment.visitOutcome) {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'consultation-updated',
                title: appointment.status === 'completed' ? 'Consultation completed' : 'Consultation updated',
                timestamp: appointment.completedAt || appointment.updatedAt || appointment.createdAt || visitDate,
                summary: appointment.consultationNotes || appointment.visitOutcome || 'Consultation details recorded',
                details: [
                    appointment.diagnosis && `Diagnosis: ${appointment.diagnosis}`,
                    appointment.prescription && `Prescription: ${appointment.prescription}`,
                    appointment.doctorAdvice && `Advice: ${appointment.doctorAdvice}`,
                    appointment.recommendedTests && `Tests: ${appointment.recommendedTests}`,
                    appointment.visitOutcome && `Outcome: ${appointment.visitOutcome}`,
                ],
                link: appointmentLink,
                actionLabel: 'Open consultation',
            })
        );
    }

    if (appointment.followUpRequired) {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'follow-up',
                title: 'Follow-up needed',
                timestamp: appointment.updatedAt || appointment.createdAt || visitDate,
                summary: appointment.followUpDate ? `Follow-up due on ${appointment.followUpDate}` : 'Follow-up required',
                details: [],
                link: appointmentLink,
                actionLabel: 'Open follow-up',
            })
        );
    }

    if (appointment.medicalDocuments?.length) {
        appointment.medicalDocuments.forEach((document) => {
            events.push(
                buildPatientTimelineEvent({
                    appointment,
                    type: 'report-uploaded',
                    title: document.title || 'Uploaded report',
                    timestamp: document.uploadedAt || appointment.updatedAt || appointment.createdAt || visitDate,
                    summary: `${document.uploadedByRole === 'doctor' ? 'Doctor' : 'Patient'} uploaded a report`,
                    details: [
                        document.reviewNote && `Note: ${document.reviewNote}`,
                        document.fileName && `File: ${document.fileName}`,
                    ],
                    link: appointmentLink,
                })
            );
        });
    }

    if (appointment.status === 'completed' || appointment.completedAt) {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'visit-completed',
                title: 'Visit completed',
                timestamp: appointment.completedAt || appointment.updatedAt || appointment.createdAt || visitDate,
                summary: appointment.visitOutcome || appointment.diagnosis || 'The visit was marked completed.',
                details: [],
                link: appointmentLink,
            })
        );
    } else if (appointment.status === 'cancelled' || appointment.status === 'rejected') {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'visit-closed',
                title: appointment.status === 'cancelled' ? 'Appointment cancelled' : 'Appointment rejected',
                timestamp: appointment.cancelledAt || appointment.updatedAt || appointment.createdAt || visitDate,
                summary: appointment.cancellationReason || 'This appointment is no longer active.',
                details: [],
                link: appointmentLink,
            })
        );
    } else if (appointment.status === 'confirmed') {
        events.push(
            buildPatientTimelineEvent({
                appointment,
                type: 'visit-confirmed',
                title: 'Appointment confirmed',
                timestamp: appointment.updatedAt || appointment.createdAt || visitDate,
                summary: `${appointment.date || 'Unknown date'} at ${appointment.slot || 'Unknown slot'}`,
                details: [],
                link: appointmentLink,
            })
        );
    }

    return events;
};

const getDoctorPatientRecord = async (doctorId, patientId) => {
    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
        const error = new Error('Patient not found.');
        error.statusCode = 404;
        throw error;
    }

    const appointments = await populateDoctorAppointment(
        Appointment.find({ doctor: doctorId, patient: patientId })
    ).sort({ date: 1, slot: 1, createdAt: 1 });

    const sanitizedAppointments = appointments.map(sanitizeAppointment);
    const latestAppointment = sanitizedAppointments.length
        ? sanitizedAppointments[sanitizedAppointments.length - 1]
        : null;
    const latestCompletedAppointment = [...sanitizedAppointments].reverse().find((item) => item.status === 'completed') || null;
    const latestFollowUpAppointment = [...sanitizedAppointments].reverse().find((item) => item.followUpRequired) || null;
    const timeline = sanitizedAppointments
        .flatMap((appointment) => getAppointmentTimelineForPatient(appointment))
        .filter((event) => Boolean(event.timestamp))
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

    return {
        patient: sanitizeUser(patient),
        record: {
            totalAppointments: sanitizedAppointments.length,
            completedAppointments: sanitizedAppointments.filter((item) => item.status === 'completed').length,
            pendingAppointments: sanitizedAppointments.filter((item) => ['pending', 'confirmed'].includes(item.status)).length,
            latestAppointment,
            latestCompletedAppointment,
            latestFollowUpAppointment,
            appointments: sanitizedAppointments,
            timeline,
        },
    };
};

const updateDoctorAppointmentConsultation = async ({ appointmentId, doctorId, payload = {} }) => {
    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctorId });
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (['rejected', 'cancelled'].includes(appointment.status)) {
        const error = new Error('Cancelled or rejected appointments cannot be updated.');
        error.statusCode = 400;
        throw error;
    }

    if (appointment.status === 'completed') {
        const error = new Error('Completed appointments cannot be edited.');
        error.statusCode = 400;
        throw error;
    }

    const previousScanRequestNote = appointment.scanRequestNote;
    const consultationNotes = normalizeOptionalText(payload.consultationNotes);
    const diagnosis = normalizeOptionalText(payload.diagnosis);
    const prescription = normalizeOptionalText(payload.prescription);
    const doctorAdvice = normalizeOptionalText(payload.doctorAdvice);
    const recommendedTests = normalizeOptionalText(payload.recommendedTests);
    const visitOutcome = normalizeOptionalText(payload.visitOutcome);
    const scanRequestNote = normalizeOptionalText(payload.scanRequestNote);
    const followUpDate = normalizeOptionalText(payload.followUpDate);
    const followUpRequired = normalizeBoolean(payload.followUpRequired);
    const nextStatus = normalizeOptionalText(payload.status);

    if (followUpDate && !/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) {
        const error = new Error('Follow-up date must use YYYY-MM-DD format.');
        error.statusCode = 400;
        throw error;
    }

    if (followUpRequired && !followUpDate) {
        const error = new Error('Follow-up date is required when follow-up is marked as needed.');
        error.statusCode = 400;
        throw error;
    }

    if (nextStatus && !['confirmed', 'completed'].includes(nextStatus)) {
        const error = new Error('Consultation status can only be confirmed or completed.');
        error.statusCode = 400;
        throw error;
    }

    if (nextStatus === 'completed' && !consultationNotes && !diagnosis && !prescription && !doctorAdvice && !visitOutcome) {
        const error = new Error('Add at least one consultation detail before completing the appointment.');
        error.statusCode = 400;
        throw error;
    }

    appointment.consultationNotes = consultationNotes;
    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription;
    appointment.doctorAdvice = doctorAdvice;
    appointment.recommendedTests = recommendedTests;
    appointment.visitOutcome = visitOutcome;
    appointment.scanRequestNote = scanRequestNote;
    appointment.scanRequestedAt = scanRequestNote ? appointment.scanRequestedAt || new Date() : null;
    appointment.followUpRequired = followUpRequired;
    appointment.followUpDate = followUpRequired ? followUpDate : '';

    if (nextStatus) {
        appointment.status = nextStatus;
        if (nextStatus === 'completed') {
            appointment.completedAt = appointment.completedAt || new Date();
            appointment.patientSummaryViewedAt = null;
            appointment.activeSlotKey = undefined;
            clearAppointmentReminderState(appointment);
        }
    }

    await appointment.save();

    const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
    if (appointment.scanRequestNote && appointment.scanRequestNote !== previousScanRequestNote) {
        notifySafely({
            recipientId: appointment.patient,
            type: 'scan-request',
            title: 'Scan requested',
            message: 'Your doctor requested a scan or report.',
            link: '/patient/appointments',
            createdByRole: 'doctor',
            metadata: {
                appointmentId: appointment._id.toString(),
                doctorId: appointment.doctor.toString(),
            },
        });
    }

    return sanitizeAppointment(populatedAppointment);
};

const uploadAppointmentDocument = async ({ appointmentId, userId, userRole, payload = {} }) => {
    const query = userRole === 'doctor'
        ? { _id: appointmentId, doctor: userId }
        : { _id: appointmentId, patient: userId };

    const appointment = await Appointment.findOne(query)
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role consultationFee')
        .populate('patient', 'name email phone role');
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (['rejected', 'cancelled'].includes(appointment.status)) {
        const error = new Error('Cancelled or rejected appointments cannot receive documents.');
        error.statusCode = 400;
        throw error;
    }

    const title = normalizeOptionalText(payload.title);
    const reviewNote = normalizeOptionalText(payload.reviewNote);
    const fileName = normalizeOptionalText(payload.fileName);
    const fileData = normalizeOptionalText(payload.fileData);
    const targetRecipientId = userRole === 'doctor' ? appointment.patient?._id : appointment.doctor?._id;
    const uploaderName = userRole === 'doctor' ? appointment.doctor?.name : appointment.patient?.name;

    if (!title) {
        const error = new Error('Document title is required.');
        error.statusCode = 400;
        throw error;
    }

    if (!fileName) {
        const error = new Error('A file is required.');
        error.statusCode = 400;
        throw error;
    }

    if (!fileData) {
        const error = new Error('A file is required.');
        error.statusCode = 400;
        throw error;
    }

    const medicalDocument = await buildMedicalDocumentEntry({
        appointmentId: appointment._id,
        title,
        fileName,
        fileData,
        reviewNote,
        uploadedByRole: userRole,
    });

    appointment.medicalDocuments = [
        ...(Array.isArray(appointment.medicalDocuments) ? appointment.medicalDocuments : []),
        medicalDocument,
    ];

    await appointment.save();

    const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
    if (targetRecipientId) {
        notifySafely({
            recipientId: targetRecipientId,
            type: userRole === 'patient' ? 'report-uploaded' : 'document-uploaded',
            title: userRole === 'patient' ? 'Report uploaded' : 'Document uploaded',
            message: userRole === 'patient'
                ? `${uploaderName || 'The patient'} uploaded a report.`
                : `${uploaderName || 'The doctor'} uploaded a document.`,
            link: userRole === 'patient' ? `/doctor/appointments/${appointment._id}` : '/patient/appointments',
            createdByRole: userRole,
            metadata: {
                appointmentId: appointment._id.toString(),
                doctorId: appointment.doctor?._id?.toString(),
                patientId: appointment.patient?._id?.toString(),
                title,
                fileName: medicalDocument.fileName,
            },
        });
    }
    return sanitizeAppointment(populatedAppointment);
};

const uploadPatientAppointmentDocument = async ({ appointmentId, patientId, payload = {} }) =>
    uploadAppointmentDocument({
        appointmentId,
        userId: patientId,
        userRole: 'patient',
        payload,
    });

const uploadDoctorAppointmentDocument = async ({ appointmentId, doctorId, payload = {} }) =>
    uploadAppointmentDocument({
        appointmentId,
        userId: doctorId,
        userRole: 'doctor',
        payload,
    });

const markPatientAppointmentSummaryViewed = async ({ appointmentId, patientId }) => {
    const appointment = await Appointment.findOne({ _id: appointmentId, patient: patientId });
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.status !== 'completed') {
        const error = new Error('Only completed appointments can be marked as viewed.');
        error.statusCode = 400;
        throw error;
    }

    appointment.patientSummaryViewedAt = new Date();
    await appointment.save();

    const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
    return sanitizeAppointment(populatedAppointment);
};

const getDoctorAvailabilitySettings = async (doctorId) => {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
        const error = new Error('Doctor not found.');
        error.statusCode = 404;
        throw error;
    }

    return normalizeAvailabilitySettings(doctor);
};

const updateDoctorAvailabilitySettings = async (doctorId, payload = {}) => {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
        const error = new Error('Doctor not found.');
        error.statusCode = 404;
        throw error;
    }

    if (!Array.isArray(payload.availableTimeSlots) || payload.availableTimeSlots.length === 0) {
        const error = new Error('At least one available time slot is required.');
        error.statusCode = 400;
        throw error;
    }

    const availableTimeSlots = [...new Set(payload.availableTimeSlots.map(validateTimeSlot))];

    const blockedDates = Array.isArray(payload.blockedDates)
        ? payload.blockedDates.map((entry) => ({
            date: normalizeAvailabilityDate(entry?.date),
            label: normalizeOptionalText(entry?.label),
            type: normalizeOptionalText(entry?.type) || 'leave',
            notes: normalizeOptionalText(entry?.notes),
        })).filter((entry) => entry.date)
        : [];

    const weeklyBreaks = Array.isArray(payload.weeklyBreaks)
        ? payload.weeklyBreaks.map((entry) => {
            const dayOfWeek = Number(entry?.dayOfWeek);
            const startTime = validateTimeSlot(`${normalizeOptionalText(entry?.startTime)}-${normalizeOptionalText(entry?.endTime)}`).split('-')[0];
            const endTime = validateTimeSlot(`${normalizeOptionalText(entry?.startTime)}-${normalizeOptionalText(entry?.endTime)}`).split('-')[1];

            return {
                dayOfWeek: Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : null,
                startTime,
                endTime,
                label: normalizeOptionalText(entry?.label),
                notes: normalizeOptionalText(entry?.notes),
            };
        }).filter((entry) => Number.isInteger(entry.dayOfWeek))
        : [];

    const emergencySlots = Array.isArray(payload.emergencySlots)
        ? payload.emergencySlots.map((entry) => ({
            date: normalizeAvailabilityDate(entry?.date),
            startTime: validateTimeSlot(`${normalizeOptionalText(entry?.startTime)}-${normalizeOptionalText(entry?.endTime)}`).split('-')[0],
            endTime: validateTimeSlot(`${normalizeOptionalText(entry?.startTime)}-${normalizeOptionalText(entry?.endTime)}`).split('-')[1],
            label: normalizeOptionalText(entry?.label),
            notes: normalizeOptionalText(entry?.notes),
        })).filter((entry) => entry.date && entry.startTime && entry.endTime)
        : [];

    doctor.availabilitySettings = {
        maxAppointmentsPerDay: availableTimeSlots.length,
        availableTimeSlots,
        blockedDates,
        weeklyBreaks,
        emergencySlots,
    };

    await doctor.save();

    return normalizeAvailabilitySettings(doctor);
};

module.exports = {
    getAvailabilityForDoctor,
    createAppointment,
    createKhaltiPaymentSession,
    listPatientAppointments,
    listDoctorAppointments,
    listDoctorPatients,
    updateAppointmentStatus,
    rescheduleAppointment,
    cancelAppointment,
    getDoctorAppointmentById,
    getDoctorPatientRecord,
    updateDoctorAppointmentConsultation,
    markPatientAppointmentSummaryViewed,
    uploadAppointmentDocument,
    uploadDoctorAppointmentDocument,
    uploadPatientAppointmentDocument,
    getDoctorAvailabilitySettings,
    updateDoctorAvailabilitySettings,
    createDoctorFollowUpAppointment,
    verifyKhaltiPaymentSession,
};
