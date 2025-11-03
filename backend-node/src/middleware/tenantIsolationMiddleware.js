const academyMembershipService = require('../services/academyMembershipService');

/**
 * Tenant Isolation Middleware
 * Ensures all academy-scoped operations respect tenant boundaries
 */

/**
 * Require academy membership
 * Ensures user is a member of the academy they're trying to access
 */
const requireAcademyMembership = async (req, res, next) => {
  try {
    const academyId = parseInt(req.params.academyId || req.body.academyId);
    const userId = req.user?.id;

    if (!academyId) {
      return res.status(400).json({
        type: 'https://glasscode/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'Academy ID is required',
        instance: req.originalUrl,
        traceId: req.correlationId,
      });
    }

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

    // Check if user is member of academy
    const isMember = await academyMembershipService.isUserMember(
      userId,
      academyId
    );

    if (!isMember) {
      return res.status(403).json({
        type: 'https://glasscode/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        detail: 'You are not a member of this academy',
        instance: req.originalUrl,
        traceId: req.correlationId,
      });
    }

    // Attach academy membership to request
    const membership =
      await academyMembershipService.getUserMembershipInAcademy(
        userId,
        academyId
      );
    req.academyMembership = membership;
    req.academyId = academyId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enforce academy scope on queries
 * Automatically filters queries to only include data from the user's academies
 */
const enforceAcademyScope = async (req, res, next) => {
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

    // Get user's academies
    const memberships = await academyMembershipService.getUserAcademies(userId);
    const academyIds = memberships.map((m) => m.academyId);

    // Attach academy IDs to request for query filtering
    req.userAcademyIds = academyIds;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate academy access for resource
 * Ensures the resource being accessed belongs to an academy the user has access to
 */
const validateAcademyAccess = (resourceAcademyIdGetter) => {
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

      // Get academy ID of the resource
      const resourceAcademyId = await resourceAcademyIdGetter(req);

      if (!resourceAcademyId) {
        return res.status(404).json({
          type: 'https://glasscode/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Resource not found',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      // Check if user is member of the resource's academy
      const isMember = await academyMembershipService.isUserMember(
        userId,
        resourceAcademyId
      );

      if (!isMember) {
        return res.status(403).json({
          type: 'https://glasscode/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'You do not have access to this resource',
          instance: req.originalUrl,
          traceId: req.correlationId,
        });
      }

      req.resourceAcademyId = resourceAcademyId;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require active membership status
 * Ensures user's membership in the academy is active
 */
const requireActiveMembership = async (req, res, next) => {
  try {
    if (!req.academyMembership) {
      return res.status(403).json({
        type: 'https://glasscode/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        detail: 'Academy membership required',
        instance: req.originalUrl,
        traceId: req.correlationId,
      });
    }

    if (req.academyMembership.status !== 'active') {
      return res.status(403).json({
        type: 'https://glasscode/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        detail: `Membership status is ${req.academyMembership.status}. Active membership required.`,
        instance: req.originalUrl,
        traceId: req.correlationId,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAcademyMembership,
  enforceAcademyScope,
  validateAcademyAccess,
  requireActiveMembership,
};
