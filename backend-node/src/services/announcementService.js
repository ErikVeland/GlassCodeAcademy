const { Announcement, User } = require('../models');
const { sendNotification } = require('./notificationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Announcement Service
 * Handles business logic for announcements
 */

/**
 * Get all published announcements
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of published announcements
 */
async function getPublishedAnnouncements(options = {}) {
  try {
    const { limit = 10, offset = 0 } = options;

    const announcements = await Announcement.findAll({
      where: {
        isPublished: true,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['priority', 'DESC'],
        ['publishedAt', 'DESC'],
      ],
      limit,
      offset,
    });

    return announcements;
  } catch (error) {
    logger.error('Error fetching published announcements:', error);
    throw error;
  }
}

/**
 * Get announcement by ID
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Announcement object
 */
async function getAnnouncementById(id) {
  try {
    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return announcement;
  } catch (error) {
    logger.error('Error fetching announcement:', error);
    throw error;
  }
}

/**
 * Create a new announcement
 * @param {number} userId - User ID
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<Object>} Created announcement
 */
async function createAnnouncement(userId, announcementData) {
  try {
    const announcement = await Announcement.create({
      title: announcementData.title,
      content: announcementData.content,
      type: announcementData.type || 'info',
      priority: announcementData.priority || 'medium',
      isPublished: announcementData.isPublished || false,
      publishedAt: announcementData.isPublished ? new Date() : null,
      expiresAt: announcementData.expiresAt,
      createdBy: userId,
      updatedBy: userId,
    });

    // Include creator info
    announcement.creator = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
    });

    // Send notification if announcement is published immediately
    if (announcement.isPublished) {
      await sendAnnouncementNotification(announcement);
    }

    return announcement;
  } catch (error) {
    logger.error('Error creating announcement:', error);
    throw error;
  }
}

/**
 * Update an announcement
 * @param {number} id - Announcement ID
 * @param {number} userId - User ID
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<Object>} Updated announcement
 */
async function updateAnnouncement(id, userId, announcementData) {
  try {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Update publishedAt if isPublished changes from false to true
    if (!announcement.isPublished && announcementData.isPublished) {
      announcementData.publishedAt = new Date();
    }

    await announcement.update({
      ...announcementData,
      updatedBy: userId,
    });

    // Include creator and updater info
    announcement.creator = await User.findByPk(announcement.createdBy, {
      attributes: ['id', 'name', 'email'],
    });
    if (announcement.updatedBy) {
      announcement.updater = await User.findByPk(announcement.updatedBy, {
        attributes: ['id', 'name', 'email'],
      });
    }

    return announcement;
  } catch (error) {
    logger.error('Error updating announcement:', error);
    throw error;
  }
}

/**
 * Delete an announcement
 * @param {number} id - Announcement ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteAnnouncement(id) {
  try {
    const deleted = await Announcement.destroy({
      where: { id },
    });

    return deleted > 0;
  } catch (error) {
    logger.error('Error deleting announcement:', error);
    throw error;
  }
}

/**
 * Get all announcements (admin only)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Announcements with pagination
 */
async function getAllAnnouncements(options = {}) {
  try {
    const { page = 1, limit = 20, includeUnpublished = false } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (!includeUnpublished) {
      whereClause.isPublished = true;
    }

    const { count, rows } = await Announcement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      announcements: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching all announcements:', error);
    throw error;
  }
}

/**
 * Publish an announcement
 * @param {number} id - Announcement ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Published announcement
 */
async function publishAnnouncement(id, userId) {
  try {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    await announcement.update({
      isPublished: true,
      publishedAt: new Date(),
      updatedBy: userId,
    });

    // Send notification to all users about the new announcement
    await sendAnnouncementNotification(announcement);

    return announcement;
  } catch (error) {
    logger.error('Error publishing announcement:', error);
    throw error;
  }
}

/**
 * Send notification about a new announcement to all users
 * @param {Object} announcement - Announcement object
 */
async function sendAnnouncementNotification(announcement) {
  try {
    // Get all users (in a real application, you might want to paginate this)
    const users = await User.findAll({
      attributes: ['id', 'name', 'email'],
    });

    // Send notification to each user
    for (const user of users) {
      try {
        await sendNotification(
          user.id,
          announcement.title,
          announcement.content,
          {
            category: 'announcement',
            type: announcement.type || 'info',
            entityId: announcement.id,
            entityType: 'announcement',
          }
        );
      } catch (userError) {
        logger.error('Error sending announcement notification to user:', {
          userId: user.id,
          announcementId: announcement.id,
          error: userError.message,
        });
      }
    }

    logger.info('Announcement notifications sent', {
      announcementId: announcement.id,
      userCount: users.length,
    });
  } catch (error) {
    logger.error('Error sending announcement notifications:', error);
  }
}

module.exports = {
  getPublishedAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  publishAnnouncement,
  sendAnnouncementNotification,
};
