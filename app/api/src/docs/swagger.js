/**
 * Swagger API documentation configuration
 * Sets up Swagger UI for API documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config/env');

/**
 * Swagger definition options
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: `${config.appName} API`,
            version: config.appVersion,
            description: 'API documentation for MediScan backend services',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
                description: 'Development server',
            },
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints',
            },
            {
                name: 'Auth',
                description: 'Authentication and account management',
            },
            {
                name: 'Users',
                description: 'Superadmin-only user management',
            },
            {
                name: 'Symptoms',
                description: 'AI-assisted symptom analysis and triage',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', enum: ['patient', 'doctor', 'superadmin'] },
                        phone: { type: 'string' },
                        nmcNumber: { type: 'string' },
                        specialization: { type: 'string', enum: ['general-medicine', 'cardiology', 'dermatology', 'neurology', 'pediatrics'] },
                        isVerified: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    },
    // Path to the API routes with JSDoc comments
    apis: ['./src/routes/*.js', './src/modules/**/*.js', './src/app.js'],
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 * @param {Object} app - Express application instance
 */
const setupSwagger = (app) => {
    // Serve Swagger UI
    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'App API Documentation',
        })
    );

    // Serve Swagger JSON
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 Swagger documentation initialized');
};

module.exports = {
    setupSwagger,
    swaggerSpec,
};
