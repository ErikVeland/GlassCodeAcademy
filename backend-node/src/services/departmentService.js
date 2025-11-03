const { Department, Academy, User, AcademyMembership } = require('../models');
const { Op } = require('sequelize');

/**
 * Department Service
 * Manages hierarchical department structures within academies
 */
class DepartmentService {
  /**
   * Create a new department
   * @param {Object} departmentData - Department creation data
   * @returns {Promise<Object>} Created department
   */
  async createDepartment(departmentData) {
    const { academyId, parentId, name, slug, description, managerId } =
      departmentData;

    // Verify academy exists
    const academy = await Academy.findByPk(academyId);
    if (!academy) {
      throw new Error(`Academy with ID ${academyId} not found`);
    }

    // Check slug uniqueness within academy
    const existingDepartment = await Department.findOne({
      where: { academyId, slug },
    });

    if (existingDepartment) {
      throw new Error(
        `Department with slug '${slug}' already exists in this academy`
      );
    }

    // Verify parent department if specified
    if (parentId) {
      const parentDepartment = await Department.findOne({
        where: { id: parentId, academyId },
      });

      if (!parentDepartment) {
        throw new Error(
          `Parent department with ID ${parentId} not found in this academy`
        );
      }
    }

    // Verify manager if specified
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        throw new Error(`User with ID ${managerId} not found`);
      }
    }

    const department = await Department.create({
      academyId,
      parentId: parentId || null,
      name,
      slug,
      description: description || null,
      managerId: managerId || null,
      isActive: true,
      metadata: {},
    });

    return await this.getDepartmentById(department.id);
  }

  /**
   * Get department by ID with associations
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Department data
   */
  async getDepartmentById(departmentId) {
    const department = await Department.findByPk(departmentId, {
      include: [
        { model: Academy, as: 'academy', attributes: ['id', 'name', 'slug'] },
        { model: Department, as: 'parent', attributes: ['id', 'name', 'slug'] },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    return department;
  }

  /**
   * Get all departments for an academy
   * @param {number} academyId - Academy ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Departments list
   */
  async getAcademyDepartments(academyId, options = {}) {
    const { includeInactive = false, parentId = null } = options;

    const where = { academyId };

    if (!includeInactive) {
      where.isActive = true;
    }

    // Filter by parent (null for root departments)
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const departments = await Department.findAll({
      where,
      include: [
        { model: Department, as: 'parent', attributes: ['id', 'name', 'slug'] },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      order: [['name', 'ASC']],
    });

    return departments;
  }

  /**
   * Get department tree (hierarchical structure)
   * @param {number} academyId - Academy ID
   * @param {number} rootDepartmentId - Root department ID (null for all roots)
   * @returns {Promise<Array>} Hierarchical department tree
   */
  async getDepartmentTree(academyId, rootDepartmentId = null) {
    const rootDepartments = await this.getAcademyDepartments(academyId, {
      parentId: rootDepartmentId,
      includeInactive: false,
    });

    // Recursively build tree
    const buildTree = async (departments) => {
      const tree = [];

      for (const department of departments) {
        const children = await this.getDepartmentTree(academyId, department.id);

        tree.push({
          ...department.toJSON(),
          children,
        });
      }

      return tree;
    };

    return await buildTree(rootDepartments);
  }

  /**
   * Get department path (from root to current)
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} Path array from root to department
   */
  async getDepartmentPath(departmentId) {
    const path = [];
    let currentDepartment = await this.getDepartmentById(departmentId);

    while (currentDepartment) {
      path.unshift(currentDepartment);

      if (currentDepartment.parentId) {
        currentDepartment = await this.getDepartmentById(
          currentDepartment.parentId
        );
      } else {
        currentDepartment = null;
      }
    }

    return path;
  }

  /**
   * Get all child departments (recursive)
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} All descendant departments
   */
  async getAllChildDepartments(departmentId) {
    const children = await Department.findAll({
      where: { parentId: departmentId },
    });

    const allDescendants = [...children];

    for (const child of children) {
      const descendants = await this.getAllChildDepartments(child.id);
      allDescendants.push(...descendants);
    }

    return allDescendants;
  }

  /**
   * Update department
   * @param {number} departmentId - Department ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated department
   */
  async updateDepartment(departmentId, updateData) {
    const department = await Department.findByPk(departmentId);

    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    // Check slug uniqueness if being updated
    if (updateData.slug && updateData.slug !== department.slug) {
      const existingDepartment = await Department.findOne({
        where: {
          academyId: department.academyId,
          slug: updateData.slug,
          id: { [Op.ne]: departmentId },
        },
      });

      if (existingDepartment) {
        throw new Error(
          `Department with slug '${updateData.slug}' already exists in this academy`
        );
      }
    }

    // Prevent circular references in parent-child relationships
    if (updateData.parentId && updateData.parentId !== department.parentId) {
      const isDescendant = await this.isDescendant(
        departmentId,
        updateData.parentId
      );
      if (isDescendant) {
        throw new Error(
          'Cannot set parent to a descendant department (circular reference)'
        );
      }
    }

    await department.update(updateData);

    return await this.getDepartmentById(departmentId);
  }

  /**
   * Delete department
   * @param {number} departmentId - Department ID
   * @param {boolean} deleteChildren - Delete all child departments
   * @returns {Promise<boolean>} Success status
   */
  async deleteDepartment(departmentId, deleteChildren = false) {
    const department = await Department.findByPk(departmentId);

    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    if (deleteChildren) {
      // Delete all child departments recursively
      const children = await this.getAllChildDepartments(departmentId);
      for (const child of children) {
        await child.destroy();
      }
    } else {
      // Check if department has children
      const childCount = await Department.count({
        where: { parentId: departmentId },
      });
      if (childCount > 0) {
        throw new Error(
          'Cannot delete department with children. Delete children first or use deleteChildren option.'
        );
      }
    }

    await department.destroy();

    return true;
  }

  /**
   * Deactivate department
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Updated department
   */
  async deactivateDepartment(departmentId) {
    return await this.updateDepartment(departmentId, { isActive: false });
  }

  /**
   * Activate department
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Updated department
   */
  async activateDepartment(departmentId) {
    return await this.updateDepartment(departmentId, { isActive: true });
  }

  /**
   * Move department to new parent
   * @param {number} departmentId - Department ID
   * @param {number} newParentId - New parent department ID
   * @returns {Promise<Object>} Updated department
   */
  async moveDepartment(departmentId, newParentId) {
    return await this.updateDepartment(departmentId, { parentId: newParentId });
  }

  /**
   * Get department members
   * @param {number} departmentId - Department ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated members
   */
  async getDepartmentMembers(departmentId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await AcademyMembership.findAndCountAll({
      where: { departmentId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      limit,
      offset,
      order: [['joinedAt', 'DESC']],
    });

    return {
      members: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Check if department is descendant of another
   * @param {number} departmentId - Department ID
   * @param {number} potentialAncestorId - Potential ancestor ID
   * @returns {Promise<boolean>} Is descendant
   */
  async isDescendant(departmentId, potentialAncestorId) {
    const path = await this.getDepartmentPath(departmentId);
    return path.some((dept) => dept.id === potentialAncestorId);
  }

  /**
   * Get department statistics
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Department statistics
   */
  async getDepartmentStatistics(departmentId) {
    const [memberCount, childCount, allDescendants] = await Promise.all([
      AcademyMembership.count({ where: { departmentId } }),
      Department.count({ where: { parentId: departmentId } }),
      this.getAllChildDepartments(departmentId),
    ]);

    return {
      departmentId,
      directMembers: memberCount,
      directChildren: childCount,
      totalDescendants: allDescendants.length,
    };
  }
}

module.exports = new DepartmentService();
