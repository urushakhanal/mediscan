const express = require('express');
const authMiddleware = require('../../auth/middlewares/auth.middleware');
const requireRole = require('../../auth/middlewares/requireRole.middleware');
const {
    findDoctorAvailability,
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    changeAppointmentStatus,
    getMyAvailabilitySettings,
    updateMyAvailabilitySettings,
} = require('../controllers/appointment.controller');

const router = express.Router();

router.get('/doctor/:doctorId/availability', findDoctorAvailability);

router.post('/', authMiddleware, requireRole('patient'), bookAppointment);
router.get('/patient/me', authMiddleware, requireRole('patient'), getPatientAppointments);
router.get('/doctor/me', authMiddleware, requireRole('doctor'), getDoctorAppointments);
router.patch('/:id/status', authMiddleware, requireRole('doctor'), changeAppointmentStatus);
router.get('/doctor-settings/me', authMiddleware, requireRole('doctor'), getMyAvailabilitySettings);
router.put('/doctor-settings/me', authMiddleware, requireRole('doctor'), updateMyAvailabilitySettings);

module.exports = router;
