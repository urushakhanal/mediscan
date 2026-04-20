const config = require('../../../config/env');
const User = require('../../../database/models/user.model');
const validateRegisterDto = require('../dto/register.dto');
const validateLoginDto = require('../dto/login.dto');
const validateChangePasswordDto = require('../dto/changePassword.dto');
const crypto = require('crypto');
const {
    registerUser,
    loginUser,
    changePassword,
    getCurrentUser,
    completeGoogleDoctorProfile,
} = require('../services/auth.service');
const { sendWelcomeEmail } = require('../../../services/mailer.service');
const {
    buildGoogleAuthUrl,
    signInWithGoogle,
} = require('../services/googleOAuth.service');

const setAuthCookie = (res, token) => {
    res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

const clearAuthCookie = (res) => {
    res.cookie('auth_token', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
        expires: new Date(0),
    });
};

const setGoogleStateCookie = (res, state) => {
    res.cookie('google_oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
        maxAge: 10 * 60 * 1000,
    });
};

const setGoogleRoleCookie = (res, role) => {
    res.cookie('google_oauth_role', role, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
        maxAge: 10 * 60 * 1000,
    });
};

const clearGoogleRoleCookie = (res) => {
    res.cookie('google_oauth_role', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
        expires: new Date(0),
    });
};

const clearGoogleStateCookie = (res) => {
    res.cookie('google_oauth_state', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
        expires: new Date(0),
    });
};

const redirectToSignInError = (res, message = 'Unable to sign in with Google right now.') => {
    const redirectUrl = `${config.clientUrl.replace(/\/$/, '')}/signin?google_error=${encodeURIComponent(message)}`;
    return res.redirect(redirectUrl);
};

const register = async (req, res, next) => {
    try {
        const { valid, errors, data } = validateRegisterDto(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const result = await registerUser(data);
        setAuthCookie(res, result.token);
        void sendWelcomeEmail(result.user).catch((mailError) => {
            console.error('Failed to send welcome email:', mailError.message);
        });

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

        const existingSuperadmin = await User.exists({ role: 'superadmin' });
        if (existingSuperadmin) {
            return res.status(409).json({ success: false, message: 'Superadmin account already exists.' });
        }

        const { valid, errors, data } = validateRegisterDto(
            { ...req.body, role: 'superadmin' },
            { allowSuperadmin: true }
        );
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const result = await registerUser(data);
        setAuthCookie(res, result.token);
        void sendWelcomeEmail(result.user).catch((mailError) => {
            console.error('Failed to send welcome email:', mailError.message);
        });

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

const startGoogleSignIn = async (req, res) => {
    if (!config.google.enabled) {
        return res.status(503).json({
            success: false,
            message: 'Google OAuth is not configured.',
        });
    }

    const requestedRole = req.query.role === 'doctor' ? 'doctor' : 'patient';
    const state = crypto.randomBytes(24).toString('hex');
    console.log('[google-oauth:start]', {
        requestedRole,
        callbackUrl: config.google.callbackUrl,
        state,
    });
    setGoogleStateCookie(res, state);
    setGoogleRoleCookie(res, requestedRole);

    return res.redirect(buildGoogleAuthUrl(state));
};

const handleGoogleSignInCallback = async (req, res) => {
    const { code, state, error } = req.query;
    const expectedState = req.cookies.google_oauth_state;
    const requestedRole = req.cookies.google_oauth_role === 'doctor' ? 'doctor' : 'patient';

    console.log('[google-oauth:callback]', {
        callbackUrl: config.google.callbackUrl,
        hasCode: Boolean(code),
        state,
        expectedState,
        error,
        requestedRole,
    });

    if (error) {
        clearGoogleStateCookie(res);
        return redirectToSignInError(res, 'Google sign-in was cancelled or blocked.');
    }

    if (!code || !state || !expectedState || state !== expectedState) {
        clearGoogleStateCookie(res);
        clearGoogleRoleCookie(res);
        return redirectToSignInError(res, 'Google sign-in could not be verified.');
    }

    try {
        clearGoogleStateCookie(res);
        clearGoogleRoleCookie(res);
        const result = await signInWithGoogle(code);
        setAuthCookie(res, result.token);

        if (result.createdNewUser && requestedRole !== 'doctor') {
            void sendWelcomeEmail(result.user).catch((mailError) => {
                console.error('Failed to send welcome email:', mailError.message);
            });
        }

        if (requestedRole === 'doctor') {
            return res.redirect(`${config.clientUrl.replace(/\/$/, '')}/google/doctor-onboarding`);
        }

        return res.redirect(config.clientUrl.replace(/\/$/, ''));
    } catch (callbackError) {
        clearGoogleRoleCookie(res);
        console.error('Google sign-in failed:', callbackError.message);
        return redirectToSignInError(res, callbackError.message);
    }
};

const completeGoogleDoctorProfileHandler = async (req, res, next) => {
    try {
        const result = await completeGoogleDoctorProfile(req.user.id, req.body || {});
        setAuthCookie(res, result.token);
        void sendWelcomeEmail(result.user).catch((mailError) => {
            console.error('Failed to send welcome email:', mailError.message);
        });
        return res.json({
            success: true,
            message: 'Doctor profile completed successfully.',
            user: result.user,
            token: result.token,
        });
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
    startGoogleSignIn,
    handleGoogleSignInCallback,
    completeGoogleDoctorProfileHandler,
};
