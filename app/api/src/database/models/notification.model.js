const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    link: {
        type: String,
        trim: true,
        maxlength: 500,
        default: '',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdByRole: {
        type: String,
        trim: true,
        default: '',
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
