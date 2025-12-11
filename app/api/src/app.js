/**
 * Express application configuration
 * Sets up middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/users/routes/user.routes');
const errorHandler = require('./middlewares/errorHandler');
const { setupSwagger } = require('./docs/swagger');

// Create Express application
const app = express();

// ===========================
// Middleware Setup
// ===========================

// Enable CORS for all routes
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
