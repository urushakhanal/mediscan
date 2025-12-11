/**
 * Health check routes
 * Provides system health and status information
 */

const express = require('express');
const mongoose = require('mongoose');
const config = require('../config/env');
const { getConnectionState, isConnected } = require('../config/db');

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 * Returns application status, database connection, and metadata
 * 
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Successful health check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *                 app:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: AppMonorepo
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     env:
 *                       type: string
 *                       example: development
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: true
 *                     state:
 *                       type: string
 *                       example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-01-01T00:00:00.000Z
 */
router.get('/', (req, res) => {
    try {
        // Get database connection status
        const dbConnected = isConnected();
        const dbState = getConnectionState();

        // Prepare health response
        const healthStatus = {
            success: true,
            message: 'OK',
            app: {
                name: config.appName,
                version: config.appVersion,
                env: config.nodeEnv,
            },
            database: {
                connected: dbConnected,
                state: dbState,
            },
            timestamp: new Date().toISOString(),
        };

        // Return 503 if database is not connected
        const statusCode = dbConnected ? 200 : 503;

        res.status(statusCode).json(healthStatus);
    } catch (error) {
        // Handle any errors
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

module.exports = router;
