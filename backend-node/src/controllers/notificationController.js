const {
  sendNotification,
  markAsRead,
  getUserNotifications,
  deleteNotification,
  getUserPreferences,
  createInAppNotification,
} = require('../services/notificationService');
const { processUserDigest } = require('../services/notificationDigestService');
const { Notification, NotificationPreference, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Get user notifications
 * GET /api/notifications
 */
async function getNotifications(req, res) {
  try {
    const { limit, offset, unreadOnly } = req.query;
    const notifications = await getUserNotifications(req.user.id, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
}

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await markAsRead(id, req.user.id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
async function deleteNotificationById(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteNotification(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
}

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
async function getNotificationPreferences(req, res) {
  try {
    const preferences = await NotificationPreference.findAll({
      where: {
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message,
    });
  }
}

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
async function updateNotificationPreferences(req, res) {
  try {
    const { category, preferences } = req.body;

    // Validate required fields
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    // Find or create preference record
    const [preference, created] = await NotificationPreference.findOrCreate({
      where: {
        userId: req.user.id,
        category,
      },
      defaults: {
        userId: req.user.id,
        category,
        ...preferences,
      },
    });

    // If not created, update existing
    if (!created) {
      await preference.update(preferences);
    }

    res.json({
      success: true,
      data: preference,
      message: created ? 'Preferences created successfully' : 'Preferences updated successfully',
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
}

/**
 * Send test notification
 * POST /api/notifications/test
 */
async function sendTestNotification(req, res) {
  try {
    const { title, message, type } = req.body;
    
    // Create in-app notification
    const notification = await createInAppNotification(req.user.id, title, message, {
      type: type || 'info',
      category: 'test',
    });

    res.json({
      success: true,
      data: notification,
      message: 'Test notification created successfully',
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
}

/**
 * Trigger digest for user
 * POST /api/notifications/digest
 */
async function triggerUserDigest(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's digest preference
    const preferences = await NotificationPreference.findAll({
      where: {
        userId: req.user.id,
      },
    });

    // Process digest for each frequency
    for (const preference of preferences) {
      if (preference.digestFrequency && preference.digestFrequency !== 'immediately') {
        await processUserDigest(user, preference.digestFrequency);
      }
    }

    res.json({
      success: true,
      message: 'Digest processing completed',
    });
  } catch (error) {
    logger.error('Error triggering user digest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process digest',
      error: error.message,
    });
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotificationById,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  triggerUserDigest,
};