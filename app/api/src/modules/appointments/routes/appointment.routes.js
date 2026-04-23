const express = require('express');
const authMiddleware = require('../../auth/middlewares/auth.middleware');
const requireRole = require('../../auth/middlewares/requireRole.middleware');
const {
    findDoctorAvailability,
    bookAppointment,
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
} = require('../controllers/appointment.controller');

const router = express.Router();

router.get('/doctor/:doctorId/availability', findDoctorAvailability);

router.post('/', authMiddleware, requireRole('patient'), bookAppointment);
router.get('/patient/me', authMiddleware, requireRole('patient'), getPatientAppointments);
router.get('/doctor/me', authMiddleware, requireRole('doctor'), getDoctorAppointments);
router.get('/doctor/me/patients', authMiddleware, requireRole('doctor'), getDoctorPatients);
router.get('/doctor/me/patients/:patientId/record', authMiddleware, requireRole('doctor'), getDoctorPatient);
router.post('/doctor/me/patients/:patientId/follow-up', authMiddleware, requireRole('doctor'), createFollowUpAppointment);
router.get('/doctor/me/:id', authMiddleware, requireRole('doctor'), getDoctorAppointment);
router.patch('/:id/status', authMiddleware, requireRole('doctor'), changeAppointmentStatus);
router.patch('/:id/reschedule', authMiddleware, rescheduleMyAppointment);
router.patch('/:id/cancel', authMiddleware, cancelMyAppointment);
router.patch('/doctor/me/:id/consultation', authMiddleware, requireRole('doctor'), updateDoctorAppointment);
router.post('/doctor/me/:id/documents', authMiddleware, requireRole('doctor'), uploadDoctorAppointmentDocumentHandler);
router.post('/patient/me/:id/documents', authMiddleware, requireRole('patient'), uploadPatientAppointmentDocumentHandler);
router.patch('/patient/me/:id/summary-viewed', authMiddleware, requireRole('patient'), markMyAppointmentSummaryViewed);
router.get('/doctor-settings/me', authMiddleware, requireRole('doctor'), getMyAvailabilitySettings);
router.put('/doctor-settings/me', authMiddleware, requireRole('doctor'), updateMyAvailabilitySettings);

module.exports = router;
