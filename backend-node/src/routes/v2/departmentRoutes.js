/**
 * Department Routes (API v2)
 * 
 * RESTful routes for department management.
 * 
 * @module routes/v2/departmentRoutes
 */

const express = require('express');
const router = express.Router();
const departmentController = require('../../controllers/v2/departmentController');
const authenticate = require('../../middleware/authMiddleware');
const { requireAcademyMembership } = require('../../middleware/tenantIsolationMiddleware');
const { requirePermission } = require('../../middleware/permissionCheckMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v2/academies/:academyId/departments
 * @desc    Create department
 * @access  Academy admin
 */
router.post(
  '/academies/:academyId/departments',
  requireAcademyMembership,
  requirePermission('departments.create'),
  departmentController.createDepartment
);

/**
 * @route   GET /api/v2/academies/:academyId/departments
 * @desc    Get academy departments
 * @access  Academy members
 */
router.get(
  '/academies/:academyId/departments',
  requireAcademyMembership,
  departmentController.getAcademyDepartments
);

/**
 * @route   GET /api/v2/academies/:academyId/departments/tree
 * @desc    Get department tree structure
 * @access  Academy members
 */
router.get(
  '/academies/:academyId/departments/tree',
  requireAcademyMembership,
  departmentController.getDepartmentTree
);

/**
 * @route   POST /api/v2/academies/:academyId/departments/bulk
 * @desc    Bulk create departments
 * @access  Academy admin
 */
router.post(
  '/academies/:academyId/departments/bulk',
  requireAcademyMembership,
  requirePermission('departments.create'),
  departmentController.bulkCreateDepartments
);

/**
 * @route   GET /api/v2/academies/:academyId/departments/statistics
 * @desc    Get department statistics
 * @access  Academy admin
 */
router.get(
  '/academies/:academyId/departments/statistics',
  requireAcademyMembership,
  requirePermission('departments.view.statistics'),
  departmentController.getStatistics
);

/**
 * @route   GET /api/v2/departments/:id
 * @desc    Get department by ID
 * @access  Academy members
 */
router.get(
  '/departments/:id',
  departmentController.getDepartment
);

/**
 * @route   PUT /api/v2/departments/:id
 * @desc    Update department
 * @access  Academy admin
 */
router.put(
  '/departments/:id',
  requirePermission('departments.update'),
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/v2/departments/:id
 * @desc    Delete department
 * @access  Academy admin
 */
router.delete(
  '/departments/:id',
  requirePermission('departments.delete'),
  departmentController.deleteDepartment
);

/**
 * @route   GET /api/v2/departments/:id/path
 * @desc    Get department path (ancestors)
 * @access  Academy members
 */
router.get(
  '/departments/:id/path',
  departmentController.getDepartmentPath
);

/**
 * @route   GET /api/v2/departments/:id/children
 * @desc    Get child departments
 * @access  Academy members
 */
router.get(
  '/departments/:id/children',
  departmentController.getChildren
);

/**
 * @route   POST /api/v2/departments/:id/move
 * @desc    Move department in hierarchy
 * @access  Academy admin
 */
router.post(
  '/departments/:id/move',
  requirePermission('departments.move'),
  departmentController.moveDepartment
);

/**
 * @route   GET /api/v2/departments/:id/members
 * @desc    Get department members
 * @access  Academy members
 */
router.get(
  '/departments/:id/members',
  departmentController.getDepartmentMembers
);

/**
 * @route   GET /api/v2/departments/:id/members/count
 * @desc    Get department member count
 * @access  Academy members
 */
router.get(
  '/departments/:id/members/count',
  departmentController.getMemberCount
);

module.exports = router;
