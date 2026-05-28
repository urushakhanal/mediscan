const MedicineAvailabilityLocation = require('../../../database/models/medicineAvailabilityLocation.model');

const normalizeOptionalText = (value) => String(value || '').trim();

const sanitizeLocation = (location) => {
    const obj = location?.toObject ? location.toObject() : { ...location };
    delete obj.__v;
    return obj;
};

const validateLocationPayload = (payload = {}) => {
    const name = normalizeOptionalText(payload.name);
    const address = normalizeOptionalText(payload.address);
    const phone = normalizeOptionalText(payload.phone);

    if (!name) {
        const error = new Error('Location name is required.');
        error.statusCode = 400;
        throw error;
    }

    if (!address) {
        const error = new Error('Location address is required.');
        error.statusCode = 400;
        throw error;
    }

    if (!phone) {
        const error = new Error('Location phone is required.');
        error.statusCode = 400;
        throw error;
    }

    return { name, address, phone };
};

const listAdminLocations = async () => {
    const locations = await MedicineAvailabilityLocation.find().sort({ isActive: -1, name: 1, createdAt: -1 });
    return locations.map(sanitizeLocation);
};

const listActiveLocationsForDoctor = async () => {
    const locations = await MedicineAvailabilityLocation.find({ isActive: true }).sort({ name: 1, createdAt: -1 });
    return locations.map(sanitizeLocation);
};

const createLocation = async (payload = {}) => {
    const normalized = validateLocationPayload(payload);
    const location = await MedicineAvailabilityLocation.create({
        ...normalized,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    });
    return sanitizeLocation(location);
};

const updateLocation = async (id, payload = {}) => {
    const existing = await MedicineAvailabilityLocation.findById(id);
    if (!existing) {
        const error = new Error('Location not found.');
        error.statusCode = 404;
        throw error;
    }

    const normalized = validateLocationPayload(payload);
    existing.name = normalized.name;
    existing.address = normalized.address;
    existing.phone = normalized.phone;
    await existing.save();
    return sanitizeLocation(existing);
};

const updateLocationStatus = async (id, isActive) => {
    const location = await MedicineAvailabilityLocation.findById(id);
    if (!location) {
        const error = new Error('Location not found.');
        error.statusCode = 404;
        throw error;
    }

    location.isActive = Boolean(isActive);
    await location.save();
    return sanitizeLocation(location);
};

module.exports = {
    listAdminLocations,
    listActiveLocationsForDoctor,
    createLocation,
    updateLocation,
    updateLocationStatus,
};
