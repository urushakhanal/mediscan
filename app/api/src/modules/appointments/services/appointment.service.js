const Appointment = require('../../../database/models/appointment.model');
const User = require('../../../database/models/user.model');
const { ACTIVE_APPOINTMENT_STATUSES } = require('../../../constants/appointment.constants');
const {
    DEFAULT_DOCTOR_TIME_SLOTS,
    DEFAULT_MAX_APPOINTMENTS_PER_DAY,
} = require('../../../constants/user.constants');

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

const buildDoctorAvailability = (doctor) => {
    const maxAppointmentsPerDay = doctor?.availabilitySettings?.maxAppointmentsPerDay || DEFAULT_MAX_APPOINTMENTS_PER_DAY;
    const availableTimeSlots = doctor?.availabilitySettings?.availableTimeSlots?.length
        ? doctor.availabilitySettings.availableTimeSlots.map((slot) => normalizeSlot(slot))
        : [...DEFAULT_DOCTOR_TIME_SLOTS];

    return {
        maxAppointmentsPerDay,
        availableTimeSlots,
    };
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
    const settings = buildDoctorAvailability(doctor);

    const activeAppointments = await Appointment.find({
        doctor: doctorId,
        date,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    }).select('slot status');

    const bookedSlots = activeAppointments.map((appointment) => normalizeSlot(appointment.slot));
    const uniqueBookedSlots = [...new Set(bookedSlots)];
    const remainingCapacity = Math.max(settings.maxAppointmentsPerDay - activeAppointments.length, 0);
    const dailyLimitReached = activeAppointments.length >= settings.maxAppointmentsPerDay;
    const availableSlots = dailyLimitReached
        ? []
        : settings.availableTimeSlots.filter((slot) => !uniqueBookedSlots.includes(slot));

    return {
        date,
        maxAppointmentsPerDay: settings.maxAppointmentsPerDay,
        activeAppointmentsCount: activeAppointments.length,
        remainingCapacity,
        dailyLimitReached,
        configuredSlots: settings.availableTimeSlots,
        bookedSlots: uniqueBookedSlots,
        availableSlots,
    };
};

const normalizeOptionalText = (value) => String(value || '').trim();

const createAppointment = async ({
    doctorId,
    patientId,
    date,
    slot,
    previousMedicalCondition,
    symptoms,
}) => {
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

    const settings = buildDoctorAvailability(doctor);
    if (!settings.availableTimeSlots.includes(normalizedSlot)) {
        const error = new Error('Selected time slot is not part of the doctor availability settings.');
        error.statusCode = 400;
        throw error;
    }

    const activeAppointmentsCount = await Appointment.countDocuments({
        doctor: doctorId,
        date,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });

    if (activeAppointmentsCount >= settings.maxAppointmentsPerDay) {
        const error = new Error('Doctor has reached the maximum number of appointments for that day.');
        error.statusCode = 409;
        throw error;
    }

    try {
        const appointment = await Appointment.create({
            doctor: doctorId,
            patient: patientId,
            date,
            slot: normalizedSlot,
            status: 'pending',
            activeSlotKey: `${doctorId}:${date}:${normalizedSlot}`,
            previousMedicalCondition: normalizeOptionalText(previousMedicalCondition),
            symptoms: normalizeOptionalText(symptoms),
        });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role')
            .populate('patient', 'name email phone role');

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

const listPatientAppointments = async (patientId) => {
    const appointments = await Appointment.find({ patient: patientId })
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role')
        .populate('patient', 'name email phone role')
        .sort({ date: 1, slot: 1, createdAt: -1 });

    return appointments.map(sanitizeAppointment);
};

const listDoctorAppointments = async (doctorId) => {
    const appointments = await Appointment.find({ doctor: doctorId })
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role')
        .populate('patient', 'name email phone role')
        .sort({ date: 1, slot: 1, createdAt: -1 });

    return appointments.map(sanitizeAppointment);
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

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role')
        .populate('patient', 'name email phone role');

    return sanitizeAppointment(populatedAppointment);
};

const getDoctorAvailabilitySettings = async (doctorId) => {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
        const error = new Error('Doctor not found.');
        error.statusCode = 404;
        throw error;
    }

    return buildDoctorAvailability(doctor);
};

const updateDoctorAvailabilitySettings = async (doctorId, payload = {}) => {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
        const error = new Error('Doctor not found.');
        error.statusCode = 404;
        throw error;
    }

    const maxAppointmentsPerDay = Number(payload.maxAppointmentsPerDay);
    if (!Number.isInteger(maxAppointmentsPerDay) || maxAppointmentsPerDay < 1) {
        const error = new Error('Maximum appointments per day must be a positive whole number.');
        error.statusCode = 400;
        throw error;
    }

    if (!Array.isArray(payload.availableTimeSlots) || payload.availableTimeSlots.length === 0) {
        const error = new Error('At least one available time slot is required.');
        error.statusCode = 400;
        throw error;
    }

    const availableTimeSlots = [...new Set(payload.availableTimeSlots.map(validateTimeSlot))];

    doctor.availabilitySettings = {
        maxAppointmentsPerDay,
        availableTimeSlots,
    };

    await doctor.save();

    return buildDoctorAvailability(doctor);
};

module.exports = {
    getAvailabilityForDoctor,
    createAppointment,
    listPatientAppointments,
    listDoctorAppointments,
    updateAppointmentStatus,
    getDoctorAvailabilitySettings,
    updateDoctorAvailabilitySettings,
};
