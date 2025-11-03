/**
 * Validation Routes (API v2)
 * 
 * RESTful routes for content validation.
 * 
 * @module routes/v2/validationRoutes
 */

const express = require('express');
const router = express.Router();
const validationController = require('../../controllers/v2/validationController');
const authenticate = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionCheckMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v2/validation/rules
 * @desc    Create validation rule
 * @access  Academy admin
 */
router.post(
  '/validation/rules',
  requirePermission('validation.rules.create'),
  validationController.createRule
);

/**
 * @route   GET /api/v2/validation/rules
 * @desc    Get validation rules
 * @access  Authenticated users
 */
router.get(
  '/validation/rules',
  validationController.getRules
);

/**
 * @route   GET /api/v2/validation/rules/:id
 * @desc    Get rule by ID
 * @access  Authenticated users
 */
router.get(
  '/validation/rules/:id',
  validationController.getRule
);

/**
 * @route   PUT /api/v2/validation/rules/:id
 * @desc    Update validation rule
 * @access  Academy admin
 */
router.put(
  '/validation/rules/:id',
  requirePermission('validation.rules.update'),
  validationController.updateRule
);

/**
 * @route   DELETE /api/v2/validation/rules/:id
 * @desc    Delete validation rule
 * @access  Academy admin
 */
router.delete(
  '/validation/rules/:id',
  requirePermission('validation.rules.delete'),
  validationController.deleteRule
);

/**
 * @route   POST /api/v2/content/:contentType/:contentId/validate
 * @desc    Validate content
 * @access  Content editors
 */
router.post(
  '/content/:contentType/:contentId/validate',
  requirePermission('content.validate'),
  validationController.validateContent
);

/**
 * @route   GET /api/v2/content/:contentType/:contentId/validation/history
 * @desc    Get validation history
 * @access  Content viewers
 */
router.get(
  '/content/:contentType/:contentId/validation/history',
  requirePermission('content.validation.view'),
  validationController.getValidationHistory
);

/**
 * @route   GET /api/v2/academies/:academyId/validation/summary
 * @desc    Get academy validation summary
 * @access  Academy admin
 */
router.get(
  '/academies/:academyId/validation/summary',
  requirePermission('validation.view.summary'),
  validationController.getAcademySummary
);

module.exports = router;
