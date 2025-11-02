const { Report, User } = require('../models');
const { ForumThread, ForumPost } = require('../models');
const logger = require('../utils/logger');

/**
 * Report Service
 * Handles abuse reports and prevention
 */

/**
 * Create a new report
 * @param {number} reporterId - User ID of the reporter
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} Created report
 */
async function createReport(reporterId, reportData) {
  try {
    // Check if user has already reported this target
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        targetType: reportData.targetType,
        targetId: reportData.targetId,
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this item');
    }

    // Validate target exists
    const targetExists = await validateTargetExists(
      reportData.targetType,
      reportData.targetId
    );

    if (!targetExists) {
      throw new Error('Target not found');
    }

    const report = await Report.create({
      reporterId,
      targetType: reportData.targetType,
      targetId: reportData.targetId,
      reason: reportData.reason,
      description: reportData.description,
    });

    // Increment report count on the target item
    await incrementTargetReportCount(
      reportData.targetType,
      reportData.targetId
    );

    // Include reporter info
    report.reporter = await User.findByPk(reporterId, {
      attributes: ['id', 'name', 'email'],
    });

    return report;
  } catch (error) {
    logger.error('Error creating report:', error);
    throw error;
  }
}

/**
 * Validate that a target exists
 * @param {string} targetType - Type of target
 * @param {number} targetId - ID of target
 * @returns {Promise<boolean>} Whether target exists
 */
async function validateTargetExists(targetType, targetId) {
  try {
    let model;
    switch (targetType) {
    case 'thread':
      model = ForumThread;
      break;
    case 'post':
      model = ForumPost;
      break;
    case 'user':
      model = User;
      break;
    default:
      return false;
    }

    const target = await model.findByPk(targetId);
    return !!target;
  } catch (error) {
    logger.error('Error validating target existence:', error);
    return false;
  }
}

/**
 * Increment report count on target item
 * @param {string} targetType - Type of target
 * @param {number} targetId - ID of target
 */
async function incrementTargetReportCount(targetType, targetId) {
  try {
    let model;
    switch (targetType) {
    case 'thread':
      model = ForumThread;
      break;
    case 'post':
      model = ForumPost;
      break;
    default:
      return;
    }

    const target = await model.findByPk(targetId);
    if (target) {
      await target.increment('reportCount');
    }
  } catch (error) {
    logger.error('Error incrementing target report count:', error);
  }
}

/**
 * Get reports
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Reports with pagination
 */
async function getReports(options = {}) {
  try {
    const { page = 1, limit = 20, status, reason, targetType } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (reason) {
      whereClause.reason = reason;
    }
    if (targetType) {
      whereClause.targetType = targetType;
    }

    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      reports: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching reports:', error);
    throw error;
  }
}

/**
 * Get report by ID
 * @param {number} id - Report ID
 * @returns {Promise<Object>} Report object
 */
async function getReportById(id) {
  try {
    const report = await Report.findByPk(id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return report;
  } catch (error) {
    logger.error('Error fetching report:', error);
    throw error;
  }
}

/**
 * Update report status
 * @param {number} id - Report ID
 * @param {number} resolverId - User ID of resolver
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated report
 */
async function updateReportStatus(id, resolverId, updateData) {
  try {
    const report = await Report.findByPk(id);
    if (!report) {
      throw new Error('Report not found');
    }

    await report.update({
      status: updateData.status,
      resolvedBy: resolverId,
      resolvedAt: new Date(),
      resolutionNotes: updateData.resolutionNotes,
    });

    // Include reporter and resolver info
    report.reporter = await User.findByPk(report.reporterId, {
      attributes: ['id', 'name', 'email'],
    });
    if (report.resolvedBy) {
      report.resolver = await User.findByPk(report.resolvedBy, {
        attributes: ['id', 'name', 'email'],
      });
    }

    return report;
  } catch (error) {
    logger.error('Error updating report status:', error);
    throw error;
  }
}

/**
 * Get user's report history
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} User's reports
 */
async function getUserReportHistory(userId, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;

    const reports = await Report.findAll({
      where: {
        reporterId: userId,
      },
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return reports;
  } catch (error) {
    logger.error('Error fetching user report history:', error);
    throw error;
  }
}

/**
 * Get reports by target
 * @param {string} targetType - Type of target
 * @param {number} targetId - ID of target
 * @returns {Promise<Array>} Reports for target
 */
async function getReportsByTarget(targetType, targetId) {
  try {
    const reports = await Report.findAll({
      where: {
        targetType,
        targetId,
      },
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return reports;
  } catch (error) {
    logger.error('Error fetching reports by target:', error);
    throw error;
  }
}

/**
 * Auto-moderate content based on report thresholds
 * @param {string} targetType - Type of target
 * @param {number} targetId - ID of target
 * @param {number} threshold - Report threshold
 */
async function autoModerateContent(targetType, targetId, threshold = 5) {
  try {
    // Get report count for target
    const reports = await getReportsByTarget(targetType, targetId);
    
    if (reports.length >= threshold) {
      // Auto-hide content
      let model;
      switch (targetType) {
      case 'thread':
        model = ForumThread;
        break;
      case 'post':
        model = ForumPost;
        break;
      default:
        return;
      }

      const target = await model.findByPk(targetId);
      if (target && target.isActive) {
        await target.update({
          isActive: false,
          isApproved: false,
        });

        logger.info('Content auto-moderated due to report threshold', {
          targetType,
          targetId,
          reportCount: reports.length,
        });
      }
    }
  } catch (error) {
    logger.error('Error in auto-moderation:', error);
  }
}

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  getUserReportHistory,
  getReportsByTarget,
  autoModerateContent,
};