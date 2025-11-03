const {
  AcademyMembership,
  User,
  Role,
  Academy,
  Department,
} = require('../models');
const { Op } = require('sequelize');

/**
 * Academy Membership Service
 * Manages user-academy relationships and role assignments
 */
class AcademyMembershipService {
  /**
   * Add user to academy
   * @param {Object} membershipData - Membership creation data
   * @returns {Promise<Object>} Created membership
   */
  async addMember(membershipData) {
    const { academyId, userId, roleId, departmentId, customPermissions } =
      membershipData;

    // Verify academy exists
    const academy = await Academy.findByPk(academyId);
    if (!academy) {
      throw new Error(`Academy with ID ${academyId} not found`);
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    // Check if membership already exists
    const existingMembership = await AcademyMembership.findOne({
      where: { academyId, userId },
    });

    if (existingMembership) {
      throw new Error('User is already a member of this academy');
    }

    // Create membership
    const membership = await AcademyMembership.create({
      academyId,
      userId,
      roleId,
      departmentId: departmentId || null,
      status: 'active',
      customPermissions: customPermissions || {},
      metadata: {},
    });

    return await this.getMembershipById(membership.id);
  }

  /**
   * Get membership by ID with associations
   * @param {number} membershipId - Membership ID
   * @returns {Promise<Object>} Membership data
   */
  async getMembershipById(membershipId) {
    const membership = await AcademyMembership.findByPk(membershipId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Academy, as: 'academy', attributes: ['id', 'name', 'slug'] },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!membership) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    return membership;
  }

  /**
   * Get all memberships for an academy
   * @param {number} academyId - Academy ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated memberships
   */
  async getAcademyMembers(academyId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      roleId = null,
      departmentId = null,
      search = null,
    } = options;

    const offset = (page - 1) * limit;
    const where = { academyId };

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by role
    if (roleId) {
      where.roleId = roleId;
    }

    // Filter by department
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
        where: search
          ? {
              [Op.or]: [
                { email: { [Op.iLike]: `%${search}%` } },
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
              ],
            }
          : undefined,
      },
      { model: Role, as: 'role', attributes: ['id', 'name'] },
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'slug'],
      },
    ];

    const { count, rows } = await AcademyMembership.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['joinedAt', 'DESC']],
    });

    return {
      memberships: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get all academies for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's academies
   */
  async getUserAcademies(userId, options = {}) {
    const { status = 'active' } = options;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const memberships = await AcademyMembership.findAll({
      where,
      include: [
        {
          model: Academy,
          as: 'academy',
          attributes: ['id', 'name', 'slug', 'description', 'isPublished'],
        },
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['joinedAt', 'DESC']],
    });

    return memberships;
  }

  /**
   * Update membership
   * @param {number} membershipId - Membership ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated membership
   */
  async updateMembership(membershipId, updateData) {
    const membership = await AcademyMembership.findByPk(membershipId);

    if (!membership) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    // Validate role if being updated
    if (updateData.roleId) {
      const role = await Role.findByPk(updateData.roleId);
      if (!role) {
        throw new Error(`Role with ID ${updateData.roleId} not found`);
      }
    }

    // Validate department if being updated
    if (updateData.departmentId) {
      const department = await Department.findByPk(updateData.departmentId);
      if (!department) {
        throw new Error(
          `Department with ID ${updateData.departmentId} not found`
        );
      }
    }

    await membership.update(updateData);

    return await this.getMembershipById(membershipId);
  }

  /**
   * Remove member from academy
   * @param {number} membershipId - Membership ID
   * @returns {Promise<boolean>} Success status
   */
  async removeMember(membershipId) {
    const membership = await AcademyMembership.findByPk(membershipId);

    if (!membership) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    await membership.destroy();

    return true;
  }

  /**
   * Suspend membership
   * @param {number} membershipId - Membership ID
   * @returns {Promise<Object>} Updated membership
   */
  async suspendMembership(membershipId) {
    return await this.updateMembership(membershipId, { status: 'suspended' });
  }

  /**
   * Reactivate membership
   * @param {number} membershipId - Membership ID
   * @returns {Promise<Object>} Updated membership
   */
  async reactivateMembership(membershipId) {
    return await this.updateMembership(membershipId, { status: 'active' });
  }

  /**
   * Archive membership
   * @param {number} membershipId - Membership ID
   * @returns {Promise<Object>} Updated membership
   */
  async archiveMembership(membershipId) {
    return await this.updateMembership(membershipId, { status: 'archived' });
  }

  /**
   * Get user's membership in specific academy
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object|null>} Membership or null
   */
  async getUserMembershipInAcademy(userId, academyId) {
    const membership = await AcademyMembership.findOne({
      where: { userId, academyId },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    return membership;
  }

  /**
   * Check if user is member of academy
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @returns {Promise<boolean>} Membership status
   */
  async isUserMember(userId, academyId) {
    const count = await AcademyMembership.count({
      where: {
        userId,
        academyId,
        status: 'active',
      },
    });

    return count > 0;
  }

  /**
   * Get membership statistics for academy
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object>} Membership statistics
   */
  async getAcademyMembershipStatistics(academyId) {
    const [totalMembers, activeMembers, pendingMembers, suspendedMembers] =
      await Promise.all([
        AcademyMembership.count({ where: { academyId } }),
        AcademyMembership.count({ where: { academyId, status: 'active' } }),
        AcademyMembership.count({ where: { academyId, status: 'pending' } }),
        AcademyMembership.count({ where: { academyId, status: 'suspended' } }),
      ]);

    return {
      academyId,
      totalMembers,
      activeMembers,
      pendingMembers,
      suspendedMembers,
    };
  }

  /**
   * Bulk add members to academy
   * @param {number} academyId - Academy ID
   * @param {Array<Object>} members - Array of member data
   * @returns {Promise<Object>} Bulk operation results
   */
  async bulkAddMembers(academyId, members) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const memberData of members) {
      try {
        const membership = await this.addMember({
          academyId,
          ...memberData,
        });
        results.successful.push(membership);
      } catch (error) {
        results.failed.push({
          memberData,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Transfer member to different department
   * @param {number} membershipId - Membership ID
   * @param {number} newDepartmentId - New department ID
   * @returns {Promise<Object>} Updated membership
   */
  async transferMemberToDepartment(membershipId, newDepartmentId) {
    return await this.updateMembership(membershipId, {
      departmentId: newDepartmentId,
    });
  }

  /**
   * Change member role
   * @param {number} membershipId - Membership ID
   * @param {number} newRoleId - New role ID
   * @returns {Promise<Object>} Updated membership
   */
  async changeMemberRole(membershipId, newRoleId) {
    return await this.updateMembership(membershipId, {
      roleId: newRoleId,
    });
  }
}

module.exports = new AcademyMembershipService();
