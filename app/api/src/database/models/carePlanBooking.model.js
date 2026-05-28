const mongoose = require('mongoose');

const CARE_PLAN_BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const carePlanBookingSchema = new mongoose.Schema({
    carePlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarePlan',
        required: true,
        index: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    preferredDate: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/,
        index: true,
    },
    preferredTime: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1200,
        default: '',
    },
    status: {
        type: String,
        enum: CARE_PLAN_BOOKING_STATUSES,
        default: 'pending',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});

carePlanBookingSchema.index({ patient: 1, createdAt: -1 });
carePlanBookingSchema.index({ doctor: 1, createdAt: -1 });

const CarePlanBooking = mongoose.model('CarePlanBooking', carePlanBookingSchema);

module.exports = {
    CarePlanBooking,
    CARE_PLAN_BOOKING_STATUSES,
};
