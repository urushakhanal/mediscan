const {
    getAvailabilityForDoctor,
    createAppointment,
    listPatientAppointments,
    listDoctorAppointments,
    updateAppointmentStatus,
    getDoctorAvailabilitySettings,
    updateDoctorAvailabilitySettings,
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
    changeAppointmentStatus,
    getMyAvailabilitySettings,
    updateMyAvailabilitySettings,
};
