const mongoose = require('mongoose');
const {
    DOCTOR_SPECIALIZATIONS,
    DOCTOR_QUALIFICATIONS,
    DEFAULT_DOCTOR_TIME_SLOTS,
    DEFAULT_MAX_APPOINTMENTS_PER_DAY,
} = require('../../constants/user.constants');

const availabilitySettingsSchema = new mongoose.Schema({
    maxAppointmentsPerDay: {
        type: Number,
        min: 1,
        default: DEFAULT_MAX_APPOINTMENTS_PER_DAY,
    },
    availableTimeSlots: {
        type: [String],
        default: () => [...DEFAULT_DOCTOR_TIME_SLOTS],
    },
}, { _id: false });

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
    experienceYears: {
        type: Number,
        min: 0,
        max: 80,
    },
    qualification: {
        type: String,
        enum: DOCTOR_QUALIFICATIONS,
        trim: true,
    },
    currentlyWorkingAt: {
        type: String,
        trim: true,
        maxlength: 150,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    availabilitySettings: {
        type: availabilitySettingsSchema,
        default: undefined,
    },
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
