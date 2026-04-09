const mongoose = require('mongoose');
const { DOCTOR_SPECIALIZATIONS } = require('../../constants/user.constants');

const carePlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 120,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 140,
    },
    summary: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 240,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 20,
        maxlength: 2000,
    },
    specialty: {
        type: String,
        enum: DOCTOR_SPECIALIZATIONS,
        trim: true,
        required: true,
    },
    durationWeeks: {
        type: Number,
        required: true,
        min: 1,
        max: 52,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    whoItsFor: {
        type: String,
        trim: true,
        maxlength: 180,
        default: '',
    },
    includes: {
        type: [String],
        default: [],
    },
    iconKey: {
        type: String,
        trim: true,
        maxlength: 40,
        default: 'heart',
    },
    assignedDoctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});

carePlanSchema.index({ specialty: 1, isActive: 1, createdAt: -1 });

const CarePlan = mongoose.model('CarePlan', carePlanSchema);

module.exports = CarePlan;
