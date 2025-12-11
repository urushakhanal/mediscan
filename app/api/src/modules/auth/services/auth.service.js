const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../database/models/user.model');
const config = require('../../../config/env');

const createToken = (user) => {
    return jwt.sign(
        { sub: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    const { password, __v, ...rest } = obj;
    return rest;
};

const registerUser = async ({ name, email, password, role = 'patient', phone, nmcNumber }) => {
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
    });
    const token = createToken(user);

    return { user: sanitizeUser(user), token };
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
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

    const token = createToken(user);
    return { user: sanitizeUser(user), token };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
    const user = await User.findById(userId);
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
    return sanitizeUser(user);
};

module.exports = {
    registerUser,
    loginUser,
    changePassword,
    getCurrentUser,
};
