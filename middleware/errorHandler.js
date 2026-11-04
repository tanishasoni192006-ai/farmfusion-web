/**
 * Central Error Handling Middleware
 */

function errorHandler(err, req, res, next) {
    console.error('Unhandled Application Error:', err);

    const statusCode = err.status || 500;
    const message = err.message || 'An unexpected internal server error occurred.';

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

function notFoundHandler(req, res, next) {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: `API endpoint '${req.originalUrl}' not found.`
        });
    }
    res.status(404).sendFile(require('path').join(__dirname, '..', 'public', '404.html'));
}

module.exports = {
    errorHandler,
    notFoundHandler
};
