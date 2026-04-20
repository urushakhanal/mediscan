const {
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
    uploadDoctorAppointmentDocument,
    uploadPatientAppointmentDocument,
    getDoctorAvailabilitySettings,
    updateDoctorAvailabilitySettings,
    createDoctorFollowUpAppointment,
} = require('../services/appointment.service');

const findDoctorAvailability = async (req, res, next) => {
    try {
        const availability = await getAvailabilityForDoctor(req.params.doctorId, req.query.date);
        return res.json({ success: true, availability });
    } catch (error) {
        return next(error);
    }
};

const bookAppointment = async (req, res, next) => {
    try {
        const appointment = await createAppointment({
            doctorId: req.body?.doctorId,
            patientId: req.user.id,
            date: req.body?.date,
            slot: req.body?.slot,
            previousMedicalCondition: req.body?.previousMedicalCondition,
            symptoms: req.body?.symptoms,
        });

        return res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully.',
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const getPatientAppointments = async (req, res, next) => {
    try {
        const appointments = await listPatientAppointments(req.user.id);
        return res.json({ success: true, appointments });
    } catch (error) {
        return next(error);
    }
};

const getDoctorAppointments = async (req, res, next) => {
    try {
        const appointments = await listDoctorAppointments(req.user.id);
        return res.json({ success: true, appointments });
    } catch (error) {
        return next(error);
    }
};

const getDoctorPatients = async (req, res, next) => {
    try {
        const patients = await listDoctorPatients(req.user.id);
        return res.json({ success: true, patients });
    } catch (error) {
        return next(error);
    }
};

const changeAppointmentStatus = async (req, res, next) => {
    try {
        const appointment = await updateAppointmentStatus({
            appointmentId: req.params.id,
            doctorId: req.user.id,
            status: req.body?.status,
        });

        return res.json({
            success: true,
            message: `Appointment ${appointment.status}.`,
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const getDoctorAppointment = async (req, res, next) => {
    try {
        const appointment = await getDoctorAppointmentById(req.user.id, req.params.id);
        return res.json({ success: true, appointment });
    } catch (error) {
        return next(error);
    }
};

const getDoctorPatient = async (req, res, next) => {
    try {
        const record = await getDoctorPatientRecord(req.user.id, req.params.patientId);
        return res.json({ success: true, ...record });
    } catch (error) {
        return next(error);
    }
};

const createFollowUpAppointment = async (req, res, next) => {
    try {
        const appointment = await createDoctorFollowUpAppointment({
            doctorId: req.user.id,
            patientId: req.params.patientId,
            date: req.body?.date,
            slot: req.body?.slot,
        });

        return res.status(201).json({
            success: true,
            message: 'Follow-up appointment created successfully.',
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const updateDoctorAppointment = async (req, res, next) => {
    try {
        const appointment = await updateDoctorAppointmentConsultation({
            appointmentId: req.params.id,
            doctorId: req.user.id,
            payload: req.body || {},
        });

        return res.json({
            success: true,
            message: `Appointment ${appointment.status}.`,
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const uploadDoctorAppointmentDocumentHandler = async (req, res, next) => {
    try {
        const appointment = await uploadDoctorAppointmentDocument({
            appointmentId: req.params.id,
            doctorId: req.user.id,
            payload: req.body || {},
        });

        return res.status(201).json({
            success: true,
            message: 'Document uploaded successfully.',
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const uploadPatientAppointmentDocumentHandler = async (req, res, next) => {
    try {
        const appointment = await uploadPatientAppointmentDocument({
            appointmentId: req.params.id,
            patientId: req.user.id,
            payload: req.body || {},
        });

        return res.status(201).json({
            success: true,
            message: 'Document uploaded successfully.',
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const markMyAppointmentSummaryViewed = async (req, res, next) => {
    try {
        const appointment = await markPatientAppointmentSummaryViewed({
            appointmentId: req.params.id,
            patientId: req.user.id,
        });

        return res.json({
            success: true,
            message: 'Appointment summary marked as viewed.',
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const getMyAvailabilitySettings = async (req, res, next) => {
    try {
        const settings = await getDoctorAvailabilitySettings(req.user.id);
        return res.json({ success: true, settings });
    } catch (error) {
        return next(error);
    }
};

const updateMyAvailabilitySettings = async (req, res, next) => {
    try {
        const settings = await updateDoctorAvailabilitySettings(req.user.id, req.body || {});
        return res.json({
            success: true,
            message: 'Availability settings updated successfully.',
            settings,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    findDoctorAvailability,
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getDoctorPatients,
    changeAppointmentStatus,
    getDoctorAppointment,
    getDoctorPatient,
    createFollowUpAppointment,
    updateDoctorAppointment,
    uploadDoctorAppointmentDocumentHandler,
    uploadPatientAppointmentDocumentHandler,
    markMyAppointmentSummaryViewed,
    getMyAvailabilitySettings,
    updateMyAvailabilitySettings,
};
