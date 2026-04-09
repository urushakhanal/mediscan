const express = require('express');
const authMiddleware = require('../../auth/middlewares/auth.middleware');
const requireRole = require('../../auth/middlewares/requireRole.middleware');
const {
    listVerifiedDoctors,
    findVerifiedDoctor,
    listUsers,
    findUser,
    modifyUser,
    verifyDoctor,
    updateUserStatus,
    removeUser,
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/doctors', listVerifiedDoctors);
router.get('/doctors/:id', findVerifiedDoctor);

/**
 * Superadmin-protected user management
 */
router.use(authMiddleware, requireRole('superadmin'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden
 */
router.get('/', listUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found
 */
router.get('/:id', findUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [patient, doctor, superadmin]
 *               phone:
 *                 type: string
 *               nmcNumber:
 *                 type: string
 *               experienceYears:
 *                 type: number
 *               specialization:
 *                 type: string
 *               qualification:
 *                 type: string
 *               currentlyWorkingAt:
 *                 type: string
 *           example:
 *             name: Updated User
 *             role: doctor
 *             nmcNumber: NMC-789123
 *             experienceYears: 10
 *             specialization: gynecology
 *             qualification: md
 *             currentlyWorkingAt: National Women Hospital
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */
router.put('/:id', modifyUser);

router.patch('/:id/verify-doctor', verifyDoctor);
router.patch('/:id/block', (req, res, next) => {
    req.body = { ...(req.body || {}), isActive: false };
    return updateUserStatus(req, res, next);
});
router.patch('/:id/activate', (req, res, next) => {
    req.body = { ...(req.body || {}), isActive: true };
    return updateUserStatus(req, res, next);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Deleted user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found
 */
router.delete('/:id', removeUser);

module.exports = router;
