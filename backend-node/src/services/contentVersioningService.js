/**
 * Content Versioning Service
 *
 * Manages version control for all content types (courses, modules, lessons, quizzes).
 * Provides version creation, restoration, comparison, and history tracking.
 * Supports semantic versioning and delta tracking between versions.
 *
 * @module services/contentVersioningService
 */

const { Op } = require('sequelize');
const ContentVersion = require('../models/contentVersionModel');
const Course = require('../models/courseModel');
const Module = require('../models/moduleModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');
const User = require('../models/userModel');
const Academy = require('../models/academyModel');

/**
 * Content Versioning Service
 * Singleton service for managing content versions across all content types
 */
class ContentVersioningService {
  /**
   * Get the Sequelize model for a content type
   *
   * @param {string} contentType - Type of content (course, module, lesson, quiz)
   * @returns {Object} Sequelize model
   * @throws {Error} If content type is invalid
   */
  getContentModel(contentType) {
    const models = {
      course: Course,
      module: Module,
      lesson: Lesson,
      quiz: Quiz,
    };

    const model = models[contentType.toLowerCase()];
    if (!model) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return model;
  }

  /**
   * Create a new version of content
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {number} academyId - ID of the academy
   * @param {number} userId - ID of the user creating the version
   * @param {Object} options - Version creation options
   * @param {string} options.changeSummary - Description of changes
   * @param {string} options.status - Version status (draft, review, published, archived)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} Created version
   */
  async createVersion(contentType, contentId, academyId, userId, options = {}) {
    const { changeSummary, status = 'draft', metadata = {} } = options;

    // Get the content model and fetch current content
    const ContentModel = this.getContentModel(contentType);
    const content = await ContentModel.findByPk(contentId);

    if (!content) {
      throw new Error(`${contentType} with ID ${contentId} not found`);
    }

    // Verify content belongs to the academy
    if (content.academyId && content.academyId !== academyId) {
      throw new Error('Content does not belong to the specified academy');
    }

    // Get the latest version to calculate delta and next version number
    const latestVersion = await this.getLatestVersion(contentType, contentId);
    const previousSnapshot = latestVersion
      ? latestVersion.contentSnapshot
      : null;
    const nextVersionNumber = this.calculateNextVersion(
      latestVersion ? latestVersion.versionNumber : '0.0.0',
      status
    );

    // Create content snapshot
    const contentSnapshot = content.toJSON();

    // Calculate delta if there's a previous version
    const delta = previousSnapshot
      ? this.calculateDelta(previousSnapshot, contentSnapshot)
      : null;

    // Create the new version
    const version = await ContentVersion.create({
      contentType: contentType.toLowerCase(),
      contentId,
      academyId,
      versionNumber: nextVersionNumber,
      contentSnapshot,
      delta,
      status,
      createdBy: userId,
      changeSummary,
      metadata,
    });

    return await this.getVersionById(version.id);
  }

