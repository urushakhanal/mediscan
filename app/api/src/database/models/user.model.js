const mongoose = require('mongoose');
const { DOCTOR_SPECIALIZATIONS } = require('../../constants/user.constants');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'superadmin'],
        default: 'patient',
        required: true,
    },
    phone: {
        type: String,
        trim: true,
        maxlength: 30,
    },
    nmcNumber: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
        maxlength: 50,
    },
    specialization: {
        type: String,
        enum: DOCTOR_SPECIALIZATIONS,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
