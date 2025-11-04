const { User, Role } = require('../models');

/**
 * UserRoleService
 * Centralized helpers for fetching users and role information.
 */
async function getUserWithRoles(userId, options = {}) {
  const { attributes, throughAttributes = [] } = options;

  return User.findByPk(userId, {
    ...(attributes ? { attributes } : {}),
    include: [
      {
        model: Role,
        as: 'userRoles',
        through: { attributes: throughAttributes },
      },
    ],
  });
}

async function getUserRoleNames(userId) {
  const user = await getUserWithRoles(userId);
  if (!user || !user.userRoles) return [];
  return user.userRoles.map((r) => r.name);
}

module.exports = {
  getUserWithRoles,
  getUserRoleNames,
};
