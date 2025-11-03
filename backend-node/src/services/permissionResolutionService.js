const { Permission, Role, RolePermission, AcademyMembership } = require('../models');
const { Op } = require('sequelize');

/**
 * Permission Resolution Service
 * Handles hierarchical permission checking across system, academy, department, and user levels
 */
class PermissionResolutionService {
  /**
   * Check if user has permission
   * @param {number} userId - User ID
   * @param {string} permissionName - Permission name (e.g., 'content.create')
   * @param {Object} context - Context for permission check
   * @returns {Promise<boolean>} Has permission
   */
  async hasPermission(userId, permissionName, context = {}) {
    const { academyId = null } = context;

    // Get user's effective permissions
    const permissions = await this.getUserPermissions(userId, academyId);

    // Check if user has the specific permission
    const hasPermission = permissions.some(perm => {
      if (perm.name !== permissionName) {
        return false;
      }

      // If permission has academy scope, verify it matches
      if (perm.academyId && perm.academyId !== academyId) {
        return false;
      }

      // Additional scope checks can be added here
      return true;
    });

    return hasPermission;
  }

  /**
   * Get all effective permissions for a user
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID (optional)
   * @returns {Promise<Array>} User's effective permissions
   */
  async getUserPermissions(userId, academyId = null) {
    const where = { userId };
    if (academyId) {
      where.academyId = academyId;
    }

    // Get user's academy memberships
    const memberships = await AcademyMembership.findAll({
      where,
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: {
                model: RolePermission,
                as: 'rolePermissions',
              },
            },
          ],
        },
      ],
    });

    const allPermissions = [];

    for (const membership of memberships) {
      if (!membership.role) continue;

      // Add role-based permissions
      const rolePermissions = membership.role.permissions || [];
      for (const permission of rolePermissions) {
        allPermissions.push({
          id: permission.id,
          name: permission.name,
          resourceType: permission.resourceType,
          action: permission.action,
          source: 'role',
          roleId: membership.roleId,
          academyId: membership.academyId,
        });
      }

      // Add custom permissions from membership
      if (membership.customPermissions && Object.keys(membership.customPermissions).length > 0) {
        for (const [permName, allowed] of Object.entries(membership.customPermissions)) {
          if (allowed) {
            allPermissions.push({
              name: permName,
              source: 'custom',
              academyId: membership.academyId,
            });
          }
        }
      }
    }

    // Remove duplicates
    const uniquePermissions = this.deduplicatePermissions(allPermissions);

    return uniquePermissions;
  }

  /**
   * Get user's roles in academy
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @returns {Promise<Array>} User's roles
   */
  async getUserRolesInAcademy(userId, academyId) {
    const memberships = await AcademyMembership.findAll({
      where: { userId, academyId },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
      ],
    });

    return memberships.map(m => m.role).filter(Boolean);
  }

  /**
   * Check if user has role in academy
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} Has role
   */
  async hasRole(userId, academyId, roleName) {
    const roles = await this.getUserRolesInAcademy(userId, academyId);
    return roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());
  }

  /**
   * Grant custom permission to user in academy
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @param {string} permissionName - Permission name
   * @returns {Promise<Object>} Updated membership
   */
  async grantCustomPermission(userId, academyId, permissionName) {
    const membership = await AcademyMembership.findOne({
      where: { userId, academyId },
    });

    if (!membership) {
      throw new Error(`User ${userId} is not a member of academy ${academyId}`);
    }

    const customPermissions = membership.customPermissions || {};
    customPermissions[permissionName] = true;

    await membership.update({ customPermissions });

    return membership;
  }

  /**
   * Revoke custom permission from user in academy
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @param {string} permissionName - Permission name
   * @returns {Promise<Object>} Updated membership
   */
  async revokeCustomPermission(userId, academyId, permissionName) {
    const membership = await AcademyMembership.findOne({
      where: { userId, academyId },
    });

    if (!membership) {
      throw new Error(`User ${userId} is not a member of academy ${academyId}`);
    }

    const customPermissions = membership.customPermissions || {};
    delete customPermissions[permissionName];

    await membership.update({ customPermissions });

    return membership;
  }

  /**
   * Get all permissions in system
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Permissions
   */
  async getAllPermissions(filters = {}) {
    const where = {};

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    const permissions = await Permission.findAll({
      where,
      order: [['resourceType', 'ASC'], ['action', 'ASC']],
    });

    return permissions;
  }

  /**
   * Create new permission
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} Created permission
   */
  async createPermission(permissionData) {
    const { name, resourceType, action, description, isSystem = false } = permissionData;

    // Check if permission already exists
    const existing = await Permission.findOne({ where: { name } });
    if (existing) {
      throw new Error(`Permission '${name}' already exists`);
    }

    const permission = await Permission.create({
      name,
      resourceType,
      action,
      description: description || null,
      isSystem,
    });

    return permission;
  }

  /**
   * Delete permission
   * @param {number} permissionId - Permission ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePermission(permissionId) {
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      throw new Error(`Permission with ID ${permissionId} not found`);
    }

    if (permission.isSystem) {
      throw new Error('Cannot delete system permission');
    }

    await permission.destroy();

    return true;
  }

  /**
   * Assign permission to role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @param {number} academyId - Academy ID (null for global)
   * @returns {Promise<Object>} Created role permission
   */
  async assignPermissionToRole(roleId, permissionId, academyId = null) {
    // Check if already assigned
    const existing = await RolePermission.findOne({
      where: { roleId, permissionId, academyId },
    });

    if (existing) {
      return existing;
    }

    const rolePermission = await RolePermission.create({
      roleId,
      permissionId,
      academyId,
      scope: {},
    });

    return rolePermission;
  }

  /**
   * Remove permission from role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @param {number} academyId - Academy ID
   * @returns {Promise<boolean>} Success status
   */
  async removePermissionFromRole(roleId, permissionId, academyId = null) {
    const where = { roleId, permissionId };
    
    if (academyId !== null) {
      where.academyId = academyId;
    }

    const deleted = await RolePermission.destroy({ where });

    return deleted > 0;
  }

  /**
   * Get role's permissions
   * @param {number} roleId - Role ID
   * @param {number} academyId - Academy ID (optional)
   * @returns {Promise<Array>} Role's permissions
   */
  async getRolePermissions(roleId, academyId = null) {
    const where = { roleId };

    if (academyId !== null) {
      where[Op.or] = [
        { academyId },
        { academyId: null }, // Include global permissions
      ];
    }

    const rolePermissions = await RolePermission.findAll({
      where,
      include: [
        {
          model: Permission,
          as: 'permission',
        },
      ],
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Check multiple permissions at once
   * @param {number} userId - User ID
   * @param {Array<string>} permissionNames - Permission names
   * @param {Object} context - Context
   * @returns {Promise<Object>} Map of permission name to boolean
   */
  async checkMultiplePermissions(userId, permissionNames, context = {}) {
    const results = {};

    for (const permissionName of permissionNames) {
      results[permissionName] = await this.hasPermission(userId, permissionName, context);
    }

    return results;
  }

  /**
   * Remove duplicate permissions
   * @param {Array} permissions - Permissions array
   * @returns {Array} Deduplicated permissions
   */
  deduplicatePermissions(permissions) {
    const seen = new Set();
    const unique = [];

    for (const perm of permissions) {
      const key = `${perm.name}-${perm.academyId || 'global'}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(perm);
      }
    }

    return unique;
  }

  /**
   * Validate permission name format
   * @param {string} permissionName - Permission name
   * @returns {boolean} Is valid
   */
  validatePermissionName(permissionName) {
    // Format: resource.action (e.g., 'content.create', 'user.manage')
    const pattern = /^[a-z_]+\.[a-z_]+$/;
    return pattern.test(permissionName);
  }
}

module.exports = new PermissionResolutionService();
