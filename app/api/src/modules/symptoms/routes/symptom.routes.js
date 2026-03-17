const express = require('express');
const { analyze } = require('../controllers/symptom.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Symptoms
 *   description: AI-assisted symptom analysis and triage
 */

/**
 * @swagger
 * /api/symptoms/analyze:
 *   post:
 *     summary: Analyze symptoms with rules + optional AI narrative
 *     tags: [Symptoms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symptoms, duration, severity]
 *             properties:
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               duration:
 *                 type: string
 *                 enum: [1-day, 2-3-days, 4-7-days, 1-2-weeks, more-than-2-weeks]
 *               severity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               reliefFactors:
 *                 type: string
 *           example:
 *             symptoms: [Fever, Cough, Fatigue]
 *             duration: 2-3-days
 *             severity: 5
 *             reliefFactors: Warm fluids help.
 *     responses:
 *       200:
 *         description: Symptom analysis response
 *       400:
 *         description: Validation failure
 */
router.post('/analyze', analyze);

module.exports = router;
