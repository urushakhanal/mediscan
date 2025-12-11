/**
 * Global error handling middleware
 * Catches and formats all errors in the application
 */

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('❌ Error occurred:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);

    // Determine status code
    const statusCode = err.statusCode || res.statusCode || 500;

    // Prepare error response
    const errorResponse = {
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            // Include stack trace only in development
            stack: err.stack,
            // Include any additional error details
            ...(err.details && { details: err.details }),
        }),
    };

    // Send error response
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
