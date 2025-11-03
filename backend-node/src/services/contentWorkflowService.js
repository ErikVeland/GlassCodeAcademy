/**
 * Content Workflow Service
 *
 * Manages approval workflows for content (courses, modules, lessons, quizzes).
 * Provides workflow creation, state transitions, approval routing, and audit trails.
 * Supports customizable multi-step approval processes per academy.
 *
 * @module services/contentWorkflowService
 */

const { Op } = require('sequelize');
const ContentWorkflow = require('../models/contentWorkflowModel');
const ContentApproval = require('../models/contentApprovalModel');
const ContentVersion = require('../models/contentVersionModel');
const User = require('../models/userModel');
const Academy = require('../models/academyModel');

/**
 * Content Workflow Service
 * Singleton service for managing content approval workflows
 */
class ContentWorkflowService {
  /**
   * Create a new workflow configuration
   *
   * @param {number} academyId - ID of the academy
   * @param {Object} workflowData - Workflow configuration
   * @param {string} workflowData.contentType - Type of content (course, module, lesson, quiz)
   * @param {string} workflowData.workflowName - Name of the workflow
   * @param {Object} workflowData.workflowDefinition - Workflow state machine definition
   * @param {boolean} workflowData.isActive - Whether workflow is active
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(academyId, workflowData) {
    const {
      contentType,
      workflowName,
      workflowDefinition,
      isActive = true,
    } = workflowData;

    // Validate workflow definition
    this.validateWorkflowDefinition(workflowDefinition);

    // Check for existing active workflow
    const existingWorkflow = await ContentWorkflow.findOne({
      where: {
        academyId,
        contentType,
        isActive: true,
      },
    });

    if (existingWorkflow) {
      throw new Error(
        `Active workflow already exists for ${contentType} in this academy`
      );
    }

    const workflow = await ContentWorkflow.create({
      academyId,
      contentType,
      workflowName,
      workflowDefinition,
      isActive,
    });

    return await this.getWorkflowById(workflow.id);
  }

  /**
   * Get workflow by ID
   *
   * @param {number} workflowId - ID of the workflow
   * @returns {Promise<Object|null>} Workflow with associations
   */
  async getWorkflowById(workflowId) {
    return await ContentWorkflow.findByPk(workflowId, {
      include: [{ model: Academy, as: 'academy', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Get active workflow for content type in academy
   *
   * @param {number} academyId - ID of the academy
   * @param {string} contentType - Type of content
   * @returns {Promise<Object|null>} Active workflow or null
   */
  async getActiveWorkflow(academyId, contentType) {
    return await ContentWorkflow.findOne({
      where: {
        academyId,
        contentType: contentType.toLowerCase(),
        isActive: true,
      },
      include: [{ model: Academy, as: 'academy', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Get all workflows for an academy
   *
   * @param {number} academyId - ID of the academy
   * @param {Object} options - Query options
   * @param {boolean} options.activeOnly - Return only active workflows
   * @returns {Promise<Array>} List of workflows
   */
  async getAcademyWorkflows(academyId, options = {}) {
    const { activeOnly = false } = options;

    const where = { academyId };
    if (activeOnly) {
      where.isActive = true;
    }

    return await ContentWorkflow.findAll({
      where,
      order: [['content_type', 'ASC']],
    });
  }

  /**
   * Update workflow configuration
   *
   * @param {number} workflowId - ID of the workflow
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(workflowId, updates) {
    const workflow = await ContentWorkflow.findByPk(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Validate workflow definition if being updated
    if (updates.workflowDefinition) {
      this.validateWorkflowDefinition(updates.workflowDefinition);
    }

    await workflow.update(updates);
    return await this.getWorkflowById(workflowId);
  }

  /**
   * Deactivate a workflow
   *
   * @param {number} workflowId - ID of the workflow
   * @returns {Promise<Object>} Updated workflow
   */
  async deactivateWorkflow(workflowId) {
    return await this.updateWorkflow(workflowId, { isActive: false });
  }

  /**
   * Submit content for approval
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {string} versionId - UUID of the version to approve
   * @param {number} requestedBy - ID of user submitting
   * @param {Object} options - Submission options
   * @param {number} options.assignedTo - ID of user to assign for review
   * @param {string} options.comments - Submission comments
   * @returns {Promise<Object>} Created approval request
   */
  async submitForApproval(
    contentType,
    contentId,
    versionId,
    requestedBy,
    options = {}
  ) {
    const { assignedTo, comments } = options;

    // Get the version to verify it exists
    const version = await ContentVersion.findByPk(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Get the active workflow for this content type
    const workflow = await this.getActiveWorkflow(
      version.academyId,
      contentType
    );
    if (!workflow) {
      throw new Error(`No active workflow found for ${contentType}`);
    }

    // Get the initial state from workflow definition
    const initialState =
      workflow.workflowDefinition.initialState || 'submitted';

    // Check if there's already a pending approval for this version
    const existingApproval = await ContentApproval.findOne({
      where: {
        versionId,
        status: 'pending',
      },
    });

    if (existingApproval) {
      throw new Error('This version already has a pending approval request');
    }

    // Create the approval request
    const approval = await ContentApproval.create({
      contentType: contentType.toLowerCase(),
      contentId,
      versionId,
      workflowState: initialState,
      requestedBy,
      assignedTo: assignedTo || null,
      status: 'pending',
      comments: comments || null,
    });

    return await this.getApprovalById(approval.id);
  }

  /**
   * Get approval request by ID
   *
   * @param {number} approvalId - ID of the approval
   * @returns {Promise<Object|null>} Approval with associations
   */
  async getApprovalById(approvalId) {
    return await ContentApproval.findByPk(approvalId, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: ContentVersion,
          as: 'version',
          attributes: ['id', 'versionNumber', 'status', 'changeSummary'],
        },
      ],
    });
  }

  /**
   * Get approval requests for content
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @returns {Promise<Array>} List of approval requests
   */
  async getContentApprovals(contentType, contentId, options = {}) {
    const { status } = options;

    const where = {
      contentType: contentType.toLowerCase(),
      contentId,
    };

    if (status) {
      where.status = status;
    }

    return await ContentApproval.findAll({
      where,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: ContentVersion,
          as: 'version',
          attributes: ['id', 'versionNumber', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get pending approvals for a reviewer
   *
   * @param {number} reviewerId - ID of the reviewer
   * @param {Object} options - Query options
   * @param {number} options.academyId - Filter by academy
   * @param {number} options.limit - Maximum results
   * @param {number} options.offset - Results offset
   * @returns {Promise<Object>} Pending approvals with pagination
   */
  async getPendingApprovals(reviewerId, options = {}) {
    const { academyId, limit = 20, offset = 0 } = options;

    const where = {
      assignedTo: reviewerId,
      status: 'pending',
    };

    const include = [
      { model: User, as: 'requester', attributes: ['id', 'username', 'email'] },
      {
        model: ContentVersion,
        as: 'version',
        attributes: [
          'id',
          'versionNumber',
          'status',
          'changeSummary',
          'academyId',
        ],
      },
    ];

    // Filter by academy if specified
    if (academyId) {
      include[1].where = { academyId };
    }

    const { rows: approvals, count: total } =
      await ContentApproval.findAndCountAll({
        where,
        include,
        order: [['created_at', 'ASC']],
        limit,
        offset,
      });

    return {
      approvals,
      total,
      limit,
      offset,
      hasMore: offset + approvals.length < total,
    };
  }

  /**
   * Approve content
   *
   * @param {number} approvalId - ID of the approval
   * @param {number} reviewerId - ID of the reviewer
   * @param {Object} options - Approval options
   * @param {string} options.comments - Approval comments
   * @param {boolean} options.publishImmediately - Publish the version after approval
   * @returns {Promise<Object>} Updated approval
   */
  async approveContent(approvalId, reviewerId, options = {}) {
    const { comments, publishImmediately = false } = options;

    const approval = await this.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error('This approval request is not pending');
    }

    if (approval.assignedTo && approval.assignedTo !== reviewerId) {
      throw new Error('You are not assigned to review this content');
    }

    const transaction = await ContentApproval.sequelize.transaction();

    try {
      // Update approval status
      await approval.update(
        {
          status: 'approved',
          assignedTo: reviewerId,
          comments: comments || approval.comments,
          approvedAt: new Date(),
        },
        { transaction }
      );

      // Update version status if publishing immediately
      if (publishImmediately) {
        const version = await ContentVersion.findByPk(approval.versionId, {
          transaction,
        });
        if (version) {
          await version.update({ status: 'published' }, { transaction });
        }
      }

      await transaction.commit();

      return await this.getApprovalById(approvalId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reject content
   *
   * @param {number} approvalId - ID of the approval
   * @param {number} reviewerId - ID of the reviewer
   * @param {string} comments - Rejection comments (required)
   * @returns {Promise<Object>} Updated approval
   */
  async rejectContent(approvalId, reviewerId, comments) {
    if (!comments || comments.trim() === '') {
      throw new Error('Rejection comments are required');
    }

    const approval = await this.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error('This approval request is not pending');
    }

    if (approval.assignedTo && approval.assignedTo !== reviewerId) {
      throw new Error('You are not assigned to review this content');
    }

    await approval.update({
      status: 'rejected',
      assignedTo: reviewerId,
      comments,
      approvedAt: new Date(),
    });

    return await this.getApprovalById(approvalId);
  }

  /**
   * Reassign approval to another reviewer
   *
   * @param {number} approvalId - ID of the approval
   * @param {number} newReviewerId - ID of the new reviewer
   * @returns {Promise<Object>} Updated approval
   */
  async reassignApproval(approvalId, newReviewerId) {
    const approval = await ContentApproval.findByPk(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error('Can only reassign pending approvals');
    }

    // Verify new reviewer exists
    const reviewer = await User.findByPk(newReviewerId);
    if (!reviewer) {
      throw new Error(`Reviewer ${newReviewerId} not found`);
    }

    await approval.update({ assignedTo: newReviewerId });
    return await this.getApprovalById(approvalId);
  }

  /**
   * Get approval statistics for academy
   *
   * @param {number} academyId - ID of the academy
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for statistics
   * @param {Date} options.endDate - End date for statistics
   * @returns {Promise<Object>} Approval statistics
   */
  async getApprovalStatistics(academyId, options = {}) {
    const { startDate, endDate } = options;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const approvals = await ContentApproval.findAll({
      where,
      include: [
        {
          model: ContentVersion,
          as: 'version',
          where: { academyId },
          attributes: ['id'],
        },
      ],
      attributes: ['status', 'contentType'],
    });

    const statistics = {
      total: approvals.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      byContentType: {},
    };

    approvals.forEach((approval) => {
      statistics[approval.status]++;

      if (!statistics.byContentType[approval.contentType]) {
        statistics.byContentType[approval.contentType] = {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        };
      }

      statistics.byContentType[approval.contentType].total++;
      statistics.byContentType[approval.contentType][approval.status]++;
    });

    return statistics;
  }

  /**
   * Validate workflow definition structure
   *
   * @param {Object} definition - Workflow definition to validate
   * @throws {Error} If workflow definition is invalid
   * @private
   */
  validateWorkflowDefinition(definition) {
    if (!definition || typeof definition !== 'object') {
      throw new Error('Workflow definition must be an object');
    }

    if (!definition.initialState) {
      throw new Error('Workflow definition must have an initialState');
    }

    if (!definition.states || !Array.isArray(definition.states)) {
      throw new Error('Workflow definition must have a states array');
    }

    if (!definition.states.includes(definition.initialState)) {
      throw new Error('Initial state must be in the states array');
    }

    if (!definition.transitions || !Array.isArray(definition.transitions)) {
      throw new Error('Workflow definition must have a transitions array');
    }

    // Validate each transition
    definition.transitions.forEach((transition, index) => {
      if (!transition.from || !transition.to) {
        throw new Error(`Transition ${index} must have 'from' and 'to' states`);
      }

      if (!definition.states.includes(transition.from)) {
        throw new Error(
          `Transition ${index}: 'from' state not in states array`
        );
      }

      if (!definition.states.includes(transition.to)) {
        throw new Error(`Transition ${index}: 'to' state not in states array`);
      }
    });

    return true;
  }
}

// Export singleton instance
module.exports = new ContentWorkflowService();
