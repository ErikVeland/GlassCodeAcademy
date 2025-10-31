const nodemailer = require('nodemailer');
const { Notification, NotificationPreference, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Notification Service
 * Handles sending notifications through various channels
 */

// Email transporter configuration
let transporter;

// Initialize email transporter
function initializeEmailTransporter() {
  // In production, use proper email service like SendGrid or AWS SES
  // For development, you can use ethereal.email or similar services
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || 'your@email.com',
      pass: process.env.EMAIL_PASS || 'your_password',
    },
  });
}

// Initialize transporter on service load
initializeEmailTransporter();

/**
 * Get user notification preferences
 * @param {number} userId - User ID
 * @param {string} category - Notification category
 * @returns {Promise<Object>} User notification preferences
 */
async function getUserPreferences(userId, category) {
  try {
    const preference = await NotificationPreference.findOne({
      where: {
        userId,
        category,
      },
    });
    
    // Return default preferences if none found
    if (!preference) {
      return {
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        digestFrequency: 'immediately',
      };
    }
    
    return preference;
  } catch (error) {
    logger.error('Error fetching user notification preferences:', error);
    // Return defaults on error
    return {
      emailEnabled: true,
      inAppEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      digestFrequency: 'immediately',
    };
  }
}

/**
 * Send email notification
 * @param {Object} user - User object
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {Object} options - Additional options
 */
async function sendEmailNotification(user, subject, message, options = {}) {
  try {
    // Skip if no email or user opted out
    if (!user.email || !options.emailEnabled) {
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"GlassCode Academy" <no-reply@glasscode.academy>',
      to: user.email,
      subject,
      text: message,
      html: options.html || `<p>${message}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email notification sent:', { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Error sending email notification:', error);
    throw error;
  }
}

/**
 * Create in-app notification
 * @param {number} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created notification
 */
async function createInAppNotification(userId, title, message, options = {}) {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type: options.type || 'info',
      priority: options.priority || 'medium',
      category: options.category || 'general',
      entityId: options.entityId,
      entityType: options.entityType,
      metadata: options.metadata,
    });
    
    return notification;
  } catch (error) {
    logger.error('Error creating in-app notification:', error);
    throw error;
  }
}

/**
 * Send notification through all enabled channels
 * @param {number} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Notification options
 */
async function sendNotification(userId, title, message, options = {}) {
  try {
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get user preferences for this category
    const preferences = await getUserPreferences(userId, options.category || 'general');

    // If digest frequency is not immediate, don't send now
    if (preferences.digestFrequency && preferences.digestFrequency !== 'immediately') {
      // Create in-app notification only, email will be sent in digest
      if (preferences.inAppEnabled) {
        await createInAppNotification(userId, title, message, {
          ...options,
          type: options.type || 'info',
          priority: options.priority || 'medium',
        });
      }
      return;
    }

    // Send email notification if enabled
    if (preferences.emailEnabled) {
      await sendEmailNotification(user, title, message, {
        ...options,
        emailEnabled: preferences.emailEnabled,
      });
    }

    // Create in-app notification if enabled
    if (preferences.inAppEnabled) {
      await createInAppNotification(userId, title, message, {
        ...options,
        type: options.type || 'info',
        priority: options.priority || 'medium',
      });
    }

    // TODO: Implement push notifications and SMS
    // For now, we're focusing on email and in-app notifications
    
    logger.info('Notification sent successfully', { userId, title });
  } catch (error) {
    logger.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of notifications
 */
async function getUserNotifications(userId, options = {}) {
  try {
    const { limit = 20, offset = 0, unreadOnly = false } = options;
    
    const whereClause = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return notifications;
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    throw error;
  }
}

/**
 * Delete notification
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteNotification(notificationId, userId) {
  try {
    const deleted = await Notification.destroy({
      where: {
        id: notificationId,
        userId,
      },
    });

    return deleted > 0;
  } catch (error) {
    logger.error('Error deleting notification:', error);
    throw error;
  }
}

module.exports = {
  sendNotification,
  markAsRead,
  getUserNotifications,
  deleteNotification,
  initializeEmailTransporter,
  sendEmailNotification,
  createInAppNotification,
  getUserPreferences,
};