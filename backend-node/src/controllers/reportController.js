const {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  getUserReportHistory,
  getReportsByTarget,
} = require('../services/reportService');
const logger = require('../utils/logger');

/**
 * Report Controller
 * Handles HTTP requests for abuse reports
 */

/**
 * Create a new report
 * POST /api/reports
 */
async function createReportHandler(req, res) {
  try {
    const { targetType, targetId, reason, description } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, and reason are required',
      });
    }

    const report = await createReport(reporterId, {
      targetType,
      targetId,
      reason,
      description,
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message,
    });
  }
}

/**
 * Get reports (admin only)
 * GET /api/admin/reports
 */
async function getReportsHandler(req, res) {
  try {
    const { page, limit, status, reason, targetType } = req.query;

    const result = await getReports({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      reason,
      targetType,
    });

    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
}

/**
 * Get report by ID (admin only)
 * GET /api/admin/reports/:id
 */
async function getReportByIdHandler(req, res) {
  try {
    const { id } = req.params;

    const report = await getReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message,
    });
  }
}

/**
 * Update report status (admin only)
 * PUT /api/admin/reports/:id/status
 */
async function updateReportStatusHandler(req, res) {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const resolverId = req.user.id;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const report = await updateReportStatus(id, resolverId, {
      status,
      resolutionNotes,
    });

    res.json({
      success: true,
      data: report,
      message: 'Report status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message,
    });
  }
}

/**
 * Get user's report history
 * GET /api/reports/my-reports
 */
async function getUserReportHistoryHandler(req, res) {
  try {
    const { limit, offset } = req.query;
    const userId = req.user.id;

    const reports = await getUserReportHistory(userId, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error('Error fetching user report history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report history',
      error: error.message,
    });
  }
}

/**
 * Get reports by target
 * GET /api/reports/target/:targetType/:targetId
 */
async function getReportsByTargetHandler(req, res) {
  try {
    const { targetType, targetId } = req.params;

    const reports = await getReportsByTarget(targetType, targetId);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error('Error fetching reports by target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
}

module.exports = {
  createReportHandler,
  getReportsHandler,
  getReportByIdHandler,
  updateReportStatusHandler,
  getUserReportHistoryHandler,
  getReportsByTargetHandler,
};
