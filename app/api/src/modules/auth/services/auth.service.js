const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../database/models/user.model');
const config = require('../../../config/env');
const { updateUser } = require('../../users/services/user.service');
const {
    DEFAULT_DOCTOR_TIME_SLOTS,
    DEFAULT_MAX_APPOINTMENTS_PER_DAY,
} = require('../../../constants/user.constants');

const createToken = (user) => {
    return jwt.sign(
        { sub: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.__v;
    return obj;
};

const registerUser = async ({
    name,
    email,
    password,
    role = 'patient',
    phone,
    nmcNumber,
    specialization,
    experienceYears,
    qualification,
    currentlyWorkingAt,
}) => {
    const existing = await User.findOne({ email });
    if (existing) {
        const error = new Error('User with this email already exists.');
        error.statusCode = 400;
        throw error;
    }

    if (role === 'doctor' && nmcNumber) {
        const existingNmc = await User.findOne({ nmcNumber });
        if (existingNmc) {
            const error = new Error('A doctor with this NMC number already exists.');
            error.statusCode = 400;
            throw error;
        }
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
        name,
        email,
        password: hashed,
        role,
        phone,
        nmcNumber,
        specialization,
        experienceYears,
        qualification,
        currentlyWorkingAt,
        isVerified: false,
        availabilitySettings: role === 'doctor'
            ? {
                maxAppointmentsPerDay: DEFAULT_MAX_APPOINTMENTS_PER_DAY,
                availableTimeSlots: [...DEFAULT_DOCTOR_TIME_SLOTS],
            }
            : undefined,
    });
    const token = createToken(user);

    return { user: sanitizeUser(user), token };
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Your account has been blocked. Please contact the superadmin.');
        error.statusCode = 403;
        throw error;
    }

    const token = createToken(user);
    return { user: sanitizeUser(user), token };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
    const user = await User.findById(userId).select('+password');
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        const error = new Error('Current password is incorrect.');
        error.statusCode = 400;
        throw error;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return sanitizeUser(user);
};

const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Your account has been blocked. Please contact the superadmin.');
        error.statusCode = 403;
        throw error;
    }

    return sanitizeUser(user);
};

const completeGoogleDoctorProfile = async (userId, payload = {}) => {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    if (currentUser.authProvider !== 'google') {
        const error = new Error('Google sign-in is required before completing this profile.');
        error.statusCode = 400;
        throw error;
    }

    await updateUser(userId, {
        ...payload,
        role: 'doctor',
    });

    const refreshedUser = await User.findById(userId);
    return {
        user: sanitizeUser(refreshedUser),
        token: createToken(refreshedUser),
    };
};

module.exports = {
    registerUser,
    loginUser,
    changePassword,
    getCurrentUser,
    completeGoogleDoctorProfile,
};
