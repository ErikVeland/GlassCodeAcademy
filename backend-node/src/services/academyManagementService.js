const { Academy, AcademySettings, Course, Module, Lesson } = require('../models');
const { Op } = require('sequelize');

/**
 * Academy Management Service
 * Handles all academy-related operations including settings management
 */
class AcademyManagementService {
  /**
   * Create a new academy with default settings
   * @param {Object} academyData - Academy creation data
   * @param {Object} settingsData - Optional initial settings
   * @returns {Promise<Object>} Created academy with settings
   */
  async createAcademy(academyData, settingsData = {}) {
    const transaction = await Academy.sequelize.transaction();

    try {
      // Create academy
      const academy = await Academy.create(academyData, { transaction });

      // Create default settings
      const defaultSettings = {
        academyId: academy.id,
        tenantMode: settingsData.tenantMode || 'shared',
        maxUsers: settingsData.maxUsers || null,
        maxStorageGb: settingsData.maxStorageGb || null,
        featuresEnabled: settingsData.featuresEnabled || {
          versioning: true,
          workflows: true,
          departments: true,
          validation: true,
        },
        branding: settingsData.branding || {},
        integrations: settingsData.integrations || {},
      };

      const settings = await AcademySettings.create(defaultSettings, { transaction });

      await transaction.commit();

      return {
        academy,
        settings,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get academy by ID with optional settings
   * @param {number} academyId - Academy ID
   * @param {boolean} includeSettings - Include settings in response
   * @returns {Promise<Object>} Academy data
   */
  async getAcademyById(academyId, includeSettings = true) {
    const includeOptions = includeSettings
      ? [{ model: AcademySettings, as: 'settings' }]
      : [];

    const academy = await Academy.findByPk(academyId, {
      include: includeOptions,
    });

    if (!academy) {
      throw new Error(`Academy with ID ${academyId} not found`);
    }

    return academy;
  }

  /**
   * Get all academies with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated academies
   */
  async getAllAcademies(options = {}) {
    const {
      page = 1,
      limit = 10,
      includeSettings = false,
      isPublished = null,
      search = null,
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by published status
    if (isPublished !== null) {
      where.isPublished = isPublished;
    }

    // Search by name or slug
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const includeOptions = includeSettings
      ? [{ model: AcademySettings, as: 'settings' }]
      : [];

    const { count, rows } = await Academy.findAndCountAll({
      where,
      include: includeOptions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      academies: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Update academy
   * @param {number} academyId - Academy ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated academy
   */
  async updateAcademy(academyId, updateData) {
    const academy = await this.getAcademyById(academyId, false);

    await academy.update(updateData);

    return academy;
  }

  /**
   * Delete academy (soft delete by setting isPublished to false)
   * @param {number} academyId - Academy ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAcademy(academyId) {
    const academy = await this.getAcademyById(academyId, false);

    // Soft delete by unpublishing
    await academy.update({ isPublished: false });

    return true;
  }

  /**
   * Hard delete academy (permanent removal)
   * @param {number} academyId - Academy ID
   * @returns {Promise<boolean>} Success status
   */
  async hardDeleteAcademy(academyId) {
    const academy = await this.getAcademyById(academyId, false);

    await academy.destroy();

    return true;
  }

  /**
   * Get academy settings
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object>} Academy settings
   */
  async getAcademySettings(academyId) {
    const settings = await AcademySettings.findOne({
      where: { academyId },
    });

    if (!settings) {
      throw new Error(`Settings for academy ${academyId} not found`);
    }

    return settings;
  }

  /**
   * Update academy settings
   * @param {number} academyId - Academy ID
   * @param {Object} updateData - Settings update data
   * @returns {Promise<Object>} Updated settings
   */
  async updateAcademySettings(academyId, updateData) {
    const settings = await this.getAcademySettings(academyId);

    await settings.update(updateData);

    return settings;
  }

  /**
   * Get academy statistics
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object>} Academy statistics
   */
  async getAcademyStatistics(academyId) {
    // Verify academy exists
    await this.getAcademyById(academyId, false);

    const [courseCount, moduleCount, lessonCount] = await Promise.all([
      Course.count({ where: { academyId } }),
      Module.count({ where: { academyId } }),
      Lesson.count({ where: { academyId } }),
    ]);

    return {
      academyId,
      courses: courseCount,
      modules: moduleCount,
      lessons: lessonCount,
      totalContent: courseCount + moduleCount + lessonCount,
    };
  }

  /**
   * Clone academy with all content
   * @param {number} sourceAcademyId - Source academy ID
   * @param {Object} newAcademyData - New academy data
   * @returns {Promise<Object>} Cloned academy
   */
  async cloneAcademy(sourceAcademyId, newAcademyData) {
    const transaction = await Academy.sequelize.transaction();

    try {
      // Get source academy with settings
      const sourceAcademy = await this.getAcademyById(sourceAcademyId, true);

      // Create new academy
      const academyData = {
        name: newAcademyData.name,
        slug: newAcademyData.slug,
        description: newAcademyData.description || sourceAcademy.description,
        isPublished: newAcademyData.isPublished || false,
        version: '1.0.0',
        theme: sourceAcademy.theme,
        metadata: { clonedFrom: sourceAcademyId },
      };

      const newAcademy = await Academy.create(academyData, { transaction });

      // Clone settings
      if (sourceAcademy.settings) {
        const settingsData = {
          academyId: newAcademy.id,
          tenantMode: sourceAcademy.settings.tenantMode,
          maxUsers: sourceAcademy.settings.maxUsers,
          maxStorageGb: sourceAcademy.settings.maxStorageGb,
          featuresEnabled: sourceAcademy.settings.featuresEnabled,
          branding: sourceAcademy.settings.branding,
          integrations: {},
        };

        await AcademySettings.create(settingsData, { transaction });
      }

      await transaction.commit();

      return newAcademy;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Check if academy slug is available
   * @param {string} slug - Academy slug
   * @param {number} excludeAcademyId - Academy ID to exclude from check
   * @returns {Promise<boolean>} Availability status
   */
  async isSlugAvailable(slug, excludeAcademyId = null) {
    const where = { slug };

    if (excludeAcademyId) {
      where.id = { [Op.ne]: excludeAcademyId };
    }

    const count = await Academy.count({ where });

    return count === 0;
  }

  /**
   * Validate academy data
   * @param {Object} academyData - Academy data to validate
   * @returns {Object} Validation result
   */
  validateAcademyData(academyData) {
    const errors = [];

    if (!academyData.name || academyData.name.trim().length === 0) {
      errors.push('Academy name is required');
    }

    if (!academyData.slug || academyData.slug.trim().length === 0) {
      errors.push('Academy slug is required');
    }

    if (academyData.slug && !/^[a-z0-9-]+$/.test(academyData.slug)) {
      errors.push('Academy slug must contain only lowercase letters, numbers, and hyphens');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new AcademyManagementService();
