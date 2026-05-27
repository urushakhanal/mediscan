/**
 * Application entry point
 * Initializes database connection and starts the Express server
 */

const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const {
    startAppointmentReminderScheduler,
    stopAppointmentReminderScheduler,
} = require('./modules/appointments/services/appointmentReminder.service');

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // ===========================
        // Connect to Database
        // ===========================
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        await startAppointmentReminderScheduler();

        // ===========================
        // Start Express Server
        // ===========================
        const server = app.listen(config.port, () => {
            console.log('');
            console.log('=================================');
            console.log('🚀 Server Information');
            console.log('=================================');
            console.log(`📦 App: ${config.appName} v${config.appVersion}`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
            console.log(`🔗 Server: http://localhost:${config.port}`);
            console.log(`📚 API Docs: http://localhost:${config.port}/api/docs`);
            console.log(`💚 Health: http://localhost:${config.port}/api/health`);
            console.log('=================================');
            console.log('');
        });

        // ===========================
        // Graceful Shutdown
        // ===========================
        const gracefulShutdown = (signal) => {
            console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

            server.close(() => {
                console.log('✅ HTTP server closed');
                stopAppointmentReminderScheduler();

                // Close database connection
                require('mongoose').connection.close(false, () => {
                    console.log('✅ MongoDB connection closed');
                    process.exit(0);
                });
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Listen for shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// Start the server
startServer();
