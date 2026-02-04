const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const mockAuth = require('../middleware/mockAuth');
// const validateRequest = require('../middleware/validateRequest');

// Apply authentication middleware to all notification routes
router.use(mockAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for the current user
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for the current user
 * @access  Private
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification (admin only)
 * @access  Private/Admin
 */
router.post('/', notificationController.createNotification);

module.exports = router;