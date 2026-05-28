const express = require('express');
const authMiddleware = require('../../auth/middlewares/auth.middleware');
const requireRole = require('../../auth/middlewares/requireRole.middleware');
const {
    getAdminLocationDirectory,
    getDoctorActiveLocationDirectory,
    createAdminLocation,
    updateAdminLocation,
    updateAdminLocationActiveStatus,
} = require('../controllers/medicineAvailability.controller');

const router = express.Router();

router.get('/doctor/active', authMiddleware, requireRole('doctor'), getDoctorActiveLocationDirectory);

router.get('/admin', authMiddleware, requireRole('superadmin'), getAdminLocationDirectory);
router.post('/admin', authMiddleware, requireRole('superadmin'), createAdminLocation);
router.put('/admin/:id', authMiddleware, requireRole('superadmin'), updateAdminLocation);
router.patch('/admin/:id/status', authMiddleware, requireRole('superadmin'), updateAdminLocationActiveStatus);

module.exports = router;
