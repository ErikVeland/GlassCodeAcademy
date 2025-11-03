/**
 * Content Versioning Routes (API v2)
 * 
 * RESTful routes for content version management.
 * 
 * @module routes/v2/versioningRoutes
 */

const express = require('express');
const router = express.Router();
const versioningController = require('../../controllers/v2/versioningController');
const authenticate = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionCheckMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v2/content/:contentType/:contentId/versions
 * @desc    Create new version
 * @access  Content editors
 */
router.post(
  '/content/:contentType/:contentId/versions',
  requirePermission('content.version.create'),
  versioningController.createVersion
);

/**
 * @route   GET /api/v2/content/:contentType/:contentId/versions
 * @desc    Get content versions
 * @access  Content viewers
 */
router.get(
  '/content/:contentType/:contentId/versions',
  requirePermission('content.version.view'),
  versioningController.getContentVersions
);

/**
 * @route   GET /api/v2/content/:contentType/:contentId/versions/latest
 * @desc    Get latest version
 * @access  Content viewers
 */
router.get(
  '/content/:contentType/:contentId/versions/latest',
  requirePermission('content.version.view'),
  versioningController.getLatestVersion
);

/**
 * @route   POST /api/v2/content/:contentType/:contentId/versions/cleanup
 * @desc    Cleanup old versions
 * @access  Content admin
 */
router.post(
  '/content/:contentType/:contentId/versions/cleanup',
  requirePermission('content.version.cleanup'),
  versioningController.cleanupVersions
);

/**
 * @route   GET /api/v2/versions/:versionId
 * @desc    Get version by ID
 * @access  Content viewers
 */
router.get(
  '/versions/:versionId',
  requirePermission('content.version.view'),
  versioningController.getVersion
);

/**
 * @route   POST /api/v2/versions/:versionId/restore
 * @desc    Restore version
 * @access  Content editors
 */
router.post(
  '/versions/:versionId/restore',
  requirePermission('content.version.restore'),
  versioningController.restoreVersion
);

/**
 * @route   PUT /api/v2/versions/:versionId/status
 * @desc    Update version status
 * @access  Content editors
 */
router.put(
  '/versions/:versionId/status',
  requirePermission('content.version.update'),
  versioningController.updateVersionStatus
);

/**
 * @route   GET /api/v2/versions/compare
 * @desc    Compare two versions
 * @access  Content viewers
 */
router.get(
  '/versions/compare',
  requirePermission('content.version.view'),
  versioningController.compareVersions
);

/**
 * @route   GET /api/v2/academies/:academyId/versions
 * @desc    Get academy version history
 * @access  Academy members
 */
router.get(
  '/academies/:academyId/versions',
  requirePermission('content.version.view'),
  versioningController.getAcademyVersionHistory
);

module.exports = router;
