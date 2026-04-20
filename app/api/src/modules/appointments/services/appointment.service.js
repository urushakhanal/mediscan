const Appointment = require('../../../database/models/appointment.model');
const User = require('../../../database/models/user.model');
const { ACTIVE_APPOINTMENT_STATUSES } = require('../../../constants/appointment.constants');
const {
    DEFAULT_DOCTOR_TIME_SLOTS,
    DEFAULT_MAX_APPOINTMENTS_PER_DAY,
} = require('../../../constants/user.constants');
const { createNotification } = require('../../notifications/services/notification.service');
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
    const availableTimeSlots = doctor?.availabilitySettings?.availableTimeSlots?.length
        ? doctor.availabilitySettings.availableTimeSlots.map((slot) => normalizeSlot(slot))
        : [...DEFAULT_DOCTOR_TIME_SLOTS];
    const maxAppointmentsPerDay = availableTimeSlots.length || DEFAULT_MAX_APPOINTMENTS_PER_DAY;

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
const normalizeBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';
const UPLOADS_DIR = path.resolve(__dirname, '../../../../uploads');

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

const populateDoctorAppointment = (query) =>
    query
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role')
        .populate('patient', 'name email phone role');

const createAppointment = async ({
    doctorId,
    patientId,
    date,
    slot,
    previousMedicalCondition,
    symptoms,
    status = 'pending',
    createdByRole = 'patient',
}) => {
    ensureFutureDate(date);
    const normalizedSlot = validateTimeSlot(slot);
    const normalizedStatus = normalizeOptionalText(status);
    const appointmentStatus = ['pending', 'confirmed'].includes(normalizedStatus)
        ? normalizedStatus
        : 'pending';

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
            status: appointmentStatus,
            activeSlotKey: `${doctorId}:${date}:${normalizedSlot}`,
            previousMedicalCondition: normalizeOptionalText(previousMedicalCondition),
            symptoms: normalizeOptionalText(symptoms),
        });

        const populatedAppointment = await populateDoctorAppointment(Appointment.findById(appointment._id));
        if (createdByRole !== 'doctor') {
            notifySafely({
                recipientId: doctor._id,
                type: 'appointment-request',
                title: 'New appointment request',
                message: `${patient.name} requested an appointment.`,
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

    if (appointment.status === 'rejected') {
        const error = new Error('Rejected appointments cannot be updated.');
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
        .populate('doctor', 'name email phone specialization nmcNumber isVerified availabilitySettings role')
        .populate('patient', 'name email phone role');
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.status === 'rejected') {
        const error = new Error('Rejected appointments cannot receive documents.');
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

    const parsedUpload = parseUploadData(fileData);
    const safeBaseName = sanitizeFileName(fileName.replace(/\.[^.]+$/, ''));
    const extension = path.extname(fileName) || getExtensionFromMimeType(parsedUpload.mimeType) || '';
    const storedFileName = `${appointment._id}-${Date.now()}-${safeBaseName}${extension}`;
    const relativeFilePath = path.posix.join('uploads', storedFileName);
    const absoluteFilePath = path.join(UPLOADS_DIR, storedFileName);

    await ensureUploadsDir();
    await fs.writeFile(absoluteFilePath, parsedUpload.buffer);

    appointment.medicalDocuments = [
        ...(Array.isArray(appointment.medicalDocuments) ? appointment.medicalDocuments : []),
        {
            title,
            fileName: storedFileName,
        fileUrl: `/${relativeFilePath.replace(/\\/g, '/')}`,
            mimeType: parsedUpload.mimeType,
            reviewNote,
            uploadedByRole: userRole,
            uploadedAt: new Date(),
        },
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
                fileName: storedFileName,
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

    return buildDoctorAvailability(doctor);
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

    doctor.availabilitySettings = {
        maxAppointmentsPerDay: availableTimeSlots.length,
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
    listDoctorPatients,
    updateAppointmentStatus,
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
};
