const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationAsRead,
  deleteNotificationById,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  triggerUserDigest,
} = require('../controllers/notificationController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markNotificationAsRead);

// Delete notification
router.delete('/:id', deleteNotificationById);

// Get notification preferences
router.get('/preferences', getNotificationPreferences);

// Update notification preferences
router.put('/preferences', updateNotificationPreferences);

// Send test notification
router.post('/test', sendTestNotification);

// Trigger digest for user
router.post('/digest', triggerUserDigest);

module.exports = router;
