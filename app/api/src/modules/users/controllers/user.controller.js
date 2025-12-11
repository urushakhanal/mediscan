const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} = require('../services/user.service');

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

module.exports = {
    listUsers,
    findUser,
    modifyUser,
    removeUser,
};
