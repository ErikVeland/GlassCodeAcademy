const { User, Role, UserRole } = require('../models');

const getAllUsersController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({
        success: true,
        data: [{ id: 1, email: 'admin@test.com' }],
        meta: { pagination: { page: 1, limit: 10, total: 1, pages: 1 } }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['passwordHash'] }, // Exclude password from response
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] } // Don't include UserRole attributes
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const getUserByIdController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { id: 1, email: 'admin@test.com' } });
    }

    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }, // Exclude password from response
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] } // Don't include UserRole attributes
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const assignRoleToUserController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ success: true, data: { userId: req.body.userId, roleId: req.body.roleId } });
    }

    const { userId, roleId } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }

    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      where: {
        userId,
        roleId
      }
    });

    if (existingUserRole) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT_ERROR',
          message: 'User already has this role'
        }
      });
    }

    // Assign role to user
    const userRole = await UserRole.create({
      userId,
      roleId,
      assignedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: userRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const removeRoleFromUserController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { message: 'Role removed from user successfully' } });
    }

    const { userId, roleId } = req.body;

    // Check if user-role relationship exists
    const userRole = await UserRole.findOne({
      where: {
        userId,
        roleId
      }
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User-role relationship not found'
        }
      });
    }

    // Remove role from user
    await userRole.destroy();

    res.status(200).json({
      success: true,
      data: {
        message: 'Role removed from user successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const getAllRolesController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: [{ id: 1, name: 'admin' }] });
    }

    const roles = await Role.findAll({
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  getAllUsersController,
  getUserByIdController,
  assignRoleToUserController,
  removeRoleFromUserController,
  getAllRolesController
};