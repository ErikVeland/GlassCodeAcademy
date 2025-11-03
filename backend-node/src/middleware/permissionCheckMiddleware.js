const permissionResolutionService = require('../services/permissionResolutionService');

/**
 * Permission Check Middleware
 * Verifies user has required permissions for operations
 */

/**
 * Require specific permission
 * @param {string} permissionName - Permission name (e.g., 'content.create')
 * @param {Object} options - Additional options
 */
const requirePermission = (permissionName, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          type: 'https://glasscode/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'User authentication required',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      const context = {
        academyId: req.academyId || req.params.academyId,
        departmentId: req.academyMembership?.departmentId,
        resourceId: req.params.id,
        ...options.context,
      };

      const hasPermission = await permissionResolutionService.hasPermission(
        userId,
        permissionName,
        context
      );

      if (!hasPermission) {
        return res.status(403).json({
          type: 'https://glasscode/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: `Permission '${permissionName}' required for this operation`,
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require any of multiple permissions
 * @param {Array<string>} permissionNames - Array of permission names
 * @param {Object} options - Additional options
 */
const requireAnyPermission = (permissionNames, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          type: 'https://glasscode/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'User authentication required',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      const context = {
        academyId: req.academyId || req.params.academyId,
        departmentId: req.academyMembership?.departmentId,
        resourceId: req.params.id,
        ...options.context,
      };

      const permissions = await permissionResolutionService.checkMultiplePermissions(
        userId,
        permissionNames,
        context
      );

      const hasAnyPermission = Object.values(permissions).some(hasIt => hasIt);

      if (!hasAnyPermission) {
        return res.status(403).json({
          type: 'https://glasscode/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: `One of the following permissions required: ${permissionNames.join(', ')}`,
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require all of multiple permissions
 * @param {Array<string>} permissionNames - Array of permission names
 * @param {Object} options - Additional options
 */
const requireAllPermissions = (permissionNames, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          type: 'https://glasscode/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'User authentication required',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      const context = {
        academyId: req.academyId || req.params.academyId,
        departmentId: req.academyMembership?.departmentId,
        resourceId: req.params.id,
        ...options.context,
      };

      const permissions = await permissionResolutionService.checkMultiplePermissions(
        userId,
        permissionNames,
        context
      );

      const missingPermissions = permissionNames.filter(perm => !permissions[perm]);

      if (missingPermissions.length > 0) {
        return res.status(403).json({
          type: 'https://glasscode/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: `Missing required permissions: ${missingPermissions.join(', ')}`,
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require specific role in academy
 * @param {string|Array<string>} roleNames - Role name(s)
 */
const requireRole = (roleNames) => {
  const roles = Array.isArray(roleNames) ? roleNames : [roleNames];

  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const academyId = req.academyId || req.params.academyId;

      if (!userId) {
        return res.status(401).json({
          type: 'https://glasscode/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'User authentication required',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      if (!academyId) {
        return res.status(400).json({
          type: 'https://glasscode/errors/bad-request',
          title: 'Bad Request',
          status: 400,
          detail: 'Academy context required',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      // Check if user has any of the required roles
      const hasRole = await Promise.all(
        roles.map(role => permissionResolutionService.hasRole(userId, academyId, role))
      );

      if (!hasRole.some(Boolean)) {
        return res.status(403).json({
          type: 'https://glasscode/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: `One of the following roles required: ${roles.join(', ')}`,
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Attach user permissions to request
 * Makes permissions available on req.userPermissions
 */
const attachUserPermissions = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      req.userPermissions = [];
      return next();
    }

    const academyId = req.academyId || req.params.academyId;
    const permissions = await permissionResolutionService.getUserPermissions(userId, academyId);

    req.userPermissions = permissions;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  attachUserPermissions,
};
