/**
 * Membership Routes (API v2)
 * 
 * RESTful routes for academy membership management.
 * 
 * @module routes/v2/membershipRoutes
 */

const express = require('express');
const router = express.Router();
const membershipController = require('../../controllers/v2/membershipController');
const authenticate = require('../../middleware/authMiddleware');
const { requireAcademyMembership } = require('../../middleware/tenantIsolationMiddleware');
const { requirePermission } = require('../../middleware/permissionCheckMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v2/academies/:academyId/members
 * @desc    Add member to academy
 * @access  Academy admin
 */
router.post(
  '/academies/:academyId/members',
  requireAcademyMembership,
  requirePermission('members.add'),
  membershipController.addMember
);

/**
 * @route   GET /api/v2/academies/:academyId/members
 * @desc    Get academy members
 * @access  Academy members
 */
router.get(
  '/academies/:academyId/members',
  requireAcademyMembership,
  membershipController.getAcademyMembers
);

/**
 * @route   POST /api/v2/academies/:academyId/members/bulk
 * @desc    Bulk add members
 * @access  Academy admin
 */
router.post(
  '/academies/:academyId/members/bulk',
  requireAcademyMembership,
  requirePermission('members.add'),
  membershipController.bulkAddMembers
);

/**
 * @route   GET /api/v2/academies/:academyId/members/statistics
 * @desc    Get membership statistics
 * @access  Academy admin
 */
router.get(
  '/academies/:academyId/members/statistics',
  requireAcademyMembership,
  requirePermission('members.view.statistics'),
  membershipController.getStatistics
);

/**
 * @route   GET /api/v2/memberships/:id
 * @desc    Get membership by ID
 * @access  Authenticated users
 */
router.get(
  '/memberships/:id',
  membershipController.getMembership
);

/**
 * @route   DELETE /api/v2/memberships/:id
 * @desc    Remove member from academy
 * @access  Academy admin
 */
router.delete(
  '/memberships/:id',
  requirePermission('members.remove'),
  membershipController.removeMember
);

/**
 * @route   PUT /api/v2/memberships/:id/role
 * @desc    Update member role
 * @access  Academy admin
 */
router.put(
  '/memberships/:id/role',
  requirePermission('members.update.role'),
  membershipController.updateRole
);

/**
 * @route   PUT /api/v2/memberships/:id/department
 * @desc    Update member department
 * @access  Academy admin
 */
router.put(
  '/memberships/:id/department',
  requirePermission('members.update.department'),
  membershipController.updateDepartment
);

/**
 * @route   POST /api/v2/memberships/:id/permissions/:permissionName
 * @desc    Set custom permission
 * @access  Academy admin
 */
router.post(
  '/memberships/:id/permissions/:permissionName',
  requirePermission('members.permissions.update'),
  membershipController.setCustomPermission
);

/**
 * @route   POST /api/v2/memberships/:id/suspend
 * @desc    Suspend membership
 * @access  Academy admin
 */
router.post(
  '/memberships/:id/suspend',
  requirePermission('members.suspend'),
  membershipController.suspendMembership
);

/**
 * @route   POST /api/v2/memberships/:id/reactivate
 * @desc    Reactivate membership
 * @access  Academy admin
 */
router.post(
  '/memberships/:id/reactivate',
  requirePermission('members.reactivate'),
  membershipController.reactivateMembership
);

/**
 * @route   GET /api/v2/users/:userId/memberships
 * @desc    Get user's memberships
 * @access  Authenticated users (own memberships)
 */
router.get(
  '/users/:userId/memberships',
  membershipController.getUserMemberships
);

module.exports = router;
