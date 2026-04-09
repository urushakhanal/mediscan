const jwt = require('jsonwebtoken');
const config = require('../../../config/env');
const User = require('../../../database/models/user.model');

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

const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.sub).select('_id email role isActive');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact the superadmin.' });
        }

        req.user = { id: user._id.toString(), email: user.email, role: user.role };
        return next();
    } catch (err) {
        const message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.';
        return res.status(401).json({ success: false, message });
    }
};

module.exports = authMiddleware;
