/**
 * Academy Import Service
 * Handles importing academy packages with preview, conflict detection, and rollback
 */

const { sequelize, Academy, AcademySettings, Course, Module, Lesson, LessonQuiz } = require('../models');
const ContentPackageService = require('./contentPackageService');
const fs = require('fs').promises;
const path = require('path');

class AcademyImportService {
  constructor() {
    this.packageService = new ContentPackageService();
  }

  /**
   * Preview import - analyze package without importing
   * @param {string} packagePath - Path to package file
   * @returns {Promise<Object>} Preview information
   */
  async previewImport(packagePath) {
    // Extract package to temp directory
    const extractDir = path.join(__dirname, '../../temp', `preview-${Date.now()}`);
    const packageMeta = await this.packageService.extractPackage(packagePath, extractDir);

    // Verify package integrity
    const verification = await this.packageService.verifyPackage(extractDir);
    if (!verification.valid) {
      throw new Error(`Package verification failed: ${verification.errors.join(', ')}`);
    }

    // Read academy data
    const dataPath = path.join(extractDir, 'academy-data.json');
    const exportData = JSON.parse(await fs.readFile(dataPath, 'utf8'));

    // Detect conflicts
    const conflicts = await this.detectConflicts(exportData);

    // Calculate statistics
    const stats = this.calculateImportStats(exportData);

    // Cleanup temp directory
    await fs.rm(extractDir, { recursive: true, force: true });

    return {
      packageId: packageMeta.packageId,
      formatVersion: packageMeta.formatVersion,
      academy: {
        name: exportData.academy.name,
        slug: exportData.academy.slug,
        version: exportData.academy.version,
        description: exportData.academy.description,
      },
      stats,
      conflicts,
      canImport: conflicts.critical.length === 0,
      warnings: conflicts.warnings,
    };
  }

  /**
   * Detect conflicts with existing data
   * @param {Object} exportData - Export data to check
   * @returns {Promise<Object>} Conflict information
   */
  async detectConflicts(exportData) {
    const conflicts = {
      critical: [],
      warnings: [],
      resolutions: [],
    };

    // Check if academy slug already exists
    const existingAcademy = await Academy.findOne({
      where: { slug: exportData.academy.slug },
    });

    if (existingAcademy) {
      conflicts.critical.push({
        type: 'ACADEMY_SLUG_EXISTS',
        message: `Academy with slug '${exportData.academy.slug}' already exists`,
        existingId: existingAcademy.id,
        suggestion: 'Use a different slug or merge with existing academy',
      });
    }

    // Check for duplicate course slugs
    const courseSlugs = exportData.courses.map((c) => c.slug);
    const existingCourses = await Course.findAll({
      where: { slug: courseSlugs },
      attributes: ['id', 'slug', 'title'],
    });

    if (existingCourses.length > 0) {
      conflicts.warnings.push({
        type: 'COURSE_SLUGS_EXIST',
        message: `${existingCourses.length} course slug(s) already exist`,
        courses: existingCourses.map((c) => ({
          slug: c.slug,
          title: c.title,
        })),
        suggestion: 'Courses will be created with modified slugs',
      });

      // Add resolution strategy
      conflicts.resolutions.push({
        conflict: 'COURSE_SLUGS_EXIST',
        strategy: 'MODIFY_SLUGS',
        action: 'Append timestamp to duplicate slugs',
      });
    }

    return conflicts;
  }

  /**
   * Calculate import statistics
   * @param {Object} exportData - Export data
   * @returns {Object} Statistics
   */
  calculateImportStats(exportData) {
    const stats = {
      courses: exportData.courses?.length || 0,
      modules: 0,
      lessons: 0,
      quizzes: 0,
    };

    exportData.courses?.forEach((course) => {
      stats.modules += course.modules?.length || 0;
      course.modules?.forEach((module) => {
        stats.lessons += module.lessons?.length || 0;
        module.lessons?.forEach((lesson) => {
          stats.quizzes += lesson.quizzes?.length || 0;
        });
      });
    });

    return stats;
  }

