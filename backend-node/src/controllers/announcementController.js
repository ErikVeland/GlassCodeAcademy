const {
  getPublishedAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  publishAnnouncement,
} = require('../services/announcementService');
const logger = require('../utils/logger');

/**
 * Announcement Controller
 * Handles HTTP requests for announcements
 */

/**
 * Get published announcements
 * GET /api/announcements
 */
async function getAnnouncements(req, res) {
  try {
    const { limit, offset } = req.query;

    const announcements = await getPublishedAnnouncements({
      limit: limit ? parseInt(limit) : 10,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message,
    });
  }
}

/**
 * Get announcement by ID
 * GET /api/announcements/:id
 */
async function getAnnouncement(req, res) {
  try {
    const { id } = req.params;

    const announcement = await getAnnouncementById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    logger.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message,
    });
  }
}

/**
 * Create a new announcement
 * POST /api/announcements
 */
async function createAnnouncementHandler(req, res) {
  try {
    const { title, content, type, priority, isPublished, expiresAt } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const announcement = await createAnnouncement(userId, {
      title,
      content,
      type,
      priority,
      isPublished,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    });
  } catch (error) {
    logger.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
}

/**
 * Update an announcement
 * PUT /api/announcements/:id
 */
async function updateAnnouncementHandler(req, res) {
  try {
    const { id } = req.params;
    const { title, content, type, priority, isPublished, expiresAt } = req.body;
    const userId = req.user.id;

    const announcement = await updateAnnouncement(id, userId, {
      title,
      content,
      type,
      priority,
      isPublished,
      expiresAt,
    });

    res.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    });
  } catch (error) {
    logger.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: error.message,
    });
  }
}

/**
 * Delete an announcement
 * DELETE /api/announcements/:id
 */
async function deleteAnnouncementHandler(req, res) {
  try {
    const { id } = req.params;

    const deleted = await deleteAnnouncement(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message,
    });
  }
}

/**
 * Get all announcements (admin only)
 * GET /api/admin/announcements
 */
async function getAllAnnouncementsHandler(req, res) {
  try {
    const { page, limit, includeUnpublished } = req.query;

    const result = await getAllAnnouncements({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      includeUnpublished: includeUnpublished === 'true',
    });

    res.json({
      success: true,
      data: result.announcements,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching all announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message,
    });
  }
}

/**
 * Publish an announcement
 * POST /api/admin/announcements/:id/publish
 */
async function publishAnnouncementHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await publishAnnouncement(id, userId);

    res.json({
      success: true,
      data: announcement,
      message: 'Announcement published successfully',
    });
  } catch (error) {
    logger.error('Error publishing announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish announcement',
      error: error.message,
    });
  }
}

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  getAllAnnouncementsHandler,
  publishAnnouncementHandler,
};
