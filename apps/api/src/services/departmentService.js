/* eslint-env node */
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
  async createDepartment(departmentData, fastify) {
    const { academyId, parentId, name, slug, description, managerId } =
      departmentData;

    // Verify academy exists
    const academy = await fastify.prisma.academy.findUnique({
      where: { id: academyId },
    });
    if (!academy) {
      throw new Error(`Academy with ID ${academyId} not found`);
    }

    // Check slug uniqueness within academy
    const existingDepartment = await fastify.prisma.department.findFirst({
      where: { academyId, slug },
    });

    if (existingDepartment) {
      throw new Error(
        `Department with slug '${slug}' already exists in this academy`
      );
    }

    // Verify parent department if specified
    if (parentId) {
      const parentDepartment = await fastify.prisma.department.findFirst({
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
      const manager = await fastify.prisma.user.findUnique({
        where: { id: managerId },
      });
      if (!manager) {
        throw new Error(`User with ID ${managerId} not found`);
      }
    }

    const department = await fastify.prisma.department.create({
      data: {
        academyId,
        parentId: parentId || null,
        name,
        slug,
        description: description || null,
        managerId: managerId || null,
        isActive: true,
        metadata: {},
      },
    });

    return await this.getDepartmentById(department.id, fastify);
  }

  /**
   * Get department by ID with associations
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Department data
   */
  async getDepartmentById(departmentId, fastify) {
    const department = await fastify.prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        academy: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
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
  async getAcademyDepartments(academyId, options = {}, fastify) {
    const { includeInactive = false, parentId = null } = options;

    const where = { academyId };

    if (!includeInactive) {
      where.isActive = true;
    }

    // Filter by parent (null for root departments)
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const departments = await fastify.prisma.department.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return departments;
  }

  /**
   * Get department tree (hierarchical structure)
   * @param {number} academyId - Academy ID
   * @param {number} rootDepartmentId - Root department ID (null for all roots)
   * @returns {Promise<Array>} Hierarchical department tree
   */
  async getDepartmentTree(academyId, rootDepartmentId = null, fastify) {
    const rootDepartments = await this.getAcademyDepartments(
      academyId,
      {
        parentId: rootDepartmentId,
        includeInactive: false,
      },
      fastify
    );

    // Recursively build tree
    const buildTree = async (departments) => {
      const tree = [];

      for (const department of departments) {
        const children = await this.getDepartmentTree(
          academyId,
          department.id,
          fastify
        );

        tree.push({
          ...department,
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
  async getDepartmentPath(departmentId, fastify) {
    const path = [];
    let currentDepartment = await this.getDepartmentById(departmentId, fastify);

    while (currentDepartment) {
      path.unshift(currentDepartment);

      if (currentDepartment.parentId) {
        currentDepartment = await this.getDepartmentById(
          currentDepartment.parentId,
          fastify
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
  async getAllChildDepartments(departmentId, fastify) {
    const children = await fastify.prisma.department.findMany({
      where: { parentId: departmentId },
    });

    const allDescendants = [...children];

    for (const child of children) {
      const descendants = await this.getAllChildDepartments(child.id, fastify);
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
  async updateDepartment(departmentId, updateData, fastify) {
    const { parentId, name, slug, description, managerId, isActive } =
      updateData;

    // Verify department exists
    const existingDepartment = await fastify.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    // Check slug uniqueness if updating
    if (slug && slug !== existingDepartment.slug) {
      const duplicateDepartment = await fastify.prisma.department.findFirst({
        where: {
          academyId: existingDepartment.academyId,
          slug,
          NOT: { id: departmentId },
        },
      });

      if (duplicateDepartment) {
        throw new Error(
          `Department with slug '${slug}' already exists in this academy`
        );
      }
    }

    // Verify parent department if specified
    if (parentId && parentId !== existingDepartment.parentId) {
      const parentDepartment = await fastify.prisma.department.findFirst({
        where: { id: parentId, academyId: existingDepartment.academyId },
      });

      if (!parentDepartment) {
        throw new Error(
          `Parent department with ID ${parentId} not found in this academy`
        );
      }
    }

    // Verify manager if specified
    if (managerId) {
      const manager = await fastify.prisma.user.findUnique({
        where: { id: managerId },
      });
      if (!manager) {
        throw new Error(`User with ID ${managerId} not found`);
      }
    }

    const updatedDepartment = await fastify.prisma.department.update({
      where: { id: departmentId },
      data: {
        parentId: parentId !== undefined ? parentId : undefined,
        name: name || undefined,
        slug: slug || undefined,
        description: description !== undefined ? description : undefined,
        managerId: managerId !== undefined ? managerId : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return await this.getDepartmentById(updatedDepartment.id, fastify);
  }

  /**
   * Delete department
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDepartment(departmentId, fastify) {
    // Verify department exists
    const department = await fastify.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    // Check if department has children
    const childCount = await fastify.prisma.department.count({
      where: { parentId: departmentId },
    });

    if (childCount > 0) {
      throw new Error(
        `Cannot delete department with ${childCount} child departments. Reassign or delete children first.`
      );
    }

    // Delete the department
    await fastify.prisma.department.delete({
      where: { id: departmentId },
    });

    return { success: true, message: 'Department deleted successfully' };
  }

  /**
   * Get department members
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} Department members
   */
  async getDepartmentMembers(departmentId, fastify) {
    const department = await fastify.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    const memberships = await fastify.prisma.academyMembership.findMany({
      where: {
        academyId: department.academyId,
        departmentId: departmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return memberships.map((membership) => ({
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      role: membership.user.role,
      joinedAt: membership.createdAt,
    }));
  }
}

module.exports = DepartmentService;