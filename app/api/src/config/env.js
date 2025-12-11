/**
 * Environment configuration module
 * Loads environment variables and exports configuration object
 */

// Load environment variables from .env file
require('dotenv').config();

/**
 * Application configuration object
 * @typedef {Object} Config
 * @property {number} port - Server port number
 * @property {string} mongoUri - MongoDB connection URI
 * @property {string} nodeEnv - Node environment (development, production, test)
 * @property {string} appName - Application name
 * @property {string} appVersion - Application version
 */
const config = {
    // Server port (default: 5000)
    port: parseInt(process.env.PORT, 10) || 5000,

    // MongoDB connection URI
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mediscan',
    mongoDbName: process.env.MONGO_DB_NAME || 'mediscan',

    // Node environment
    nodeEnv: process.env.NODE_ENV || 'development',

    // Application metadata
    appName: process.env.APP_NAME || 'AppMonorepo',
    appVersion: process.env.APP_VERSION || '1.0.0',

    // Auth settings
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Superadmin bootstrap key
    superadminSetupKey: process.env.SUPERADMIN_SETUP_KEY || 'change_me_superadmin',
};

// Validate required environment variables
if (!process.env.MONGO_URI) {
    console.warn('⚠️  Warning: MONGO_URI is not set in environment variables');
    console.warn('⚠️  Using default: mongodb://localhost:27017/app_db');
}

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  Warning: JWT_SECRET is not set. Using a default value is not secure for production.');
}

if (!process.env.SUPERADMIN_SETUP_KEY) {
    console.warn('⚠️  Warning: SUPERADMIN_SETUP_KEY is not set. Using a default bootstrap key is not secure for production.');
}

module.exports = config;
