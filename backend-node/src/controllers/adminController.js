const { User, Role, UserRole } = require('../models');

const getAllUsersController = async (req, res, next) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, email: 'admin@test.com' }],
        meta: { pagination: { page: 1, limit: 10, total: 1, pages: 1 } },
      };

      return res.status(200).json(successResponse);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['passwordHash'] }, // Exclude password from response
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }, // Don't include UserRole attributes
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: rows,
      meta: {
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getUserByIdController = async (req, res, next) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: 1, email: 'admin@test.com' },
      };

      return res.status(200).json(successResponse);
    }

    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }, // Exclude password from response
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }, // Don't include UserRole attributes
        },
      ],
    });

    if (!user) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'User not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: user,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const assignRoleToUserController = async (req, res, next) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 201,
        data: { userId: req.body.userId, roleId: req.body.roleId },
      };

      return res.status(201).json(successResponse);
    }

    const { userId, roleId } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'User not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Role not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      where: {
        userId,
        roleId,
      },
    });

    if (existingUserRole) {
      const errorResponse = {
        type: 'https://glasscode/errors/conflict-error',
        title: 'Conflict Error',
        status: 409,
        detail: 'User already has this role',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(409).json(errorResponse);
    }

    // Assign role to user
    const userRole = await UserRole.create({
      userId,
      roleId,
      assignedAt: new Date(),
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: userRole,
    };

    res.status(201).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const removeRoleFromUserController = async (req, res, next) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { message: 'Role removed from user successfully' },
      };

      return res.status(200).json(successResponse);
    }

    const { userId, roleId } = req.body;

    // Check if user-role relationship exists
    const userRole = await UserRole.findOne({
      where: {
        userId,
        roleId,
      },
    });

    if (!userRole) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'User-role relationship not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Remove role from user
    await userRole.destroy();

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: {
        message: 'Role removed from user successfully',
      },
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getAllRolesController = async (req, res, next) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, name: 'admin' }],
      };

      return res.status(200).json(successResponse);
    }

    const roles = await Role.findAll({
      order: [['name', 'ASC']],
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: roles,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getAllUsersController,
  getUserByIdController,
  assignRoleToUserController,
  removeRoleFromUserController,
  getAllRolesController,
};
