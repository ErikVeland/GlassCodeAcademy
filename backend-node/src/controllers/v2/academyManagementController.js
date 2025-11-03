/**
 * Academy Management Controller (API v2)
 * 
 * HTTP handlers for academy management endpoints.
 * Thin controller layer that delegates to AcademyManagementService.
 * 
 * @module controllers/v2/academyManagementController
 */

const academyManagementService = require('../../services/academyManagementService');

/**
 * Create a new academy
 * POST /api/v2/academies
 * 
 * @param {Object} req.body.academy - Academy data
 * @param {Object} req.body.settings - Academy settings (optional)
 */
exports.createAcademy = async (req, res) => {
  try {
    const { academy: academyData, settings: settingsData } = req.body;

    if (!academyData) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'Academy data is required',
      });
    }

    const result = await academyManagementService.createAcademy(academyData, settingsData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating academy:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get academy by ID
 * GET /api/v2/academies/:id
 */
exports.getAcademy = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);

    const academy = await academyManagementService.getAcademyById(academyId);

    if (!academy) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Academy with ID ${academyId} not found`,
      });
    }

    res.json({
      success: true,
      data: academy,
    });
  } catch (error) {
    console.error('Error getting academy:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get all academies
 * GET /api/v2/academies
 * 
 * Query params: limit, offset, includeInactive
 */
exports.getAllAcademies = async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      includeInactive: req.query.includeInactive === 'true',
    };

    const result = await academyManagementService.getAllAcademies(options);

    res.json({
      success: true,
      data: result.academies,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error getting academies:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Update academy
 * PUT /api/v2/academies/:id
 */
exports.updateAcademy = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'No update data provided',
      });
    }

    const academy = await academyManagementService.updateAcademy(academyId, updates);

    res.json({
      success: true,
      data: academy,
    });
  } catch (error) {
    console.error('Error updating academy:', error);
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
 * Delete academy
 * DELETE /api/v2/academies/:id
 */
exports.deleteAcademy = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);

    await academyManagementService.deleteAcademy(academyId);

    res.json({
      success: true,
      message: 'Academy deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting academy:', error);
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
 * Get academy settings
 * GET /api/v2/academies/:id/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);

    const settings = await academyManagementService.getAcademySettings(academyId);

    if (!settings) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Settings for academy ${academyId} not found`,
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Update academy settings
 * PUT /api/v2/academies/:id/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);
    const settingsUpdates = req.body;

    const settings = await academyManagementService.updateAcademySettings(
      academyId,
      settingsUpdates
    );

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
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
 * Get academy statistics
 * GET /api/v2/academies/:id/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);

    const statistics = await academyManagementService.getAcademyStatistics(academyId);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Toggle feature flag
 * POST /api/v2/academies/:id/features/:featureName
 * 
 * @param {boolean} req.body.enabled - Feature enabled status
 */
exports.toggleFeature = async (req, res) => {
  try {
    const academyId = parseInt(req.params.id);
    const { featureName } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'enabled field must be a boolean',
      });
    }

    const settings = await academyManagementService.setFeatureEnabled(
      academyId,
      featureName,
      enabled
    );

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error toggling feature:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : 'internal-error'}`,
      title: status === 404 ? 'Not Found' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};
