const mongoose = require('mongoose');

const medicineAvailabilityLocationSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 150,
    },
    address: {
        type: String,
        trim: true,
        required: true,
        maxlength: 250,
    },
    phone: {
        type: String,
        trim: true,
        required: true,
        maxlength: 40,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});

medicineAvailabilityLocationSchema.index({ name: 1, address: 1 });

const MedicineAvailabilityLocation = mongoose.model('MedicineAvailabilityLocation', medicineAvailabilityLocationSchema);

module.exports = MedicineAvailabilityLocation;
