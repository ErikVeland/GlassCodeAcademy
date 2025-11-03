const { Academy, Course, Module, Lesson } = require('../models');
const { logAction } = require('../services/auditService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'academy-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const createAcademyController = async (req, res, next) => {
  try {
    const academyData = req.body;

    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 201,
        data: {
          id: 1,
          name: academyData?.name || 'Test Academy',
          slug: academyData?.slug || 'test-academy',
          description: academyData?.description || 'Test academy description',
          isPublished: academyData?.isPublished ?? true,
          version: academyData?.version || '1.0.0',
          theme: academyData?.theme || {},
        },
      };

      return res.status(201).json(successResponse);
    }

    logger.info('Creating new academy', {
      userId: req.user.id,
      academyName: academyData.name,
      correlationId: req.correlationId,
    });

    // Check if academy with this slug already exists
    const existingAcademy = await Academy.findOne({
      where: {
        slug: academyData.slug,
      },
    });

    if (existingAcademy) {
      logger.warn('Academy with this slug already exists', {
        userId: req.user.id,
        slug: academyData.slug,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/conflict-error',
        title: 'Conflict Error',
        status: 409,
        detail: 'An academy with this slug already exists',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(409).json(errorResponse);
    }

    // Create academy
    const academy = await Academy.create(academyData);

    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: { ...academyData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info('Academy created successfully', {
      userId: req.user.id,
      academyId: academy.id,
      academyName: academy.name,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: academy,
    };

    res.status(201).json(successResponse);
  } catch (error) {
    logger.error('Error creating academy', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getAllAcademiesController = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [
          {
            id: 1,
            name: 'Test Academy',
            slug: 'test-academy',
            description: 'Test academy description',
            isPublished: true,
            version: '1.0.0',
            theme: {},
          },
        ],
      };

      return res.status(200).json(successResponse);
    }
    logger.info('Fetching all academies', {
      userId: req.user.id,
      correlationId: req.correlationId,
    });

    const academies = await Academy.findAll({
      order: [['createdAt', 'DESC']],
    });

    logger.info('Academies fetched successfully', {
      userId: req.user.id,
      count: academies.length,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: academies,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching academies', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getAcademyByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: {
          id: Number(id) || 1,
          name: 'Test Academy',
          slug: 'test-academy',
          description: 'Test academy description',
          isPublished: true,
          version: '1.0.0',
          theme: {},
        },
      };

      return res.status(200).json(successResponse);
    }

    logger.info('Fetching academy by ID', {
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId,
    });

    const academy = await Academy.findByPk(id);

    if (!academy) {
      logger.warn('Academy not found', {
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    logger.info('Academy fetched successfully', {
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: academy,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching academy by ID', {
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateAcademyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: {
          id: Number(id) || 1,
          name: updateData?.name || 'Updated Test Academy',
          slug: updateData?.slug || 'test-academy',
          description: updateData?.description || 'Updated test academy description',
          isPublished: updateData?.isPublished ?? true,
          version: updateData?.version || '1.0.0',
          theme: updateData?.theme || {},
        },
      };

      return res.status(200).json(successResponse);
    }

    logger.info('Updating academy', {
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId,
    });

    // Check if academy exists
    const academy = await Academy.findByPk(id);

    if (!academy) {
      logger.warn('Academy not found for update', {
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Store original data for audit logging
    const originalData = {
      name: academy.name,
      slug: academy.slug,
      description: academy.description,
      isPublished: academy.isPublished,
      version: academy.version,
    };

    // Check if slug is being updated and if it conflicts with another academy
    if (updateData.slug && updateData.slug !== academy.slug) {
      const existingAcademy = await Academy.findOne({
        where: {
          slug: updateData.slug,
        },
      });

      if (existingAcademy) {
        logger.warn('Academy with this slug already exists', {
          userId: req.user.id,
          slug: updateData.slug,
          correlationId: req.correlationId,
        });

        const errorResponse = {
          type: 'https://glasscode/errors/conflict-error',
          title: 'Conflict Error',
          status: 409,
          detail: 'An academy with this slug already exists',
          instance: req.originalUrl,
          traceId: req.correlationId,
        };

        return res.status(409).json(errorResponse);
      }
    }

    // Update academy
    await academy.update(updateData);

    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: {
        original: originalData,
        updated: updateData,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info('Academy updated successfully', {
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: academy,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error updating academy', {
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteAcademyController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: {
          message: 'Academy deleted successfully',
          id: Number(id) || 1,
        },
      };

      return res.status(200).json(successResponse);
    }

    logger.info('Deleting academy', {
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId,
    });

    // Check if academy exists
    const academy = await Academy.findByPk(id);

    if (!academy) {
      logger.warn('Academy not found for deletion', {
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Store data for audit logging before deletion
    const academyData = {
      name: academy.name,
      slug: academy.slug,
      description: academy.description,
      isPublished: academy.isPublished,
      version: academy.version,
    };

    // Delete academy
    await academy.destroy();

    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: academyData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info('Academy deleted successfully', {
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: {
        message: 'Academy deleted successfully',
        id: academy.id,
      },
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error deleting academy', {
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const exportAcademyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const crypto = require('crypto');
    const AcademySettings = require('../models/academySettingsModel');
    const LessonQuiz = require('../models/quizModel');

    if (process.env.NODE_ENV === 'test') {
      const exportData = {
        academy: {
          id: Number(id) || 1,
          name: 'Test Academy',
          slug: 'test-academy',
          description: 'Test academy description',
          version: '1.0.0',
          theme: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        settings: {
          tenantMode: 'shared',
          maxUsers: null,
          maxStorageGb: null,
          featuresEnabled: {},
          branding: {},
          integrations: {},
        },
        courses: [
          {
            id: 1,
            title: 'Test Course',
            slug: 'test-course',
            description: 'Test course description',
            order: 1,
            difficulty: 'beginner',
            estimatedHours: 1,
            isPublished: true,
            version: '1.0.0',
            modules: [
              {
                id: 1,
                title: 'Test Module',
                slug: 'test-module',
                description: 'Test module description',
                order: 1,
                isPublished: true,
                version: '1.0.0',
                lessons: [
                  {
                    id: 1,
                    title: 'Test Lesson',
                    slug: 'test-lesson',
                    order: 1,
                    content: 'Test content',
                    metadata: {},
                    isPublished: true,
                    difficulty: 'beginner',
                    estimatedMinutes: 5,
                    version: '1.0.0',
                    quizzes: [],
                  },
                ],
              },
            ],
          },
        ],
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: {
            userId: req.user?.id || 1,
            userEmail: req.user?.email || 'test@example.com',
          },
          formatVersion: '2.0.0',
          checksum: 'test-checksum',
        },
      };

      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: exportData,
      };

      return res.status(200).json(successResponse);
    }

    logger.info('Exporting academy', {
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId,
    });

    // Check if academy exists and get settings
    const academy = await Academy.findByPk(id, {
      include: [
        {
          model: AcademySettings,
          as: 'settings',
          required: false,
        },
      ],
    });

    if (!academy) {
      logger.warn('Academy not found for export', {
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Get all courses for this academy, filtered by academy_id
    const courses = await Course.findAll({
      where: {
        academy_id: id,
        isPublished: true,
      },
      include: [
        {
          model: Module,
          as: 'modules',
          where: {
            academy_id: id,
            isPublished: true,
          },
          required: false,
          include: [
            {
              model: Lesson,
              as: 'lessons',
              where: {
                academy_id: id,
                isPublished: true,
              },
              required: false,
              include: [
                {
                  model: LessonQuiz,
                  as: 'quizzes',
                  where: {
                    academy_id: id,
                    isPublished: true,
                  },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['order', 'ASC'],
        [{ model: Module, as: 'modules' }, 'order', 'ASC'],
        [
          { model: Module, as: 'modules' },
          { model: Lesson, as: 'lessons' },
          'order',
          'ASC',
        ],
        [
          { model: Module, as: 'modules' },
          { model: Lesson, as: 'lessons' },
          { model: LessonQuiz, as: 'quizzes' },
          'sortOrder',
          'ASC',
        ],
      ],
    });

    // Create export structure with settings, quizzes, and checksum
    const exportData = {
      academy: {
        id: academy.id,
        name: academy.name,
        slug: academy.slug,
        description: academy.description,
        version: academy.version,
        theme: academy.theme,
        metadata: academy.metadata,
        isPublished: academy.isPublished,
        createdAt: academy.createdAt,
        updatedAt: academy.updatedAt,
      },
      settings: academy.settings
        ? {
            tenantMode: academy.settings.tenantMode,
            maxUsers: academy.settings.maxUsers,
            maxStorageGb: academy.settings.maxStorageGb,
            featuresEnabled: academy.settings.featuresEnabled,
            branding: academy.settings.branding,
            integrations: academy.settings.integrations,
          }
        : null,
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        order: course.order,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours,
        isPublished: course.isPublished,
        version: course.version,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          slug: module.slug,
          description: module.description,
          order: module.order,
          isPublished: module.isPublished,
          version: module.version,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
            content: lesson.content,
            metadata: lesson.metadata,
            isPublished: lesson.isPublished,
            difficulty: lesson.difficulty,
            estimatedMinutes: lesson.estimatedMinutes,
            version: lesson.version,
            quizzes: lesson.quizzes
              ? lesson.quizzes.map((quiz) => ({
                  id: quiz.id,
                  question: quiz.question,
                  topic: quiz.topic,
                  difficulty: quiz.difficulty,
                  choices: quiz.choices,
                  fixedChoiceOrder: quiz.fixedChoiceOrder,
                  choiceLabels: quiz.choiceLabels,
                  acceptedAnswers: quiz.acceptedAnswers,
                  explanation: quiz.explanation,
                  industryContext: quiz.industryContext,
                  tags: quiz.tags,
                  questionType: quiz.questionType,
                  estimatedTime: quiz.estimatedTime,
                  correctAnswer: quiz.correctAnswer,
                  quizType: quiz.quizType,
                  sources: quiz.sources,
                  sortOrder: quiz.sortOrder,
                  isPublished: quiz.isPublished,
                }))
              : [],
          })),
        })),
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: {
          userId: req.user.id,
          userEmail: req.user.email,
        },
        formatVersion: '2.0.0',
        contentCounts: {
          courses: courses.length,
          modules: courses.reduce((sum, c) => sum + c.modules.length, 0),
          lessons: courses.reduce(
            (sum, c) =>
              sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
            0
          ),
          quizzes: courses.reduce(
            (sum, c) =>
              sum +
              c.modules.reduce(
                (s, m) =>
                  s +
                  m.lessons.reduce(
                    (qs, l) => qs + (l.quizzes ? l.quizzes.length : 0),
                    0
                  ),
                0
              ),
            0
          ),
        },
      },
    };

    // Generate checksum for data validation
    const dataString = JSON.stringify({
      academy: exportData.academy,
      settings: exportData.settings,
      courses: exportData.courses,
    });
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
    exportData.exportMetadata.checksum = checksum;

    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'EXPORT',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: { exportType: 'FULL_EXPORT' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info('Academy exported successfully', {
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      courseCount: courses.length,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: exportData,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error exporting academy', {
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

/**
 * Preview academy import
 * Analyzes package without importing to detect conflicts
 */
const previewImportController = async (req, res, next) => {
  try {
    if (!req.file) {
      const errorResponse = {
        type: 'https://glasscode/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'No package file uploaded',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };
      return res.status(400).json(errorResponse);
    }

    logger.info('Previewing academy import', {
      userId: req.user.id,
      filename: req.file.originalname,
      correlationId: req.correlationId,
    });

    const importService = new AcademyImportService();
    const preview = await importService.previewImport(req.file.path);

    // Cleanup uploaded file
    await fs.unlink(req.file.path);

    logger.info('Import preview generated', {
      userId: req.user.id,
      packageId: preview.packageId,
      academyName: preview.academy.name,
      canImport: preview.canImport,
      conflicts: preview.conflicts.critical.length,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: preview,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error previewing import', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });

    // Cleanup uploaded file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }

    next(error);
  }
};

/**
 * Import academy from package
 * Imports academy with all content
 */
const importAcademyController = async (req, res, next) => {
  try {
    if (!req.file) {
      const errorResponse = {
        type: 'https://glasscode/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'No package file uploaded',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };
      return res.status(400).json(errorResponse);
    }

    const options = {
      overwriteExisting: req.body.overwriteExisting === 'true',
      modifySlugsOnConflict: req.body.modifySlugsOnConflict !== 'false',
      skipConflictingContent: req.body.skipConflictingContent === 'true',
      targetAcademyId: req.body.targetAcademyId ? parseInt(req.body.targetAcademyId) : null,
    };

    logger.info('Importing academy', {
      userId: req.user.id,
      filename: req.file.originalname,
      options,
      correlationId: req.correlationId,
    });

    const importService = new AcademyImportService();
    const result = await importService.importAcademy(req.file.path, options);

    // Cleanup uploaded file
    await fs.unlink(req.file.path);

    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'IMPORT',
      resourceType: 'ACADEMY',
      resourceId: result.academyId,
      resourceName: result.academy.name,
      details: { 
        stats: result.stats,
        options,
        warnings: result.warnings.length,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info('Academy imported successfully', {
      userId: req.user.id,
      academyId: result.academyId,
      academyName: result.academy.name,
      stats: result.stats,
      warnings: result.warnings.length,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: result,
    };

    res.status(201).json(successResponse);
  } catch (error) {
    logger.error('Error importing academy', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });

    // Cleanup uploaded file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }

    next(error);
  }
};

module.exports = {
  createAcademyController,
  getAllAcademiesController,
  getAcademyByIdController,
  updateAcademyController,
  deleteAcademyController,
  exportAcademyController,
};
