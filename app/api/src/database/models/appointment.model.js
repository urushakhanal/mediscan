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
}, {
    timestamps: true,
});

appointmentSchema.index({ doctor: 1, date: 1, createdAt: 1 });
appointmentSchema.index({ patient: 1, createdAt: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
