const {
    getAvailabilityForDoctor,
    createAppointment,
    createKhaltiPaymentSession,
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
    rescheduleAppointment,
    cancelAppointment,
    verifyKhaltiPaymentSession,
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
            reportTitle: req.body?.reportTitle,
            reportFileName: req.body?.reportFileName,
            reportFileData: req.body?.reportFileData,
            reportReviewNote: req.body?.reportReviewNote,
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

const initiateKhaltiBookingPayment = async (req, res, next) => {
    try {
        const paymentSession = await createKhaltiPaymentSession({
            patientId: req.user.id,
            payload: req.body || {},
        });

        return res.status(201).json({
            success: true,
            message: 'Khalti payment session created successfully.',
            paymentSession,
        });
    } catch (error) {
        return next(error);
    }
};

const verifyKhaltiBookingPayment = async (req, res, next) => {
    try {
        const result = await verifyKhaltiPaymentSession({
            sessionId: req.params.sessionId,
            patientId: req.user.id,
            pidx: req.body?.pidx || req.query?.pidx,
        });

        return res.json({
            success: true,
            message: 'Payment verified and appointment booked successfully.',
            ...result,
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

const rescheduleMyAppointment = async (req, res, next) => {
    try {
        const appointment = await rescheduleAppointment({
            appointmentId: req.params.id,
            actorId: req.user.id,
            actorRole: req.user.role,
            date: req.body?.date,
            slot: req.body?.slot,
            reason: req.body?.reason,
        });

        return res.json({
            success: true,
            message: appointment.rescheduleRequestedDate
                ? 'Reschedule request submitted successfully.'
                : 'Appointment rescheduled successfully.',
            appointment,
        });
    } catch (error) {
        return next(error);
    }
};

const cancelMyAppointment = async (req, res, next) => {
    try {
        const appointment = await cancelAppointment({
            appointmentId: req.params.id,
            actorId: req.user.id,
            actorRole: req.user.role,
            reason: req.body?.reason,
        });

        return res.json({
            success: true,
            message: appointment.status === 'cancelled'
                ? 'Appointment cancelled successfully.'
                : 'Cancellation request submitted successfully.',
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
    initiateKhaltiBookingPayment,
    verifyKhaltiBookingPayment,
    getPatientAppointments,
    getDoctorAppointments,
    getDoctorPatients,
    changeAppointmentStatus,
    rescheduleMyAppointment,
    cancelMyAppointment,
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
