const User = require('../../../database/models/user.model');

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    const { password, __v, ...rest } = obj;
    return rest;
};

const getAllUsers = async () => {
    const users = await User.find().sort({ createdAt: -1 });
    return users.map(sanitizeUser);
};

const getUserById = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return sanitizeUser(user);
};

const updateUser = async (id, payload) => {
    const allowed = ['name', 'email', 'role', 'phone', 'nmcNumber'];
    const updates = {};
    allowed.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
            updates[field] = payload[field];
        }
    });

    if (updates.email) {
        updates.email = updates.email.toLowerCase();
    }

    if (updates.role === 'doctor' && updates.nmcNumber) {
        const existingNmc = await User.findOne({ nmcNumber: updates.nmcNumber, _id: { $ne: id } });
        if (existingNmc) {
            const error = new Error('A doctor with this NMC number already exists.');
            error.statusCode = 400;
            throw error;
        }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return sanitizeUser(user);
};

const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return sanitizeUser(user);
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
