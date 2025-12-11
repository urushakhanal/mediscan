/**
 * Database connection module
 * Handles MongoDB connection using Mongoose
 */

const mongoose = require('mongoose');
const config = require('./env');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const uriHasDb = /mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(config.mongoUri);
        const connectOptions = uriHasDb ? {} : { dbName: config.mongoDbName };

        // Connect to MongoDB with recommended options
        const conn = await mongoose.connect(config.mongoUri, connectOptions);

        // Log successful connection
        console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        console.log(`📊 Database state: ${getConnectionState()}`);
        if (!uriHasDb) {
            console.log(`ℹ️ Using dbName option: ${config.mongoDbName}`);
        }
    } catch (error) {
        // Log error and exit process
        console.error('❌ MongoDB connection error:', error.message);
        console.error('💡 Make sure MongoDB is running and MONGO_URI is correct');
        process.exit(1);
    }
};

/**
 * Get human-readable connection state
 * @returns {string} Connection state description
 */
const getConnectionState = () => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Check if database is connected
 * @returns {boolean} True if connected, false otherwise
 */
const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
});

module.exports = {
    connectDB,
    getConnectionState,
    isConnected,
};
