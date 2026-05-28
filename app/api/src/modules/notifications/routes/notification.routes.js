const express = require('express');
const authMiddleware = require('../../auth/middlewares/auth.middleware');
const {
    getMyNotifications,
    getMyUnreadNotificationCount,
    markMyNotificationAsRead,
    markAllMyNotificationsAsRead,
} = require('../controllers/notification.controller');

const router = express.Router();

router.get('/me', authMiddleware, getMyNotifications);
router.get('/me/unread-count', authMiddleware, getMyUnreadNotificationCount);
router.patch('/me/read-all', authMiddleware, markAllMyNotificationsAsRead);
router.patch('/me/:id/read', authMiddleware, markMyNotificationAsRead);

module.exports = router;
