const { Op } = require('sequelize');
const { Notification, NotificationPreference } = require('../models');
const { sendEmailNotification } = require('./notificationService');
const logger = require('../utils/logger');

/**
 * Notification Digest Service
 * Handles batching and sending notification digests
 */

/**
 * Get unread notifications for a user within a time period
 * @param {number} userId - User ID
 * @param {Date} since - Start time for notifications
 * @returns {Promise<Array>} List of notifications
 */
async function getUnreadNotificationsSince(userId, since) {
  try {
    const notifications = await Notification.findAll({
      where: {
        userId,
        isRead: false,
        createdAt: {
          [Op.gte]: since,
        },
      },
      order: [['createdAt', 'ASC']],
    });

    return notifications;
  } catch (error) {
    logger.error('Error fetching unread notifications:', error);
    throw error;
  }
}

/**
 * Format notifications for digest email
 * @param {Array} notifications - List of notifications
 * @returns {string} Formatted HTML content
 */
function formatDigestContent(notifications) {
  if (!notifications || notifications.length === 0) {
    return '<p>You have no new notifications.</p>';
  }

  let html = '<h2>Your Notifications</h2>';
  html += '<ul>';

  notifications.forEach(notification => {
    html += `<li>
      <strong>${notification.title}</strong>
      <p>${notification.message}</p>
      <small>${new Date(notification.createdAt).toLocaleString()}</small>
    </li>`;
  });

  html += '</ul>';
  return html;
}

/**
 * Send digest email to user
 * @param {Object} user - User object
 * @param {Array} notifications - List of notifications
 */
async function sendDigestEmail(user, notifications) {
  try {
    const subject = `GlassCode Academy Digest - ${notifications.length} Notifications`;
    const content = formatDigestContent(notifications);
    
    await sendEmailNotification(user, subject, content, {
      html: content,
    });

    logger.info('Digest email sent successfully', { 
      userId: user.id, 
      notificationCount: notifications.length 
    });
  } catch (error) {
    logger.error('Error sending digest email:', error);
    throw error;
  }
}

/**
 * Process digest for a single user
 * @param {Object} user - User object
 * @param {string} frequency - Digest frequency
 */
async function processUserDigest(user, frequency) {
  try {
    // Calculate time window based on frequency
    const now = new Date();
    let since;

    switch (frequency) {
    case 'hourly':
      since = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      break;
    case 'daily':
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      break;
    case 'weekly':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      break;
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
    }

    // Get unread notifications since the time window
    const notifications = await getUnreadNotificationsSince(user.id, since);

    // If no notifications, nothing to send
    if (notifications.length === 0) {
      logger.info('No notifications to include in digest', { 
        userId: user.id, 
        frequency 
      });
      return;
    }

    // Send digest email
    await sendDigestEmail(user, notifications);

    // Optionally mark notifications as read after sending digest
    // This is a design choice - some prefer to keep them unread
    // await markNotificationsAsRead(notifications);
  } catch (error) {
    logger.error('Error processing user digest:', error);
    throw error;
  }
}

/**
 * Process digests for all users with a specific frequency
 * @param {string} frequency - Digest frequency (hourly, daily, weekly)
 */
async function processDigests(frequency) {
  try {
    logger.info('Starting digest processing', { frequency });

    // Find all users with this digest frequency
    const preferences = await NotificationPreference.findAll({
      where: {
        digestFrequency: frequency,
      },
      include: [{
        model: require('../models').User,
        as: 'notificationPreferenceUser',
      }],
    });

    logger.info('Found users for digest processing', { 
      frequency, 
      count: preferences.length 
    });

    // Process each user's digest
    for (const preference of preferences) {
      try {
        if (preference.user && preference.user.email) {
          await processUserDigest(preference.user, frequency);
        }
      } catch (userError) {
        logger.error('Error processing digest for user', {
          userId: preference.userId,
          frequency,
          error: userError.message,
        });
        // Continue with other users even if one fails
      }
    }

    logger.info('Completed digest processing', { frequency });
  } catch (error) {
    logger.error('Error processing digests:', error);
    throw error;
  }
}

/**
 * Schedule digest processing
 * This would typically be called by a cron job or scheduler
 */
function scheduleDigests() {
  // Hourly digests
  setInterval(() => {
    processDigests('hourly').catch(error => {
      logger.error('Error in hourly digest processing:', error);
    });
  }, 60 * 60 * 1000); // Every hour

  // Daily digests at midnight
  const runDaily = () => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0
    );
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    setTimeout(() => {
      processDigests('daily').catch(error => {
        logger.error('Error in daily digest processing:', error);
      });
      // Schedule next day
      runDaily();
    }, timeUntilMidnight);
  };

  // Start daily scheduling
  runDaily();

  // Weekly digests on Sunday at midnight
  const runWeekly = () => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7;
    const nextSunday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntilSunday,
      0,
      0,
      0
    );
    
    // If today is Sunday and it's already past midnight, schedule for next Sunday
    if (daysUntilSunday === 0 && now.getHours() > 0) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }

    const timeUntilSunday = nextSunday.getTime() - now.getTime();

    setTimeout(() => {
      processDigests('weekly').catch(error => {
        logger.error('Error in weekly digest processing:', error);
      });
      // Schedule next week
      runWeekly();
    }, timeUntilSunday);
  };

  // Start weekly scheduling
  runWeekly();
}

module.exports = {
  processDigests,
  scheduleDigests,
  processUserDigest,
  getUnreadNotificationsSince,
};