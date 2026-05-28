/**
 * Express application configuration
 * Sets up middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/users/routes/user.routes');
const notificationRoutes = require('./modules/notifications/routes/notification.routes');
const symptomRoutes = require('./modules/symptoms/routes/symptom.routes');
const appointmentRoutes = require('./modules/appointments/routes/appointment.routes');
const carePlanRoutes = require('./modules/carePlans/routes/carePlan.routes');
const medicineAvailabilityRoutes = require('./modules/medicineAvailability/routes/medicineAvailability.routes');
const errorHandler = require('./middlewares/errorHandler');
const { setupSwagger } = require('./docs/swagger');

// Create Express application
const app = express();
const allowedOrigins = String(config.clientUrl || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

// ===========================
// Middleware Setup
// ===========================

// Enable CORS for all routes
app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = String(origin).replace(/\/$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ===========================
// API Documentation (Swagger)
// ===========================

setupSwagger(app);

// ===========================
// Routes
// ===========================

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the API',
        documentation: '/api/docs',
        health: '/api/health',
    });
});

// Health check route
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/care-plans', carePlanRoutes);
app.use('/api/medicine-availability', medicineAvailabilityRoutes);

// ===========================
// Error Handling
// ===========================

// 404 handler - must be after all routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;