  /**
   * Import academy from package
   * @param {string} packagePath - Path to package file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importAcademy(packagePath, options = {}) {
    const {
      overwriteExisting = false,
      modifySlugsOnConflict = true,
      skipConflictingContent = false,
      targetAcademyId = null,
    } = options;

    // Extract package
    const extractDir = path.join(__dirname, '../../temp', `import-${Date.now()}`);
    const packageMeta = await this.packageService.extractPackage(packagePath, extractDir);

    // Verify package
    const verification = await this.packageService.verifyPackage(extractDir);
    if (!verification.valid) {
      await fs.rm(extractDir, { recursive: true, force: true });
      throw new Error(`Package verification failed: ${verification.errors.join(', ')}`);
    }

    // Read academy data
    const dataPath = path.join(extractDir, 'academy-data.json');
    const exportData = JSON.parse(await fs.readFile(dataPath, 'utf8'));

    let importResult;
    const transaction = await sequelize.transaction();

    try {
      // Import academy and content
      importResult = await this.performImport(exportData, options, transaction);

      // Commit transaction
      await transaction.commit();

      // Cleanup temp directory
      await fs.rm(extractDir, { recursive: true, force: true });

      return {
        success: true,
        academyId: importResult.academy.id,
        academy: importResult.academy,
        stats: importResult.stats,
        warnings: importResult.warnings,
      };
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();

      // Cleanup temp directory
      await fs.rm(extractDir, { recursive: true, force: true });

      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Perform the actual import within a transaction
   * @param {Object} exportData - Export data
   * @param {Object} options - Import options
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Import result
   */
  async performImport(exportData, options, transaction) {
    const { modifySlugsOnConflict = true, targetAcademyId = null } = options;
    const warnings = [];
    const stats = { created: 0, updated: 0, skipped: 0 };

    // Create or update academy
    let academy;
    if (targetAcademyId) {
      // Import into existing academy
      academy = await Academy.findByPk(targetAcademyId, { transaction });
      if (!academy) {
        throw new Error(`Target academy ${targetAcademyId} not found`);
      }
      stats.updated++;
    } else {
      // Check for slug conflict
      const existingAcademy = await Academy.findOne({
        where: { slug: exportData.academy.slug },
        transaction,
      });

      if (existingAcademy) {
        if (modifySlugsOnConflict) {
          exportData.academy.slug = `${exportData.academy.slug}-${Date.now()}`;
          warnings.push({
            type: 'SLUG_MODIFIED',
            message: `Academy slug modified to avoid conflict: ${exportData.academy.slug}`,
          });
        } else {
          throw new Error(`Academy with slug '${exportData.academy.slug}' already exists`);
        }
      }

      // Create new academy
      academy = await Academy.create(
        {
          name: exportData.academy.name,
          slug: exportData.academy.slug,
          description: exportData.academy.description,
          version: exportData.academy.version,
          theme: exportData.academy.theme,
          metadata: exportData.academy.metadata,
          isPublished: exportData.academy.isPublished || false,
        },
        { transaction }
      );
      stats.created++;
    }

    // Create academy settings if provided
    if (exportData.settings) {
      await AcademySettings.create(
        {
          academyId: academy.id,
          tenantMode: exportData.settings.tenantMode || 'shared',
          maxUsers: exportData.settings.maxUsers,
          maxStorageGb: exportData.settings.maxStorageGb,
          featuresEnabled: exportData.settings.featuresEnabled || {},
          branding: exportData.settings.branding || {},
          integrations: exportData.settings.integrations || {},
        },
        { transaction }
      );
      stats.created++;
    }

    // Import courses
    const courseStats = await this.importCourses(
      exportData.courses || [],
      academy.id,
      options,
      transaction
    );

    stats.created += courseStats.created;
    stats.updated += courseStats.updated;
    stats.skipped += courseStats.skipped;
    warnings.push(...courseStats.warnings);

    return {
      academy: {
        id: academy.id,
        name: academy.name,
        slug: academy.slug,
      },
      stats,
      warnings,
    };
  }

  /**
   * Import courses and their content
   * @param {Array} courses - Courses to import
   * @param {number} academyId - Academy ID
   * @param {Object} options - Import options
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Import statistics
   */
  async importCourses(courses, academyId, options, transaction) {
    const { modifySlugsOnConflict = true, skipConflictingContent = false } = options;
    const stats = { created: 0, updated: 0, skipped: 0, warnings: [] };

    for (const courseData of courses) {
      try {
        // Check for slug conflict
        let slug = courseData.slug;
        const existing = await Course.findOne({
          where: { slug, academy_id: academyId },
          transaction,
        });

        if (existing) {
          if (skipConflictingContent) {
            stats.skipped++;
            continue;
          } else if (modifySlugsOnConflict) {
            slug = `${slug}-${Date.now()}`;
            stats.warnings.push({
              type: 'COURSE_SLUG_MODIFIED',
              message: `Course slug modified: ${courseData.slug} -> ${slug}`,
            });
          } else {
            throw new Error(`Course slug '${slug}' already exists`);
          }
        }

        // Create course
        const course = await Course.create(
          {
            academyId: academyId,
            title: courseData.title,
            slug,
            description: courseData.description,
            order: courseData.order,
            difficulty: courseData.difficulty,
            estimatedHours: courseData.estimatedHours,
            isPublished: courseData.isPublished || false,
            version: courseData.version || '1.0.0',
          },
          { transaction }
        );
        stats.created++;

        // Import modules
        const moduleStats = await this.importModules(
          courseData.modules || [],
          course.id,
          academyId,
          options,
          transaction
        );
        stats.created += moduleStats.created;
        stats.updated += moduleStats.updated;
        stats.skipped += moduleStats.skipped;
        stats.warnings.push(...moduleStats.warnings);
      } catch (error) {
        if (skipConflictingContent) {
          stats.skipped++;
          stats.warnings.push({
            type: 'COURSE_IMPORT_ERROR',
            message: `Failed to import course '${courseData.title}': ${error.message}`,
          });
        } else {
          throw error;
        }
      }
    }

    return stats;
  }

