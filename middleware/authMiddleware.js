/**
 * Authentication Middleware for FarmFusion Web
 * Validates active session on protected API endpoints and pages.
 */

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }

    // If client is expecting JSON or calling an API route
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please login to your FarmFusion account.'
        });
    }

    // For standard web page requests, redirect to login page
    return res.redirect(`/login.html?redirect=${encodeURIComponent(req.originalUrl)}`);
}

/**
 * Optional session inspector (attaches user data to res.locals for template engines or helpers)
 */
function attachUserToLocals(req, res, next) {
    res.locals.user = req.session && req.session.user ? req.session.user : null;
    next();
}

module.exports = {
    requireAuth,
    attachUserToLocals
};
