const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateLoginDto = (payload = {}) => {
    const errors = [];
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!emailRegex.test(email)) {
        errors.push('A valid email is required.');
    }

    if (!password) {
        errors.push('Password is required.');
    }

    return {
        valid: errors.length === 0,
        errors,
        data: { email, password },
    };
};

module.exports = validateLoginDto;
