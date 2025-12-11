const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
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
    },
    nmcNumber: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
    },
}, {
    timestamps: true,
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ nmcNumber: 1 }, { unique: true, sparse: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
