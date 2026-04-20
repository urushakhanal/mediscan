const {
    listNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} = require('../services/notification.service');

const getMyNotifications = async (req, res, next) => {
    try {
        const notifications = await listNotifications(req.user.id, {
            limit: req.query.limit,
            unreadOnly: String(req.query.unreadOnly || '').toLowerCase() === 'true',
        });

        return res.json({ success: true, notifications });
    } catch (error) {
        return next(error);
    }
};

const getMyUnreadNotificationCount = async (req, res, next) => {
    try {
        const count = await getUnreadNotificationCount(req.user.id);
        return res.json({ success: true, unreadCount: count });
    } catch (error) {
        return next(error);
    }
};

const markMyNotificationAsRead = async (req, res, next) => {
    try {
        const notification = await markNotificationAsRead(req.user.id, req.params.id);
        return res.json({
            success: true,
            message: 'Notification marked as read.',
            notification,
        });
    } catch (error) {
        return next(error);
    }
};

const markAllMyNotificationsAsRead = async (req, res, next) => {
    try {
        const result = await markAllNotificationsAsRead(req.user.id);
        return res.json({
            success: true,
            message: 'All notifications marked as read.',
            result,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getMyNotifications,
    getMyUnreadNotificationCount,
    markMyNotificationAsRead,
    markAllMyNotificationsAsRead,
};
