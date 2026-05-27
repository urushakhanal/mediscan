const User = require('../../../database/models/user.model');
const {
    DOCTOR_SPECIALIZATIONS,
    DOCTOR_QUALIFICATIONS,
    createDefaultDoctorAvailabilitySettings,
} = require('../../../constants/user.constants');

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.__v;
    return obj;
};

const getAllUsers = async () => {
    const users = await User.find().sort({ createdAt: -1 });
    return users.map(sanitizeUser);
};

const getVerifiedDoctors = async () => {
    const doctors = await User.find({ role: 'doctor', isVerified: true }).sort({ name: 1 });
    return doctors.map(sanitizeUser);
};

const getVerifiedDoctorById = async (id) => {
    const doctor = await User.findOne({ _id: id, role: 'doctor', isVerified: true });
    if (!doctor) {
        const error = new Error('Verified doctor not found.');
        error.statusCode = 404;
        throw error;
    }
    return sanitizeUser(doctor);
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

const validateUserPayload = async (id, updates) => {
    const nextRole = updates.role;
    const nextPhone = typeof updates.phone === 'string' ? updates.phone.trim() : updates.phone;
    const nextNmcNumber = typeof updates.nmcNumber === 'string' ? updates.nmcNumber.trim() : updates.nmcNumber;
    const nextSpecialization = typeof updates.specialization === 'string' ? updates.specialization.trim() : updates.specialization;
    const nextExperienceYears = Number(updates.experienceYears);
    const nextQualification = typeof updates.qualification === 'string' ? updates.qualification.trim() : updates.qualification;
    const nextCurrentlyWorkingAt = typeof updates.currentlyWorkingAt === 'string'
        ? updates.currentlyWorkingAt.trim()
        : updates.currentlyWorkingAt;
    const nextConsultationFee = updates.consultationFee === undefined ? undefined : Number(updates.consultationFee);

    if ((nextRole === 'patient' || nextRole === 'doctor') && !nextPhone) {
        const error = new Error(`Phone number is required for ${nextRole}s.`);
        error.statusCode = 400;
        throw error;
    }

    if (nextRole === 'doctor') {
        if (!nextNmcNumber) {
            const error = new Error('NMC number is required for doctors.');
            error.statusCode = 400;
            throw error;
        }

        if (!nextSpecialization) {
            const error = new Error('Specialization is required for doctors.');
            error.statusCode = 400;
            throw error;
        }

        if (!DOCTOR_SPECIALIZATIONS.includes(nextSpecialization)) {
            const error = new Error(`Specialization must be one of: ${DOCTOR_SPECIALIZATIONS.join(', ')}.`);
            error.statusCode = 400;
            throw error;
        }

        if (!Number.isFinite(nextExperienceYears) || nextExperienceYears < 0 || nextExperienceYears > 80) {
            const error = new Error('Experience year must be between 0 and 80.');
            error.statusCode = 400;
            throw error;
        }

        if (!nextQualification) {
            const error = new Error('Qualification is required for doctors.');
            error.statusCode = 400;
            throw error;
        }

        if (!DOCTOR_QUALIFICATIONS.includes(nextQualification)) {
            const error = new Error(`Qualification must be one of: ${DOCTOR_QUALIFICATIONS.join(', ')}.`);
            error.statusCode = 400;
            throw error;
        }

        if (!nextCurrentlyWorkingAt) {
            const error = new Error('Currently working at is required for doctors.');
            error.statusCode = 400;
            throw error;
        }

        if (!Number.isFinite(nextConsultationFee) || nextConsultationFee < 0) {
            const error = new Error('Consultation fee must be a valid non-negative amount.');
            error.statusCode = 400;
            throw error;
        }

        const existingNmc = await User.findOne({ nmcNumber: nextNmcNumber, _id: { $ne: id } });
        if (existingNmc) {
            const error = new Error('A doctor with this NMC number already exists.');
            error.statusCode = 400;
            throw error;
        }
    }
};

const updateUser = async (id, payload) => {
    const allowed = ['name', 'email', 'role', 'phone', 'nmcNumber', 'specialization', 'experienceYears', 'qualification', 'currentlyWorkingAt', 'consultationFee'];
    const updates = {};
    allowed.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
            updates[field] = payload[field];
        }
    });

    if (updates.email) {
        updates.email = updates.email.toLowerCase();
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    const mergedUpdates = {
        name: updates.name ?? existingUser.name,
        email: updates.email ?? existingUser.email,
        role: updates.role ?? existingUser.role,
        phone: Object.prototype.hasOwnProperty.call(updates, 'phone') ? updates.phone : existingUser.phone,
        nmcNumber: Object.prototype.hasOwnProperty.call(updates, 'nmcNumber') ? updates.nmcNumber : existingUser.nmcNumber,
        specialization: Object.prototype.hasOwnProperty.call(updates, 'specialization') ? updates.specialization : existingUser.specialization,
        experienceYears: Object.prototype.hasOwnProperty.call(updates, 'experienceYears') ? updates.experienceYears : existingUser.experienceYears,
        qualification: Object.prototype.hasOwnProperty.call(updates, 'qualification') ? updates.qualification : existingUser.qualification,
        currentlyWorkingAt: Object.prototype.hasOwnProperty.call(updates, 'currentlyWorkingAt') ? updates.currentlyWorkingAt : existingUser.currentlyWorkingAt,
        consultationFee: Object.prototype.hasOwnProperty.call(updates, 'consultationFee') ? updates.consultationFee : existingUser.consultationFee,
        isVerified: existingUser.isVerified,
    };

    if (mergedUpdates.role !== 'doctor') {
        mergedUpdates.nmcNumber = undefined;
        mergedUpdates.specialization = undefined;
        mergedUpdates.experienceYears = undefined;
        mergedUpdates.qualification = undefined;
        mergedUpdates.currentlyWorkingAt = undefined;
        mergedUpdates.consultationFee = undefined;
        mergedUpdates.isVerified = false;
        mergedUpdates.availabilitySettings = undefined;
    } else {
        mergedUpdates.availabilitySettings = existingUser.availabilitySettings || createDefaultDoctorAvailabilitySettings();
    }

    await validateUserPayload(id, mergedUpdates);

    const user = await User.findByIdAndUpdate(id, mergedUpdates, { new: true, runValidators: true });
    return sanitizeUser(user);
};

const updateDoctorVerification = async (id, isVerified) => {
    const user = await User.findById(id);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    if (user.role !== 'doctor') {
        const error = new Error('Only doctor accounts can be verified.');
        error.statusCode = 400;
        throw error;
    }

    user.isVerified = Boolean(isVerified);
    await user.save();

    return sanitizeUser(user);
};

const updateUserActiveStatus = async (id, isActive, actorId) => {
    const user = await User.findById(id);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    if (actorId && user._id.toString() === actorId.toString()) {
        const error = new Error('You cannot block your own account.');
        error.statusCode = 400;
        throw error;
    }

    user.isActive = Boolean(isActive);
    await user.save();

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
    getVerifiedDoctors,
    getVerifiedDoctorById,
    getUserById,
    updateUser,
    updateDoctorVerification,
    updateUserActiveStatus,
    deleteUser,
};
