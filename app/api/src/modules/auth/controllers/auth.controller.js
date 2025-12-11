const config = require('../../../config/env');
const validateRegisterDto = require('../dto/register.dto');
const validateLoginDto = require('../dto/login.dto');
const validateChangePasswordDto = require('../dto/changePassword.dto');
const {
    registerUser,
    loginUser,
    changePassword,
    getCurrentUser,
} = require('../services/auth.service');

const setAuthCookie = (res, token) => {
    res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

const clearAuthCookie = (res) => {
    res.cookie('auth_token', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        expires: new Date(0),
    });
};

const register = async (req, res, next) => {
    try {
        const { valid, errors, data } = validateRegisterDto(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const result = await registerUser(data);
        setAuthCookie(res, result.token);

        return res.status(201).json({
            success: true,
            message: 'Registered successfully',
            user: result.user,
            token: result.token,
        });
    } catch (error) {
        return next(error);
    }
};

const registerSuperadmin = async (req, res, next) => {
    try {
        if (!req.body.setupKey || req.body.setupKey !== config.superadminSetupKey) {
            return res.status(403).json({ success: false, message: 'Invalid setup key for superadmin creation.' });
        }

        const { valid, errors, data } = validateRegisterDto({ ...req.body, role: 'superadmin' });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const result = await registerUser(data);
        setAuthCookie(res, result.token);

        return res.status(201).json({
            success: true,
            message: 'Superadmin registered successfully',
            user: result.user,
            token: result.token,
        });
    } catch (error) {
        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { valid, errors, data } = validateLoginDto(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const result = await loginUser(data);
        setAuthCookie(res, result.token);

        return res.json({
            success: true,
            message: 'Logged in successfully',
            user: result.user,
            token: result.token,
        });
    } catch (error) {
        return next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        clearAuthCookie(res);
        return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return next(error);
    }
};

const me = async (req, res, next) => {
    try {
        const user = await getCurrentUser(req.user.id);
        return res.json({ success: true, user });
    } catch (error) {
        return next(error);
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const { valid, errors, data } = validateChangePasswordDto(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const user = await changePassword(req.user.id, data);
        return res.json({ success: true, message: 'Password updated successfully', user });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    register,
    registerSuperadmin,
    login,
    logout,
    me,
    updatePassword,
};