  /**
   * Import modules and lessons
   * @param {Array} modules - Modules to import
   * @param {number} courseId - Course ID
   * @param {number} academyId - Academy ID
   * @param {Object} options - Import options
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Import statistics
   */
  async importModules(modules, courseId, academyId, options, transaction) {
    const { modifySlugsOnConflict = true, skipConflictingContent = false } = options;
    const stats = { created: 0, updated: 0, skipped: 0, warnings: [] };

    for (const moduleData of modules) {
      try {
        let slug = moduleData.slug;
        const existing = await Module.findOne({
          where: { slug, course_id: courseId },
          transaction,
        });

        if (existing) {
          if (skipConflictingContent) {
            stats.skipped++;
            continue;
          } else if (modifySlugsOnConflict) {
            slug = `${slug}-${Date.now()}`;
          }
        }

        const module = await Module.create(
          {
            courseId: courseId,
            academyId: academyId,
            title: moduleData.title,
            slug,
            description: moduleData.description,
            order: moduleData.order,
            isPublished: moduleData.isPublished || false,
            version: moduleData.version || '1.0.0',
          },
          { transaction }
        );
        stats.created++;

        // Import lessons
        const lessonStats = await this.importLessons(
          moduleData.lessons || [],
          module.id,
          academyId,
          options,
          transaction
        );
        stats.created += lessonStats.created;
        stats.updated += lessonStats.updated;
        stats.skipped += lessonStats.skipped;
        stats.warnings.push(...lessonStats.warnings);
      } catch (error) {
        if (skipConflictingContent) {
          stats.skipped++;
          stats.warnings.push({
            type: 'MODULE_IMPORT_ERROR',
            message: `Failed to import module '${moduleData.title}': ${error.message}`,
          });
        } else {
          throw error;
        }
      }
    }

    return stats;
  }

  /**
   * Import lessons and quizzes
   * @param {Array} lessons - Lessons to import
   * @param {number} moduleId - Module ID
   * @param {number} academyId - Academy ID
   * @param {Object} options - Import options
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Import statistics
   */
  async importLessons(lessons, moduleId, academyId, options, transaction) {
    const { skipConflictingContent = false } = options;
    const stats = { created: 0, updated: 0, skipped: 0, warnings: [] };

    for (const lessonData of lessons) {
      try {
        const lesson = await Lesson.create(
          {
            moduleId: moduleId,
            academyId: academyId,
            title: lessonData.title,
            slug: lessonData.slug,
            order: lessonData.order,
            content: lessonData.content,
            metadata: lessonData.metadata,
            isPublished: lessonData.isPublished || false,
            difficulty: lessonData.difficulty,
            estimatedMinutes: lessonData.estimatedMinutes,
            version: lessonData.version || '1.0.0',
          },
          { transaction }
        );
        stats.created++;

        // Import quizzes
        if (lessonData.quizzes && lessonData.quizzes.length > 0) {
          for (const quizData of lessonData.quizzes) {
            await LessonQuiz.create(
              {
                lessonId: lesson.id,
                academyId: academyId,
                question: quizData.question,
                topic: quizData.topic,
                difficulty: quizData.difficulty,
                choices: quizData.choices,
                fixedChoiceOrder: quizData.fixedChoiceOrder,
                choiceLabels: quizData.choiceLabels,
                acceptedAnswers: quizData.acceptedAnswers,
                explanation: quizData.explanation,
                industryContext: quizData.industryContext,
                tags: quizData.tags,
                questionType: quizData.questionType,
                estimatedTime: quizData.estimatedTime,
                correctAnswer: quizData.correctAnswer,
                quizType: quizData.quizType,
                sources: quizData.sources,
                sortOrder: quizData.sortOrder,
                isPublished: quizData.isPublished || false,
              },
              { transaction }
            );
            stats.created++;
          }
        }
      } catch (error) {
        if (skipConflictingContent) {
          stats.skipped++;
          stats.warnings.push({
            type: 'LESSON_IMPORT_ERROR',
            message: `Failed to import lesson '${lessonData.title}': ${error.message}`,
          });
        } else {
          throw error;
        }
      }
    }

    return stats;
  }
}

module.exports = AcademyImportService;
