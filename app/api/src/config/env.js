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
const khaltiMode = String(process.env.KHALTI_MODE || 'test').toLowerCase() === 'live' ? 'live' : 'test';
const khaltiSecretKey = process.env.KHALTI_SECRET_KEY || '';
const authCookieSameSite = process.env.AUTH_COOKIE_SAME_SITE
    || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
const authCookieSecure = process.env.AUTH_COOKIE_SECURE
    ? String(process.env.AUTH_COOKIE_SECURE).toLowerCase() === 'true'
    : process.env.NODE_ENV === 'production';

const config = {
    // Server port (default: 5000)
    port: parseInt(process.env.PORT, 10) || 5000,

    // MongoDB connection URI
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mediscan',
    mongoDbName: process.env.MONGO_DB_NAME || 'mediscan',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    // Node environment
    nodeEnv: process.env.NODE_ENV || 'development',

    // Application metadata
    appName: process.env.APP_NAME || 'MediScan',
    appVersion: process.env.APP_VERSION || '1.0.0',

    // Auth settings
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    authCookie: {
        sameSite: authCookieSameSite,
        secure: authCookieSecure,
        domain: process.env.AUTH_COOKIE_DOMAIN || '',
    },

    // Superadmin bootstrap key
    superadminSetupKey: process.env.SUPERADMIN_SETUP_KEY || 'change_me_superadmin',

    // AI provider (Mistral)
    mistralApiKey: process.env.MISTRAL_API_KEY || process.env.OPENROUTER_API_KEY || '',
    mistralModel: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    mistralBaseUrl: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',

    // SMTP / email
    smtp: {
        enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS),
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@mediscan.local',
        fromName: process.env.SMTP_FROM_NAME || process.env.APP_NAME || 'MediScan',
    },

    // Appointment reminders
    appointmentReminders: {
        enabled: String(process.env.APPOINTMENT_REMINDERS_ENABLED || 'true').toLowerCase() !== 'false',
        checkIntervalMinutes: Math.max(parseInt(process.env.APPOINTMENT_REMINDER_CHECK_INTERVAL_MINUTES, 10) || 5, 1),
        leadMinutes: String(process.env.APPOINTMENT_REMINDER_LEAD_MINUTES || '1440,120')
            .split(',')
            .map((value) => parseInt(value.trim(), 10))
            .filter((value) => Number.isInteger(value) && value > 0),
    },

    // Google OAuth
    google: {
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL),
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
        calendarCallbackUrl: process.env.GOOGLE_CALENDAR_CALLBACK_URL || process.env.GOOGLE_CALENDAR_REDIRECT_URL || process.env.GOOGLE_CALLBACK_URL || '',
    },

    defaultConsultationFee: Math.max(parseInt(process.env.DEFAULT_CONSULTATION_FEE, 10) || 500, 0),

    khalti: {
        enabled: Boolean(khaltiSecretKey),
        mode: khaltiMode,
        secretKey: khaltiSecretKey,
    },

    appTimeZone: process.env.APP_TIMEZONE || 'Asia/Katmandu',
};

config.khalti.baseUrl = config.khalti.mode === 'live'
    ? 'https://khalti.com/api/v2'
    : 'https://dev.khalti.com/api/v2';

config.khalti.initiateUrl = `${config.khalti.baseUrl}/epayment/initiate/`;
config.khalti.lookupUrl = `${config.khalti.baseUrl}/epayment/lookup/`;

// Validate required environment variables
if (!process.env.MONGO_URI) {
    console.warn('⚠️  Warning: MONGO_URI is not set in environment variables');
    console.warn('⚠️  Using default: mongodb://localhost:27017/mediscan');
}

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  Warning: JWT_SECRET is not set. Using a default value is not secure for production.');
}

if (!process.env.SUPERADMIN_SETUP_KEY) {
    console.warn('⚠️  Warning: SUPERADMIN_SETUP_KEY is not set. Using a default bootstrap key is not secure for production.');
}

if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Warning: GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing.');
}

module.exports = config;
