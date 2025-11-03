/**
 * Validation Controller (API v2)
 * 
 * HTTP handlers for content validation endpoints.
 * 
 * @module controllers/v2/validationController
 */

const validationService = require('../../services/validationService');

/**
 * Create validation rule
 * POST /api/v2/validation/rules
 */
exports.createRule = async (req, res) => {
  try {
    const ruleData = req.body;

    const rule = await validationService.createRule(ruleData);

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error creating rule:', error);
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
 * Get rule by ID
 * GET /api/v2/validation/rules/:id
 */
exports.getRule = async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);

    const rule = await validationService.getRuleById(ruleId);

    if (!rule) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Rule ${ruleId} not found`,
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error getting rule:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get validation rules
 * GET /api/v2/validation/rules
 */
exports.getRules = async (req, res) => {
  try {
    const options = {
      academyId: req.query.academyId ? parseInt(req.query.academyId) : undefined,
      contentType: req.query.contentType,
      activeOnly: req.query.activeOnly !== 'false',
      severity: req.query.severity,
    };

    const rules = await validationService.getRules(options);

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Error getting rules:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Update validation rule
 * PUT /api/v2/validation/rules/:id
 */
exports.updateRule = async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    const updates = req.body;

    const rule = await validationService.updateRule(ruleId, updates);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error updating rule:', error);
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
 * Delete validation rule
 * DELETE /api/v2/validation/rules/:id
 */
exports.deleteRule = async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);

    await validationService.deleteRule(ruleId);

    res.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
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
 * Validate content
 * POST /api/v2/content/:contentType/:contentId/validate
 */
exports.validateContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { academyId, autoFix, severities } = req.body;

    if (!academyId) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'academyId is required',
      });
    }

    const result = await validationService.validateContent(
      contentType,
      parseInt(contentId),
      parseInt(academyId),
      { autoFix, severities }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error validating content:', error);
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
 * Get validation history
 * GET /api/v2/content/:contentType/:contentId/validation/history
 */
exports.getValidationHistory = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 50,
      since: req.query.since ? new Date(req.query.since) : undefined,
    };

    const history = await validationService.getValidationHistory(
      contentType,
      parseInt(contentId),
      options
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting validation history:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get academy validation summary
 * GET /api/v2/academies/:academyId/validation/summary
 */
exports.getAcademySummary = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const options = {
      contentType: req.query.contentType,
    };

    if (req.query.startDate) {
      options.startDate = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      options.endDate = new Date(req.query.endDate);
    }

    const summary = await validationService.getAcademyValidationSummary(academyId, options);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting validation summary:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};
