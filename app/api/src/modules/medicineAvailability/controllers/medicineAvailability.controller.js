const {
    listAdminLocations,
    listActiveLocationsForDoctor,
    createLocation,
    updateLocation,
    updateLocationStatus,
} = require('../services/medicineAvailability.service');

const getAdminLocationDirectory = async (req, res, next) => {
    try {
        const locations = await listAdminLocations();
        return res.json({ success: true, locations });
    } catch (error) {
        return next(error);
    }
};

const getDoctorActiveLocationDirectory = async (req, res, next) => {
    try {
        const locations = await listActiveLocationsForDoctor();
        return res.json({ success: true, locations });
    } catch (error) {
        return next(error);
    }
};

const createAdminLocation = async (req, res, next) => {
    try {
        const location = await createLocation(req.body || {});
        return res.status(201).json({
            success: true,
            message: 'Location added successfully.',
            location,
        });
    } catch (error) {
        return next(error);
    }
};

const updateAdminLocation = async (req, res, next) => {
    try {
        const location = await updateLocation(req.params.id, req.body || {});
        return res.json({
            success: true,
            message: 'Location updated successfully.',
            location,
        });
    } catch (error) {
        return next(error);
    }
};

const updateAdminLocationActiveStatus = async (req, res, next) => {
    try {
        const location = await updateLocationStatus(req.params.id, req.body?.isActive);
        return res.json({
            success: true,
            message: location.isActive ? 'Location activated successfully.' : 'Location deactivated successfully.',
            location,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getAdminLocationDirectory,
    getDoctorActiveLocationDirectory,
    createAdminLocation,
    updateAdminLocation,
    updateAdminLocationActiveStatus,
};
