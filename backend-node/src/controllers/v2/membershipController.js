/**
 * Academy Membership Controller (API v2)
 * 
 * HTTP handlers for academy membership management endpoints.
 * 
 * @module controllers/v2/membershipController
 */

const membershipService = require('../../services/academyMembershipService');

/**
 * Add member to academy
 * POST /api/v2/academies/:academyId/members
 */
exports.addMember = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const membershipData = {
      ...req.body,
      academyId,
    };

    const membership = await membershipService.addMember(membershipData);

    res.status(201).json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error adding member:', error);
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
 * Get academy members
 * GET /api/v2/academies/:academyId/members
 */
exports.getAcademyMembers = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status,
      roleId: req.query.roleId ? parseInt(req.query.roleId) : undefined,
      departmentId: req.query.departmentId ? parseInt(req.query.departmentId) : undefined,
    };

    const result = await membershipService.getAcademyMembers(academyId, options);

    res.json({
      success: true,
      data: result.members,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error getting members:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get membership by ID
 * GET /api/v2/memberships/:id
 */
exports.getMembership = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);

    const membership = await membershipService.getMembershipById(membershipId);

    if (!membership) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Membership with ID ${membershipId} not found`,
      });
    }

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error getting membership:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Remove member from academy
 * DELETE /api/v2/memberships/:id
 */
exports.removeMember = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);

    await membershipService.removeMember(membershipId);

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
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
 * Update member role
 * PUT /api/v2/memberships/:id/role
 */
exports.updateRole = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'roleId is required',
      });
    }

    const membership = await membershipService.updateMemberRole(membershipId, roleId);

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error updating role:', error);
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
 * Update member department
 * PUT /api/v2/memberships/:id/department
 */
exports.updateDepartment = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);
    const { departmentId } = req.body;

    const membership = await membershipService.updateMemberDepartment(
      membershipId,
      departmentId
    );

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error updating department:', error);
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
 * Set custom permission
 * POST /api/v2/memberships/:id/permissions/:permissionName
 */
exports.setCustomPermission = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);
    const { permissionName } = req.params;
    const { allowed } = req.body;

    if (typeof allowed !== 'boolean') {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'allowed field must be a boolean',
      });
    }

    const membership = await membershipService.setCustomPermission(
      membershipId,
      permissionName,
      allowed
    );

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error setting permission:', error);
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
 * Suspend membership
 * POST /api/v2/memberships/:id/suspend
 */
exports.suspendMembership = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);

    const membership = await membershipService.suspendMembership(membershipId);

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error suspending membership:', error);
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
 * Reactivate membership
 * POST /api/v2/memberships/:id/reactivate
 */
exports.reactivateMembership = async (req, res) => {
  try {
    const membershipId = parseInt(req.params.id);

    const membership = await membershipService.reactivateMembership(membershipId);

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error reactivating membership:', error);
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
 * Get user's memberships
 * GET /api/v2/users/:userId/memberships
 */
exports.getUserMemberships = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const memberships = await membershipService.getUserMemberships(userId);

    res.json({
      success: true,
      data: memberships,
    });
  } catch (error) {
    console.error('Error getting user memberships:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get membership statistics
 * GET /api/v2/academies/:academyId/members/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);

    const statistics = await membershipService.getMembershipStatistics(academyId);

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
 * Bulk add members
 * POST /api/v2/academies/:academyId/members/bulk
 */
exports.bulkAddMembers = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const { members } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'members must be an array',
      });
    }

    const result = await membershipService.bulkAddMembers(academyId, members);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error bulk adding members:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};
