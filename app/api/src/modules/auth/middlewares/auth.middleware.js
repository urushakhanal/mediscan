const jwt = require('jsonwebtoken');
const config = require('../../../config/env');

const extractToken = (req) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.replace('Bearer ', '').trim();
    }
    if (req.cookies && req.cookies.auth_token) {
        return req.cookies.auth_token;
    }
    return null;
};

const authMiddleware = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
        return next();
    } catch (err) {
        const message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.';
        return res.status(401).json({ success: false, message });
    }
};

module.exports = authMiddleware;
