/**
 * Error Handler Middleware
 * Centralized error handling
 */

function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate Entry',
            message: 'Resource already exists'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Authentication token is invalid'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token Expired',
            message: 'Authentication token has expired'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = { errorHandler };
