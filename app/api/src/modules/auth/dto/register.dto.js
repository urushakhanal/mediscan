const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = ['patient', 'doctor', 'superadmin'];

const validateRegisterDto = (payload = {}) => {
    const errors = [];
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    const role = typeof payload.role === 'string' ? payload.role.trim().toLowerCase() : 'patient';
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
    const nmcNumber = typeof payload.nmcNumber === 'string' ? payload.nmcNumber.trim() : '';

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

    if (role === 'patient' && !phone) {
        errors.push('Phone number is required for patients.');
    }

    if (role === 'doctor' && !nmcNumber) {
        errors.push('NMC number is required for doctors.');
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
        },
    };
};

module.exports = validateRegisterDto;
