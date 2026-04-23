const mongoose = require('mongoose');
const { APPOINTMENT_STATUSES } = require('../../constants/appointment.constants');

const appointmentSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    date: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/,
        index: true,
    },
    slot: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: APPOINTMENT_STATUSES,
        default: 'pending',
        required: true,
        index: true,
    },
    activeSlotKey: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    previousMedicalCondition: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    symptoms: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    consultationNotes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: '',
    },
    diagnosis: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    prescription: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: '',
    },
    doctorAdvice: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: '',
    },
    recommendedTests: {
        type: String,
        trim: true,
        maxlength: 1200,
        default: '',
    },
    visitOutcome: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    scanRequestNote: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: '',
    },
    scanRequestedAt: {
        type: Date,
        default: null,
    },
    followUpRequired: {
        type: Boolean,
        default: false,
    },
    followUpDate: {
        type: String,
        trim: true,
        match: /^(\d{4}-\d{2}-\d{2})?$/,
        default: '',
    },
    completedAt: {
        type: Date,
        default: null,
    },
    patientSummaryViewedAt: {
        type: Date,
        default: null,
    },
    rescheduleRequestedDate: {
        type: String,
        trim: true,
        default: '',
    },
    rescheduleRequestedSlot: {
        type: String,
        trim: true,
        default: '',
    },
    rescheduleRequestedReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    rescheduleRequestedByRole: {
        type: String,
        trim: true,
        default: '',
    },
    rescheduleRequestedAt: {
        type: Date,
        default: null,
    },
    cancellationRequestedReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    cancellationRequestedByRole: {
        type: String,
        trim: true,
        default: '',
    },
    cancellationRequestedAt: {
        type: Date,
        default: null,
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    cancelledByRole: {
        type: String,
        trim: true,
        default: '',
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    googleCalendarEventId: {
        type: String,
        trim: true,
        default: '',
    },
    googleCalendarEventHtmlLink: {
        type: String,
        trim: true,
        default: '',
    },
    googleCalendarSyncedAt: {
        type: Date,
        default: null,
    },
    googleCalendarSyncStatus: {
        type: String,
        trim: true,
        default: '',
    },
    googleCalendarSyncError: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    medicalDocuments: [{
        title: {
            type: String,
            trim: true,
            maxlength: 200,
            default: '',
        },
        fileName: {
            type: String,
            trim: true,
            default: '',
        },
        fileUrl: {
            type: String,
            trim: true,
            default: '',
        },
        mimeType: {
            type: String,
            trim: true,
            default: '',
        },
        reviewNote: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        uploadedByRole: {
            type: String,
            trim: true,
            default: '',
        },
        uploadedAt: {
            type: Date,
            default: null,
        },
    }],
}, {
    timestamps: true,
});

appointmentSchema.index({ doctor: 1, date: 1, createdAt: 1 });
appointmentSchema.index({ patient: 1, createdAt: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
