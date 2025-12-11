const validateChangePasswordDto = (payload = {}) => {
    const errors = [];
    const currentPassword = typeof payload.currentPassword === 'string' ? payload.currentPassword : '';
    const newPassword = typeof payload.newPassword === 'string' ? payload.newPassword : '';

    if (!currentPassword) {
        errors.push('Current password is required.');
    }

    if (!newPassword || newPassword.length < 8) {
        errors.push('New password must be at least 8 characters.');
    }

    return {
        valid: errors.length === 0,
        errors,
        data: { currentPassword, newPassword },
    };
};

module.exports = validateChangePasswordDto;
