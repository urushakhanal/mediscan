const {
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
} = require('../services/carePlan.service');

const getCarePlans = async (req, res, next) => {
    try {
        const carePlans = await listPublicCarePlans();
        return res.json({ success: true, carePlans });
    } catch (error) {
        return next(error);
    }
};

const getCarePlanById = async (req, res, next) => {
    try {
        const carePlan = await getPublicCarePlanById(req.params.id);
        return res.json({ success: true, carePlan });
    } catch (error) {
        return next(error);
    }
};

const getAdminCarePlans = async (req, res, next) => {
    try {
        const carePlans = await listAdminCarePlans();
        return res.json({ success: true, carePlans });
    } catch (error) {
        return next(error);
    }
};

const postCarePlan = async (req, res, next) => {
    try {
        const carePlan = await createCarePlan(req.body || {});
        return res.status(201).json({
            success: true,
            message: 'Care plan created successfully.',
            carePlan,
        });
    } catch (error) {
        return next(error);
    }
};

const putCarePlan = async (req, res, next) => {
    try {
        const carePlan = await updateCarePlan(req.params.id, req.body || {});
        return res.json({
            success: true,
            message: 'Care plan updated successfully.',
            carePlan,
        });
    } catch (error) {
        return next(error);
    }
};

const patchCarePlanStatus = async (req, res, next) => {
    try {
        const carePlan = await setCarePlanStatus(req.params.id, req.body?.isActive);
        return res.json({
            success: true,
            message: `Care plan ${carePlan.isActive ? 'activated' : 'deactivated'} successfully.`,
            carePlan,
        });
    } catch (error) {
        return next(error);
    }
};

const removeCarePlan = async (req, res, next) => {
    try {
        await deleteCarePlan(req.params.id);
        return res.json({
            success: true,
            message: 'Care plan deleted successfully.',
        });
    } catch (error) {
        return next(error);
    }
};

const bookCarePlan = async (req, res, next) => {
    try {
        const booking = await createBooking({
            carePlanId: req.params.id,
            patientId: req.user.id,
            doctorId: req.body?.doctorId,
            preferredDate: req.body?.preferredDate,
            preferredTime: req.body?.preferredTime,
            notes: req.body?.notes,
        });

        return res.status(201).json({
            success: true,
            message: 'Care plan request submitted successfully.',
            booking,
        });
    } catch (error) {
        return next(error);
    }
};

const initiateKhaltiCarePlanBookingPayment = async (req, res, next) => {
    try {
        const paymentSession = await createKhaltiPaymentSessionForBooking({
            carePlanId: req.params.id,
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

const verifyKhaltiCarePlanBookingPayment = async (req, res, next) => {
    try {
        const result = await verifyKhaltiPaymentSessionForBooking({
            sessionId: req.params.sessionId,
            patientId: req.user.id,
            pidx: req.body?.pidx || req.query?.pidx,
        });

        return res.json({
            success: true,
            message: 'Payment verified and care plan booked successfully.',
            ...result,
        });
    } catch (error) {
        return next(error);
    }
};

const getMyPatientBookings = async (req, res, next) => {
    try {
        const bookings = await listPatientBookings(req.user.id);
        return res.json({ success: true, bookings });
    } catch (error) {
        return next(error);
    }
};

const getMyDoctorBookings = async (req, res, next) => {
    try {
        const bookings = await listDoctorBookings(req.user.id);
        return res.json({ success: true, bookings });
    } catch (error) {
        return next(error);
    }
};

const getAdminBookings = async (req, res, next) => {
    try {
        const bookings = await listAdminBookings();
        return res.json({ success: true, bookings });
    } catch (error) {
        return next(error);
    }
};

const getMyDoctorCarePlans = async (req, res, next) => {
    try {
        const carePlans = await listDoctorCarePlans(req.user.id);
        return res.json({ success: true, carePlans });
    } catch (error) {
        return next(error);
    }
};

const changeMyDoctorBookingStatus = async (req, res, next) => {
    try {
        const booking = await updateBookingStatus({
            bookingId: req.params.id,
            doctorId: req.user.id,
            status: req.body?.status,
        });

        return res.json({
            success: true,
            message: `Care plan booking ${booking.status}.`,
            booking,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getCarePlans,
    getCarePlanById,
    getAdminCarePlans,
    postCarePlan,
    putCarePlan,
    patchCarePlanStatus,
    removeCarePlan,
    bookCarePlan,
    initiateKhaltiCarePlanBookingPayment,
    verifyKhaltiCarePlanBookingPayment,
    getMyPatientBookings,
    getMyDoctorBookings,
    getAdminBookings,
    getMyDoctorCarePlans,
    changeMyDoctorBookingStatus,
};
