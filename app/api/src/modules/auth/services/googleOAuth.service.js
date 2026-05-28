const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../../database/models/user.model');
const config = require('../../../config/env');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.__v;
    return obj;
};

const createToken = (user) => {
    const jwt = require('jsonwebtoken');

    return jwt.sign(
        { sub: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

const getGoogleCallbackUrl = () => config.google.callbackUrl;

const buildGoogleAuthUrl = (state) => {
    if (!config.google.enabled) {
        const error = new Error('Google OAuth is not configured.');
        error.statusCode = 503;
        throw error;
    }

    const params = new URLSearchParams({
        client_id: config.google.clientId,
        redirect_uri: getGoogleCallbackUrl(),
        response_type: 'code',
        scope: GOOGLE_SCOPES.join(' '),
        state,
        prompt: 'select_account',
        access_type: 'online',
        include_granted_scopes: 'true',
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const exchangeCodeForTokens = async (code) => {
    const body = new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: getGoogleCallbackUrl(),
        grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error_description || data.error || 'Unable to exchange Google authorization code.');
        error.statusCode = 400;
        throw error;
    }

    return data;
};

const fetchGoogleProfile = async (accessToken) => {
    const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error_description || data.error || 'Unable to load Google profile.');
        error.statusCode = 400;
        throw error;
    }

    return data;
};

const createGoogleAccount = async (profile) => {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await User.create({
        name: profile.name || profile.given_name || profile.email,
        email: profile.email,
        password: hashedPassword,
        role: 'patient',
        isVerified: false,
        authProvider: 'google',
        googleId: profile.sub,
    });

    return user;
};

const linkGoogleAccount = async (user, profile) => {
    let updated = false;

    if (!user.googleId) {
        user.googleId = profile.sub;
        updated = true;
    }

    if (user.authProvider !== 'google') {
        user.authProvider = 'google';
        updated = true;
    }

    if (!user.name && profile.name) {
        user.name = profile.name;
        updated = true;
    }

    if (updated) {
        await user.save();
    }

    return user;
};

const signInWithGoogle = async (code) => {
    if (!config.google.enabled) {
        const error = new Error('Google OAuth is not configured.');
        error.statusCode = 503;
        throw error;
    }

    const tokenData = await exchangeCodeForTokens(code);
    if (!tokenData.access_token) {
        const error = new Error('Google OAuth did not return an access token.');
        error.statusCode = 400;
        throw error;
    }

    const profile = await fetchGoogleProfile(tokenData.access_token);
    if (!profile.email) {
        const error = new Error('Google account did not return an email address.');
        error.statusCode = 400;
        throw error;
    }

    if (profile.email_verified === false || profile.email_verified === 'false') {
        const error = new Error('Google account email must be verified.');
        error.statusCode = 400;
        throw error;
    }

    let user = await User.findOne({ googleId: profile.sub });
    let createdNewUser = false;

    if (user) {
        if (!user.isActive) {
            const error = new Error('Your account has been blocked. Please contact the superadmin.');
            error.statusCode = 403;
            throw error;
        }

        await linkGoogleAccount(user, profile);
    } else {
        user = await User.findOne({ email: profile.email });

        if (user) {
            if (!user.isActive) {
                const error = new Error('Your account has been blocked. Please contact the superadmin.');
                error.statusCode = 403;
                throw error;
            }

            await linkGoogleAccount(user, profile);
        } else {
            user = await createGoogleAccount(profile);
            createdNewUser = true;
        }
    }

    const populatedUser = await User.findById(user._id);
    return {
        user: sanitizeUser(populatedUser),
        token: createToken(populatedUser),
        createdNewUser,
    };
};

module.exports = {
    buildGoogleAuthUrl,
    signInWithGoogle,
};
