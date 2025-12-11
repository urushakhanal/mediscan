const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
    register,
    registerSuperadmin,
    login,
    logout,
    me,
    updatePassword,
} = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and account management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [patient, doctor, superadmin]
 *               phone:
 *                 type: string
 *                 description: Required when role is patient
 *               nmcNumber:
 *                 type: string
 *                 description: Required when role is doctor
 *           examples:
 *             patient:
 *               summary: Register patient
 *               value:
 *                 name: Jane Doe
 *                 email: jane@example.com
 *                 password: StrongPass123
 *                 role: patient
 *                 phone: "+15551234567"
 *             doctor:
 *               summary: Register doctor
 *               value:
 *                 name: Dr. John Smith
 *                 email: dr.john@example.com
 *                 password: StrongPass123
 *                 role: doctor
 *                 nmcNumber: NMC-123456
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Validation error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/register-superadmin:
 *   post:
 *     summary: Register a superadmin (requires setup key)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, setupKey]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               setupKey:
 *                 type: string
 *                 description: Must match server SUPERADMIN_SETUP_KEY
 *           examples:
 *             superadmin:
 *               summary: Register superadmin
 *               value:
 *                 name: Head Admin
 *                 email: admin@example.com
 *                 password: StrongPass123
 *                 setupKey: your-superadmin-setup-key
 *     responses:
 *       201:
 *         description: Superadmin registered
 *       400:
 *         description: Validation error
 *       403:
 *         description: Invalid setup key
 */
router.post('/register-superadmin', registerSuperadmin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *           example:
 *             email: jane@example.com
 *             password: StrongPass123
 *     responses:
 *       200:
 *         description: Logged in
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, me);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password for current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *           example:
 *             currentPassword: OldPass123
 *             newPassword: NewPass456
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation or current password error
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', authMiddleware, updatePassword);

module.exports = router;
