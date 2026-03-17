const allowedDurations = ['1-day', '2-3-days', '4-7-days', '1-2-weeks', 'more-than-2-weeks'];

const validateAnalyzeSymptomsDto = (payload = {}) => {
    const errors = [];
    const symptoms = Array.isArray(payload.symptoms)
        ? payload.symptoms
            .map((symptom) => (typeof symptom === 'string' ? symptom.trim() : ''))
            .filter(Boolean)
        : [];
    const duration = typeof payload.duration === 'string' ? payload.duration.trim() : '';
    const severity = Number(payload.severity);
    const reliefFactors = typeof payload.reliefFactors === 'string' ? payload.reliefFactors.trim() : '';

    if (symptoms.length === 0) {
        errors.push('At least one symptom is required.');
    }

    if (!allowedDurations.includes(duration)) {
        errors.push(`Duration must be one of: ${allowedDurations.join(', ')}.`);
    }

    if (!Number.isInteger(severity) || severity < 1 || severity > 10) {
        errors.push('Severity must be an integer between 1 and 10.');
    }

    return {
        valid: errors.length === 0,
        errors,
        data: {
            symptoms,
            duration,
            severity,
            reliefFactors,
        },
    };
};

module.exports = validateAnalyzeSymptomsDto;
