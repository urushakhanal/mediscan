const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultAllowedRoles = ['patient', 'doctor'];
const { DOCTOR_SPECIALIZATIONS } = require('../../../constants/user.constants');

const validateRegisterDto = (payload = {}, options = {}) => {
    const errors = [];
    const allowedRoles = options.allowSuperadmin
        ? [...defaultAllowedRoles, 'superadmin']
        : defaultAllowedRoles;
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    const role = typeof payload.role === 'string' ? payload.role.trim().toLowerCase() : 'patient';
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
    const nmcNumber = typeof payload.nmcNumber === 'string' ? payload.nmcNumber.trim() : '';
    const specialization = typeof payload.specialization === 'string' ? payload.specialization.trim() : '';

    if (!name || name.length < 2) {
        errors.push('Name is required and must be at least 2 characters.');
    }

    if (!emailRegex.test(email)) {
        errors.push('A valid email is required.');
    }

    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters.');
    }

    if (!allowedRoles.includes(role)) {
        errors.push(`Role must be one of: ${allowedRoles.join(', ')}.`);
    }

    if ((role === 'patient' || role === 'doctor') && !phone) {
        errors.push(`Phone number is required for ${role}s.`);
    }

    if (role === 'doctor' && !nmcNumber) {
        errors.push('NMC number is required for doctors.');
    }

    if (role === 'doctor' && !specialization) {
        errors.push('Specialization is required for doctors.');
    }

    if (role === 'doctor' && specialization && !DOCTOR_SPECIALIZATIONS.includes(specialization)) {
        errors.push(`Specialization must be one of: ${DOCTOR_SPECIALIZATIONS.join(', ')}.`);
    }

    return {
        valid: errors.length === 0,
        errors,
        data: {
            name,
            email,
            password,
            role,
            phone: phone || undefined,
            nmcNumber: nmcNumber || undefined,
            specialization: specialization || undefined,
        },
    };
};

module.exports = validateRegisterDto;
