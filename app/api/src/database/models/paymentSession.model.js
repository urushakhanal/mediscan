const mongoose = require('mongoose');

const paymentSessionSchema = new mongoose.Schema({
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
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
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
    appointmentPayload: {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String,
            required: true,
            trim: true,
        },
        slot: {
            type: String,
            required: true,
            trim: true,
        },
        previousMedicalCondition: {
            type: String,
            trim: true,
            default: '',
        },
        symptoms: {
            type: String,
            trim: true,
            default: '',
        },
        reportTitle: {
            type: String,
            trim: true,
            default: '',
        },
        reportFileName: {
            type: String,
            trim: true,
            default: '',
        },
        reportFileData: {
            type: String,
            default: '',
        },
        reportReviewNote: {
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

paymentSessionSchema.index({ patient: 1, createdAt: -1 });

const PaymentSession = mongoose.model('PaymentSession', paymentSessionSchema);

module.exports = PaymentSession;
