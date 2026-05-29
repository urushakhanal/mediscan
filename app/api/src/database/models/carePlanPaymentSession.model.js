const mongoose = require('mongoose');

const carePlanPaymentSessionSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        required: true,
        trim: true,
        default: 'initiated',
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
    carePlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarePlan',
        required: true,
        index: true,
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarePlanBooking',
        default: null,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        trim: true,
        default: 'NPR',
    },
    transactionUuid: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    providerSessionId: {
        type: String,
        trim: true,
        default: '',
    },
    productCode: {
        type: String,
        required: true,
        trim: true,
    },
    referenceId: {
        type: String,
        trim: true,
        default: '',
    },
    verificationPayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    bookingPayload: {
        carePlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CarePlan',
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        preferredDate: {
            type: String,
            required: true,
            trim: true,
        },
        preferredTime: {
            type: String,
            required: true,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    paidAt: {
        type: Date,
        default: null,
    },
    failedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

carePlanPaymentSessionSchema.index({ patient: 1, createdAt: -1 });

const CarePlanPaymentSession = mongoose.model('CarePlanPaymentSession', carePlanPaymentSessionSchema);

module.exports = CarePlanPaymentSession;