  /**
   * Get version by ID
   *
   * @param {string} versionId - UUID of the version
   * @returns {Promise<Object|null>} Version with associations
   */
  async getVersionById(versionId) {
    return await ContentVersion.findByPk(versionId, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
        { model: Academy, as: 'academy', attributes: ['id', 'name'] },
      ],
    });
  }

  /**
   * Get all versions for a content item
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of versions to return
   * @param {number} options.offset - Number of versions to skip
   * @param {string} options.status - Filter by status
   * @returns {Promise<Object>} Versions with pagination info
   */
  async getContentVersions(contentType, contentId, options = {}) {
    const { limit = 20, offset = 0, status } = options;

    const where = {
      contentType: contentType.toLowerCase(),
      contentId,
    };

    if (status) {
      where.status = status;
    }

    const { rows: versions, count: total } =
      await ContentVersion.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

    return {
      versions,
      total,
      limit,
      offset,
      hasMore: offset + versions.length < total,
    };
  }

  /**
   * Get the latest version of content
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {string} status - Optional status filter
   * @returns {Promise<Object|null>} Latest version or null
   */
  async getLatestVersion(contentType, contentId, status = null) {
    const where = {
      contentType: contentType.toLowerCase(),
      contentId,
    };

    if (status) {
      where.status = status;
    }

    return await ContentVersion.findOne({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
      ],
    });
  }

  /**
   * Get a specific version by version number
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {string} versionNumber - Version number (e.g., '1.0.0')
   * @returns {Promise<Object|null>} Version or null
   */
  async getVersionByNumber(contentType, contentId, versionNumber) {
    return await ContentVersion.findOne({
      where: {
        contentType: contentType.toLowerCase(),
        contentId,
        versionNumber,
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
      ],
    });
  }

  /**
   * Restore content to a specific version
   *
   * @param {string} versionId - UUID of the version to restore
   * @param {number} userId - ID of the user performing the restore
   * @param {Object} options - Restore options
   * @param {boolean} options.createBackup - Whether to create a backup before restoring
   * @returns {Promise<Object>} Restored content and new version
   */
  async restoreVersion(versionId, userId, options = {}) {
    const { createBackup = true } = options;

    const version = await this.getVersionById(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const { contentType, contentId, academyId, contentSnapshot } = version;

    // Get the content model
    const ContentModel = this.getContentModel(contentType);

    const transaction = await ContentModel.sequelize.transaction();

    try {
      // Create backup of current state if requested
      if (createBackup) {
        await this.createVersion(contentType, contentId, academyId, userId, {
          changeSummary: `Automatic backup before restoring to version ${version.versionNumber}`,
          status: 'archived',
          metadata: { isAutoBackup: true, restoringToVersion: versionId },
        });
      }

      // Restore the content from snapshot
      const content = await ContentModel.findByPk(contentId, { transaction });
      if (!content) {
        throw new Error(`${contentType} with ID ${contentId} not found`);
      }

      // Update content with snapshot data (excluding system fields)
      const restoreData = { ...contentSnapshot };
      delete restoreData.id;
      delete restoreData.createdAt;
      delete restoreData.updatedAt;
      await content.update(restoreData, { transaction });

      // Create new version marking the restore
      const restoredVersion = await this.createVersion(
        contentType,
        contentId,
        academyId,
        userId,
        {
          changeSummary: `Restored from version ${version.versionNumber}`,
          status: 'draft',
          metadata: { restoredFrom: versionId, isRestore: true },
        }
      );

      await transaction.commit();

      return {
        content: await ContentModel.findByPk(contentId),
        version: restoredVersion,
        restoredFrom: version.versionNumber,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Compare two versions
   *
   * @param {string} versionId1 - UUID of first version
   * @param {string} versionId2 - UUID of second version
   * @returns {Promise<Object>} Comparison result with differences
   */
  async compareVersions(versionId1, versionId2) {
    const version1 = await this.getVersionById(versionId1);
    const version2 = await this.getVersionById(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    if (
      version1.contentType !== version2.contentType ||
      version1.contentId !== version2.contentId
    ) {
      throw new Error('Cannot compare versions from different content items');
    }

    const differences = this.calculateDelta(
      version1.contentSnapshot,
      version2.contentSnapshot
    );

    return {
      version1: {
        id: version1.id,
        versionNumber: version1.versionNumber,
        createdAt: version1.createdAt,
        author: version1.author,
      },
      version2: {
        id: version2.id,
        versionNumber: version2.versionNumber,
        createdAt: version2.createdAt,
        author: version2.author,
      },
      differences,
      changeCount: Object.keys(differences).length,
    };
  }

  /**
   * Calculate delta (differences) between two objects
   *
   * @param {Object} oldObj - Previous object state
   * @param {Object} newObj - New object state
   * @returns {Object} Delta containing only changed fields
   * @private
   */
  calculateDelta(oldObj, newObj) {
    const delta = {};

    for (const key in newObj) {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        delta[key] = {
          old: oldObj[key],
          new: newObj[key],
        };
      }
    }

    return delta;
  }

  /**
   * Calculate next version number based on semantic versioning
   *
   * @param {string} currentVersion - Current version (e.g., '1.0.0')
   * @param {string} status - Version status (draft, review, published)
   * @returns {string} Next version number
   * @private
   */
  calculateNextVersion(currentVersion, status) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    // Published versions increment minor, others increment patch
    if (status === 'published') {
      return `${major}.${minor + 1}.0`;
    } else {
      return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Update version status
   *
   * @param {string} versionId - UUID of the version
   * @param {string} newStatus - New status (draft, review, published, archived)
   * @returns {Promise<Object>} Updated version
   */
  async updateVersionStatus(versionId, newStatus) {
    const validStatuses = ['draft', 'review', 'published', 'archived'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const version = await ContentVersion.findByPk(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    await version.update({ status: newStatus });
    return await this.getVersionById(versionId);
  }

  /**
   * Get version history for an academy
   *
   * @param {number} academyId - ID of the academy
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of versions
   * @param {number} options.offset - Number to skip
   * @param {string} options.contentType - Filter by content type
   * @param {string} options.status - Filter by status
   * @returns {Promise<Object>} Version history with pagination
   */
  async getAcademyVersionHistory(academyId, options = {}) {
    const { limit = 50, offset = 0, contentType, status } = options;

    const where = { academyId };

    if (contentType) {
      where.contentType = contentType.toLowerCase();
    }

    if (status) {
      where.status = status;
    }

    const { rows: versions, count: total } =
      await ContentVersion.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

    return {
      versions,
      total,
      limit,
      offset,
      hasMore: offset + versions.length < total,
    };
  }

  /**
   * Delete old versions (cleanup)
   *
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {Object} options - Cleanup options
   * @param {number} options.keepCount - Number of recent versions to keep
   * @param {number} options.keepDays - Keep versions newer than this many days
   * @returns {Promise<number>} Number of versions deleted
   */
  async cleanupOldVersions(contentType, contentId, options = {}) {
    const { keepCount = 10, keepDays = 90 } = options;

    // Get all versions for this content
    const allVersions = await ContentVersion.findAll({
      where: {
        contentType: contentType.toLowerCase(),
        contentId,
      },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'created_at', 'status'],
    });

    // Determine which versions to delete
    const versionsToDelete = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    allVersions.forEach((version, index) => {
      // Keep recent versions (by count)
      if (index < keepCount) return;

      // Keep versions within keepDays
      if (version.createdAt > cutoffDate) return;

      // Keep published versions
      if (version.status === 'published') return;

      versionsToDelete.push(version.id);
    });

    if (versionsToDelete.length === 0) {
      return 0;
    }

    // Delete old versions
    const deletedCount = await ContentVersion.destroy({
      where: {
        id: { [Op.in]: versionsToDelete },
      },
    });

    return deletedCount;
  }
}

// Export singleton instance
module.exports = new ContentVersioningService();
