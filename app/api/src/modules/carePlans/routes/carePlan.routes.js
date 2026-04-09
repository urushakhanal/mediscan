const express = require('express');
const authMiddleware = require('../../auth/middlewares/auth.middleware');
const requireRole = require('../../auth/middlewares/requireRole.middleware');
const {
    getCarePlans,
    getCarePlanById,
    getAdminCarePlans,
    postCarePlan,
    putCarePlan,
    patchCarePlanStatus,
    removeCarePlan,
    bookCarePlan,
    getMyPatientBookings,
    getMyDoctorBookings,
    getMyDoctorCarePlans,
    changeMyDoctorBookingStatus,
} = require('../controllers/carePlan.controller');

const router = express.Router();

router.get('/', getCarePlans);
router.get('/admin/all', authMiddleware, requireRole('superadmin'), getAdminCarePlans);
router.post('/admin', authMiddleware, requireRole('superadmin'), postCarePlan);
router.put('/admin/:id', authMiddleware, requireRole('superadmin'), putCarePlan);
router.patch('/admin/:id/status', authMiddleware, requireRole('superadmin'), patchCarePlanStatus);
router.delete('/admin/:id', authMiddleware, requireRole('superadmin'), removeCarePlan);
router.get('/doctor/me', authMiddleware, requireRole('doctor'), getMyDoctorCarePlans);
router.get('/bookings/patient/me', authMiddleware, requireRole('patient'), getMyPatientBookings);
router.get('/bookings/doctor/me', authMiddleware, requireRole('doctor'), getMyDoctorBookings);
router.patch('/bookings/doctor/:id/status', authMiddleware, requireRole('doctor'), changeMyDoctorBookingStatus);
router.post('/:id/book', authMiddleware, requireRole('patient'), bookCarePlan);
router.get('/:id', getCarePlanById);

module.exports = router;
