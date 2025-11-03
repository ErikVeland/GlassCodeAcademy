/**
 * Academy Management Routes (API v2)
 * 
 * RESTful routes for academy management.
 * 
 * @module routes/v2/academyRoutes
 */

const express = require('express');
const router = express.Router();
const academyController = require('../../controllers/v2/academyManagementController');
const authenticate = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionCheckMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v2/academies
 * @desc    Create new academy
 * @access  Admin only
 */
router.post(
  '/',
  requirePermission('academies.create'),
  academyController.createAcademy
);

/**
 * @route   GET /api/v2/academies
 * @desc    Get all academies
 * @access  Authenticated users
 */
router.get(
  '/',
  academyController.getAllAcademies
);

/**
 * @route   GET /api/v2/academies/:id
 * @desc    Get academy by ID
 * @access  Authenticated users
 */
router.get(
  '/:id',
  academyController.getAcademy
);

/**
 * @route   PUT /api/v2/academies/:id
 * @desc    Update academy
 * @access  Academy admin
 */
router.put(
  '/:id',
  requirePermission('academies.update'),
  academyController.updateAcademy
);

/**
 * @route   DELETE /api/v2/academies/:id
 * @desc    Delete academy
 * @access  System admin
 */
router.delete(
  '/:id',
  requirePermission('academies.delete'),
  academyController.deleteAcademy
);

/**
 * @route   GET /api/v2/academies/:id/settings
 * @desc    Get academy settings
 * @access  Academy members
 */
router.get(
  '/:id/settings',
  academyController.getSettings
);

/**
 * @route   PUT /api/v2/academies/:id/settings
 * @desc    Update academy settings
 * @access  Academy admin
 */
router.put(
  '/:id/settings',
  requirePermission('academies.settings.update'),
  academyController.updateSettings
);

/**
 * @route   GET /api/v2/academies/:id/statistics
 * @desc    Get academy statistics
 * @access  Academy members
 */
router.get(
  '/:id/statistics',
  academyController.getStatistics
);

/**
 * @route   POST /api/v2/academies/:id/features/:featureName
 * @desc    Toggle feature flag
 * @access  Academy admin
 */
router.post(
  '/:id/features/:featureName',
  requirePermission('academies.features.update'),
  academyController.toggleFeature
);

module.exports = router;
