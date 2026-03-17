const validateAnalyzeSymptomsDto = require('../dto/analyzeSymptoms.dto');
const { analyzeSymptoms } = require('../services/symptom.service');

const analyze = async (req, res, next) => {
    try {
        const { valid, errors, data } = validateAnalyzeSymptomsDto(req.body);
        if (!valid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
        }

        const result = await analyzeSymptoms(data);
        return res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    analyze,
};
