/**
 * Content Versioning Controller (API v2)
 * 
 * HTTP handlers for content version management endpoints.
 * 
 * @module controllers/v2/versioningController
 */

const versioningService = require('../../services/contentVersioningService');

/**
 * Create new version
 * POST /api/v2/content/:contentType/:contentId/versions
 */
exports.createVersion = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { academyId, changeSummary, status, metadata } = req.body;
    const userId = req.user?.id;

    if (!academyId) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'academyId is required',
      });
    }

    const version = await versioningService.createVersion(
      contentType,
      parseInt(contentId),
      parseInt(academyId),
      userId,
      { changeSummary, status, metadata }
    );

    res.status(201).json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Error creating version:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : 'internal-error'}`,
      title: status === 404 ? 'Not Found' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Get content versions
 * GET /api/v2/content/:contentType/:contentId/versions
 */
exports.getContentVersions = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status,
    };

    const result = await versioningService.getContentVersions(
      contentType,
      parseInt(contentId),
      options
    );

    res.json({
      success: true,
      data: result.versions,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get version by ID
 * GET /api/v2/versions/:versionId
 */
exports.getVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await versioningService.getVersionById(versionId);

    if (!version) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Version ${versionId} not found`,
      });
    }

    res.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get latest version
 * GET /api/v2/content/:contentType/:contentId/versions/latest
 */
exports.getLatestVersion = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { status } = req.query;

    const version = await versioningService.getLatestVersion(
      contentType,
      parseInt(contentId),
      status
    );

    if (!version) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No version found',
      });
    }

    res.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Error getting latest version:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Restore version
 * POST /api/v2/versions/:versionId/restore
 */
exports.restoreVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const userId = req.user?.id;
    const { createBackup } = req.body;

    const result = await versioningService.restoreVersion(versionId, userId, {
      createBackup: createBackup !== false,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : 'internal-error'}`,
      title: status === 404 ? 'Not Found' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Compare versions
 * GET /api/v2/versions/compare
 */
exports.compareVersions = async (req, res) => {
  try {
    const { versionId1, versionId2 } = req.query;

    if (!versionId1 || !versionId2) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'Both versionId1 and versionId2 are required',
      });
    }

    const comparison = await versioningService.compareVersions(versionId1, versionId2);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : 'bad-request'}`,
      title: status === 404 ? 'Not Found' : 'Bad Request',
      status,
      detail: error.message,
    });
  }
};

/**
 * Update version status
 * PUT /api/v2/versions/:versionId/status
 */
exports.updateVersionStatus = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'status is required',
      });
    }

    const version = await versioningService.updateVersionStatus(versionId, status);

    res.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Error updating version status:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : 'bad-request'}`,
      title: status === 404 ? 'Not Found' : 'Bad Request',
      status,
      detail: error.message,
    });
  }
};

/**
 * Get academy version history
 * GET /api/v2/academies/:academyId/versions
 */
exports.getAcademyVersionHistory = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      contentType: req.query.contentType,
      status: req.query.status,
    };

    const result = await versioningService.getAcademyVersionHistory(academyId, options);

    res.json({
      success: true,
      data: result.versions,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error getting version history:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Cleanup old versions
 * POST /api/v2/content/:contentType/:contentId/versions/cleanup
 */
exports.cleanupVersions = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { keepCount, keepDays } = req.body;

    const deletedCount = await versioningService.cleanupOldVersions(
      contentType,
      parseInt(contentId),
      { keepCount, keepDays }
    );

    res.json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    console.error('Error cleaning up versions:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};
