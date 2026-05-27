const mongoose = require('mongoose');
const {
    DOCTOR_SPECIALIZATIONS,
    DOCTOR_QUALIFICATIONS,
    createDefaultDoctorAvailabilitySettings,
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
        default: () => createDefaultDoctorAvailabilitySettings().availableTimeSlots,
    },
    blockedDates: {
        type: [{
            date: {
                type: String,
                required: true,
                match: /^\d{4}-\d{2}-\d{2}$/,
            },
            label: {
                type: String,
                trim: true,
                maxlength: 100,
                default: '',
            },
            type: {
                type: String,
                trim: true,
                maxlength: 40,
                default: 'leave',
            },
            notes: {
                type: String,
                trim: true,
                maxlength: 240,
                default: '',
            },
        }],
        default: [],
    },
    weeklyBreaks: {
        type: [{
            dayOfWeek: {
                type: Number,
                min: 0,
                max: 6,
                required: true,
            },
            startTime: {
                type: String,
                trim: true,
                required: true,
            },
            endTime: {
                type: String,
                trim: true,
                required: true,
            },
            label: {
                type: String,
                trim: true,
                maxlength: 100,
                default: '',
            },
            notes: {
                type: String,
                trim: true,
                maxlength: 240,
                default: '',
            },
        }],
        default: [],
    },
    emergencySlots: {
        type: [{
            date: {
                type: String,
                required: true,
                match: /^\d{4}-\d{2}-\d{2}$/,
            },
            startTime: {
                type: String,
                trim: true,
                required: true,
            },
            endTime: {
                type: String,
                trim: true,
                required: true,
            },
            label: {
                type: String,
                trim: true,
                maxlength: 100,
                default: '',
            },
            notes: {
                type: String,
                trim: true,
                maxlength: 240,
                default: '',
            },
        }],
        default: [],
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
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local',
    },
    googleId: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
        maxlength: 100,
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
    consultationFee: {
        type: Number,
        min: 0,
        default: Math.max(parseInt(process.env.DEFAULT_CONSULTATION_FEE, 10) || 500, 0),
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
    googleCalendarConnected: {
        type: Boolean,
        default: false,
    },
    googleCalendarEmail: {
        type: String,
        trim: true,
        default: '',
    },
    googleCalendarRefreshToken: {
        type: String,
        trim: true,
        select: false,
        default: '',
    },
    googleCalendarAccessToken: {
        type: String,
        trim: true,
        select: false,
        default: '',
    },
    googleCalendarTokenExpiresAt: {
        type: Date,
        default: null,
    },
    googleCalendarConnectedAt: {
        type: Date,
        default: null,
    },
    googleCalendarLastSyncedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
