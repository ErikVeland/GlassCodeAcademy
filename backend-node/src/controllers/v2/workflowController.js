/**
 * Content Workflow Controller (API v2)
 * 
 * HTTP handlers for approval workflow endpoints.
 * 
 * @module controllers/v2/workflowController
 */

const workflowService = require('../../services/contentWorkflowService');

/**
 * Create workflow
 * POST /api/v2/academies/:academyId/workflows
 */
exports.createWorkflow = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const workflowData = req.body;

    const workflow = await workflowService.createWorkflow(academyId, workflowData);

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    const status = error.message.includes('already exists') ? 409 : 400;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 409 ? 'conflict' : 'bad-request'}`,
      title: status === 409 ? 'Conflict' : 'Bad Request',
      status,
      detail: error.message,
    });
  }
};

/**
 * Get workflow by ID
 * GET /api/v2/workflows/:id
 */
exports.getWorkflow = async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);

    const workflow = await workflowService.getWorkflowById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Workflow ${workflowId} not found`,
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get academy workflows
 * GET /api/v2/academies/:academyId/workflows
 */
exports.getAcademyWorkflows = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const options = {
      activeOnly: req.query.activeOnly !== 'false',
    };

    const workflows = await workflowService.getAcademyWorkflows(academyId, options);

    res.json({
      success: true,
      data: workflows,
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Update workflow
 * PUT /api/v2/workflows/:id
 */
exports.updateWorkflow = async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const updates = req.body;

    const workflow = await workflowService.updateWorkflow(workflowId, updates);

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
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
 * Deactivate workflow
 * POST /api/v2/workflows/:id/deactivate
 */
exports.deactivateWorkflow = async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);

    const workflow = await workflowService.deactivateWorkflow(workflowId);

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error deactivating workflow:', error);
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
 * Submit content for approval
 * POST /api/v2/content/:contentType/:contentId/approvals
 */
exports.submitForApproval = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { versionId, assignedTo, comments } = req.body;
    const requestedBy = req.user?.id;

    if (!versionId) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'versionId is required',
      });
    }

    const approval = await workflowService.submitForApproval(
      contentType,
      parseInt(contentId),
      versionId,
      requestedBy,
      { assignedTo, comments }
    );

    res.status(201).json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error('Error submitting for approval:', error);
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('already has') ? 409 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : status === 409 ? 'conflict' : 'internal-error'}`,
      title: status === 404 ? 'Not Found' : status === 409 ? 'Conflict' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Get approval by ID
 * GET /api/v2/approvals/:id
 */
exports.getApproval = async (req, res) => {
  try {
    const approvalId = parseInt(req.params.id);

    const approval = await workflowService.getApprovalById(approvalId);

    if (!approval) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Approval ${approvalId} not found`,
      });
    }

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error('Error getting approval:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get content approvals
 * GET /api/v2/content/:contentType/:contentId/approvals
 */
exports.getContentApprovals = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const options = {
      status: req.query.status,
    };

    const approvals = await workflowService.getContentApprovals(
      contentType,
      parseInt(contentId),
      options
    );

    res.json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    console.error('Error getting approvals:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get pending approvals for reviewer
 * GET /api/v2/users/:userId/approvals/pending
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    const reviewerId = parseInt(req.params.userId);
    const options = {
      academyId: req.query.academyId ? parseInt(req.query.academyId) : undefined,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await workflowService.getPendingApprovals(reviewerId, options);

    res.json({
      success: true,
      data: result.approvals,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Approve content
 * POST /api/v2/approvals/:id/approve
 */
exports.approveContent = async (req, res) => {
  try {
    const approvalId = parseInt(req.params.id);
    const reviewerId = req.user?.id;
    const { comments, publishImmediately } = req.body;

    const approval = await workflowService.approveContent(approvalId, reviewerId, {
      comments,
      publishImmediately,
    });

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error('Error approving content:', error);
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('not pending') || error.message.includes('not assigned') ? 403 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : status === 403 ? 'forbidden' : 'internal-error'}`,
      title: status === 404 ? 'Not Found' : status === 403 ? 'Forbidden' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Reject content
 * POST /api/v2/approvals/:id/reject
 */
exports.rejectContent = async (req, res) => {
  try {
    const approvalId = parseInt(req.params.id);
    const reviewerId = req.user?.id;
    const { comments } = req.body;

    if (!comments) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'Rejection comments are required',
      });
    }

    const approval = await workflowService.rejectContent(approvalId, reviewerId, comments);

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error('Error rejecting content:', error);
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('not pending') || error.message.includes('not assigned') ? 403 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 404 ? 'not-found' : status === 403 ? 'forbidden' : 'internal-error'}`,
      title: status === 404 ? 'Not Found' : status === 403 ? 'Forbidden' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Reassign approval
 * POST /api/v2/approvals/:id/reassign
 */
exports.reassignApproval = async (req, res) => {
  try {
    const approvalId = parseInt(req.params.id);
    const { newReviewerId } = req.body;

    if (!newReviewerId) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'newReviewerId is required',
      });
    }

    const approval = await workflowService.reassignApproval(approvalId, newReviewerId);

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error('Error reassigning approval:', error);
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
 * Get approval statistics
 * GET /api/v2/academies/:academyId/approvals/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const options = {};

    if (req.query.startDate) {
      options.startDate = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      options.endDate = new Date(req.query.endDate);
    }

    const statistics = await workflowService.getApprovalStatistics(academyId, options);

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
