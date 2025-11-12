/**
 * Department Controller (API v2)
 * 
 * HTTP handlers for department management endpoints.
 * 
 * @module controllers/v2/departmentController
 */

const departmentService = require('../../services/departmentService');

/**
 * Create department
 * POST /api/v2/academies/:academyId/departments
 */
exports.createDepartment = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const departmentData = {
      ...req.body,
      academyId,
    };

    const department = await departmentService.createDepartment(departmentData);

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    const status = error.message.includes('circular') ? 409 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 409 ? 'conflict' : 'internal-error'}`,
      title: status === 409 ? 'Conflict' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Get department by ID
 * GET /api/v2/departments/:id
 */
exports.getDepartment = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);

    const department = await departmentService.getDepartmentById(departmentId);

    if (!department) {
      return res.status(404).json({
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Department with ID ${departmentId} not found`,
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error getting department:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get academy departments
 * GET /api/v2/academies/:academyId/departments
 */
exports.getAcademyDepartments = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const options = {
      parentId: req.query.parentId ? parseInt(req.query.parentId) : undefined,
      includeInactive: req.query.includeInactive === 'true',
    };

    const departments = await departmentService.getAcademyDepartments(academyId, options);

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get department tree
 * GET /api/v2/academies/:academyId/departments/tree
 */
exports.getDepartmentTree = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const rootDepartmentId = req.query.rootId ? parseInt(req.query.rootId) : null;

    const tree = await departmentService.getDepartmentTree(academyId, rootDepartmentId);

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error('Error getting department tree:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get department path (ancestors)
 * GET /api/v2/departments/:id/path
 */
exports.getDepartmentPath = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);

    const path = await departmentService.getDepartmentPath(departmentId);

    res.json({
      success: true,
      data: path,
    });
  } catch (error) {
    console.error('Error getting department path:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get child departments
 * GET /api/v2/departments/:id/children
 */
exports.getChildren = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const options = {
      includeInactive: req.query.includeInactive === 'true',
      recursive: req.query.recursive === 'true',
    };

    const children = await departmentService.getChildDepartments(departmentId, options);

    res.json({
      success: true,
      data: children,
    });
  } catch (error) {
    console.error('Error getting child departments:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Update department
 * PUT /api/v2/departments/:id
 */
exports.updateDepartment = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'No update data provided',
      });
    }

    const department = await departmentService.updateDepartment(departmentId, updates);

    res.json({
      success: true,
      data: department,
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
 * Move department in hierarchy
 * POST /api/v2/departments/:id/move
 */
exports.moveDepartment = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const { newParentId } = req.body;

    const department = await departmentService.moveDepartment(
      departmentId,
      newParentId || null
    );

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error moving department:', error);
    const status = error.message.includes('circular') ? 409 : 
      error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      type: `https://glasscode/errors/${status === 409 ? 'conflict' : status === 404 ? 'not-found' : 'internal-error'}`,
      title: status === 409 ? 'Conflict' : status === 404 ? 'Not Found' : 'Internal Server Error',
      status,
      detail: error.message,
    });
  }
};

/**
 * Delete department
 * DELETE /api/v2/departments/:id
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);

    await departmentService.deleteDepartment(departmentId);

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
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
 * Get department members
 * GET /api/v2/departments/:id/members
 */
exports.getDepartmentMembers = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);

    const members = await departmentService.getDepartmentMembers(departmentId);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error getting department members:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get department member count
 * GET /api/v2/departments/:id/members/count
 */
exports.getMemberCount = async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const includeDescendants = req.query.includeDescendants === 'true';

    const count = await departmentService.getDepartmentMemberCount(
      departmentId,
      includeDescendants
    );

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error getting member count:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};

/**
 * Get department statistics
 * GET /api/v2/academies/:academyId/departments/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);

    const statistics = await departmentService.getDepartmentStatistics(academyId);

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
 * Bulk create departments
 * POST /api/v2/academies/:academyId/departments/bulk
 */
exports.bulkCreateDepartments = async (req, res) => {
  try {
    const academyId = parseInt(req.params.academyId);
    const { departments } = req.body;

    if (!Array.isArray(departments)) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'departments must be an array',
      });
    }

    const result = await departmentService.bulkCreateDepartments(academyId, departments);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error bulk creating departments:', error);
    res.status(500).json({
      type: 'https://glasscode/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
    });
  }
};
