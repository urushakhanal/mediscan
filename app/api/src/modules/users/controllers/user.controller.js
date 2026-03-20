const {
    getAllUsers,
    getVerifiedDoctors,
    getVerifiedDoctorById,
    getUserById,
    updateUser,
    updateDoctorVerification,
    deleteUser,
} = require('../services/user.service');

const listVerifiedDoctors = async (req, res, next) => {
    try {
        const doctors = await getVerifiedDoctors();
        return res.json({ success: true, doctors });
    } catch (error) {
        return next(error);
    }
};

const findVerifiedDoctor = async (req, res, next) => {
    try {
        const doctor = await getVerifiedDoctorById(req.params.id);
        return res.json({ success: true, doctor });
    } catch (error) {
        return next(error);
    }
};

const listUsers = async (req, res, next) => {
    try {
        const users = await getAllUsers();
        return res.json({ success: true, users });
    } catch (error) {
        return next(error);
    }
};

const findUser = async (req, res, next) => {
    try {
        const user = await getUserById(req.params.id);
        return res.json({ success: true, user });
    } catch (error) {
        return next(error);
    }
};

const modifyUser = async (req, res, next) => {
    try {
        const user = await updateUser(req.params.id, req.body || {});
        return res.json({ success: true, user });
    } catch (error) {
        return next(error);
    }
};

const removeUser = async (req, res, next) => {
    try {
        const user = await deleteUser(req.params.id);
        return res.json({ success: true, user });
    } catch (error) {
        return next(error);
    }
};

const verifyDoctor = async (req, res, next) => {
    try {
        const user = await updateDoctorVerification(req.params.id, req.body?.isVerified);
        return res.json({ success: true, user });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    listVerifiedDoctors,
    findVerifiedDoctor,
    listUsers,
    findUser,
    modifyUser,
    verifyDoctor,
    removeUser,
};
