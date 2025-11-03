/**
 * Content Workflow Routes (API v2)
 * 
 * RESTful routes for approval workflow management.
 * 
 * @module routes/v2/workflowRoutes
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../../controllers/v2/workflowController');
const authenticate = require('../../middleware/authMiddleware');
const { requireAcademyMembership } = require('../../middleware/tenantIsolationMiddleware');
const { requirePermission } = require('../../middleware/permissionCheckMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v2/academies/:academyId/workflows
 * @desc    Create workflow
 * @access  Academy admin
 */
router.post(
  '/academies/:academyId/workflows',
  requireAcademyMembership,
  requirePermission('workflows.create'),
  workflowController.createWorkflow
);

/**
 * @route   GET /api/v2/academies/:academyId/workflows
 * @desc    Get academy workflows
 * @access  Academy members
 */
router.get(
  '/academies/:academyId/workflows',
  requireAcademyMembership,
  workflowController.getAcademyWorkflows
);

/**
 * @route   GET /api/v2/academies/:academyId/approvals/statistics
 * @desc    Get approval statistics
 * @access  Academy admin
 */
router.get(
  '/academies/:academyId/approvals/statistics',
  requireAcademyMembership,
  requirePermission('workflows.view.statistics'),
  workflowController.getStatistics
);

/**
 * @route   GET /api/v2/workflows/:id
 * @desc    Get workflow by ID
 * @access  Authenticated users
 */
router.get(
  '/workflows/:id',
  workflowController.getWorkflow
);

/**
 * @route   PUT /api/v2/workflows/:id
 * @desc    Update workflow
 * @access  Academy admin
 */
router.put(
  '/workflows/:id',
  requirePermission('workflows.update'),
  workflowController.updateWorkflow
);

/**
 * @route   POST /api/v2/workflows/:id/deactivate
 * @desc    Deactivate workflow
 * @access  Academy admin
 */
router.post(
  '/workflows/:id/deactivate',
  requirePermission('workflows.deactivate'),
  workflowController.deactivateWorkflow
);

/**
 * @route   POST /api/v2/content/:contentType/:contentId/approvals
 * @desc    Submit content for approval
 * @access  Content editors
 */
router.post(
  '/content/:contentType/:contentId/approvals',
  requirePermission('content.submit.approval'),
  workflowController.submitForApproval
);

/**
 * @route   GET /api/v2/content/:contentType/:contentId/approvals
 * @desc    Get content approvals
 * @access  Content viewers
 */
router.get(
  '/content/:contentType/:contentId/approvals',
  requirePermission('content.approvals.view'),
  workflowController.getContentApprovals
);

/**
 * @route   GET /api/v2/approvals/:id
 * @desc    Get approval by ID
 * @access  Authenticated users
 */
router.get(
  '/approvals/:id',
  workflowController.getApproval
);

/**
 * @route   POST /api/v2/approvals/:id/approve
 * @desc    Approve content
 * @access  Reviewers
 */
router.post(
  '/approvals/:id/approve',
  requirePermission('content.approve'),
  workflowController.approveContent
);

/**
 * @route   POST /api/v2/approvals/:id/reject
 * @desc    Reject content
 * @access  Reviewers
 */
router.post(
  '/approvals/:id/reject',
  requirePermission('content.reject'),
  workflowController.rejectContent
);

/**
 * @route   POST /api/v2/approvals/:id/reassign
 * @desc    Reassign approval
 * @access  Academy admin
 */
router.post(
  '/approvals/:id/reassign',
  requirePermission('workflows.approvals.reassign'),
  workflowController.reassignApproval
);

/**
 * @route   GET /api/v2/users/:userId/approvals/pending
 * @desc    Get pending approvals for reviewer
 * @access  Authenticated users (own pending approvals)
 */
router.get(
  '/users/:userId/approvals/pending',
  workflowController.getPendingApprovals
);

module.exports = router;
