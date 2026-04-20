const Notification = require('../../../database/models/notification.model');

const sanitizeNotification = (notification) => {
    const obj = notification.toObject ? notification.toObject() : { ...notification };
    delete obj.__v;
    return obj;
};

const createNotification = async ({
    recipientId,
    type,
    title,
    message,
    link = '',
    metadata = {},
    createdByRole = '',
}) => {
    if (!recipientId || !type || !title || !message) {
        return null;
    }

    const notification = await Notification.create({
        recipient: recipientId,
        type,
        title,
        message,
        link,
        metadata,
        createdByRole,
    });

    return sanitizeNotification(notification);
};

const listNotifications = async (userId, { limit = 20, unreadOnly = false } = {}) => {
    const query = { recipient: userId };
    if (unreadOnly) {
        query.isRead = false;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.max(1, Math.min(Number(limit) || 20, 100)));

    return notifications.map(sanitizeNotification);
};

const getUnreadNotificationCount = async (userId) =>
    Notification.countDocuments({ recipient: userId, isRead: false });

const markNotificationAsRead = async (userId, notificationId) => {
    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
    if (!notification) {
        const error = new Error('Notification not found.');
        error.statusCode = 404;
        throw error;
    }

    if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
    }

    return sanitizeNotification(notification);
};

const markAllNotificationsAsRead = async (userId) => {
    const now = new Date();
    const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true, readAt: now } }
    );

    return {
        matchedCount: result.matchedCount || 0,
        modifiedCount: result.modifiedCount || 0,
    };
};

module.exports = {
    createNotification,
    listNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};
