const {
  getModuleById,
  getLessonsByModuleId,
  getAllModules,
} = require('../services/contentService');
const cacheService = require('../services/cacheService');
const { Module, Lesson, LessonQuiz } = require('../models');
const {
  resolveSlug,
  isShortSlug,
  isValidShortSlug,
} = require('../utils/slugMapping');
const winston = require('winston');
const { Op } = require('sequelize');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'module-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const getAllModulesController = async (req, res, next) => {
  try {
    logger.info('Fetching all published modules', {
      correlationId: req.correlationId,
    });

    // Try to get from cache
    const cacheKey = 'modules:all';
    const cachedModules = await cacheService.get(cacheKey);
    if (cachedModules) {
      logger.info('Modules retrieved from cache', {
        count: cachedModules.length,
        correlationId: req.correlationId,
      });
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: cachedModules,
        meta: { cached: true },
      };
      return res.status(200).json(successResponse);
    }

    const modules = await getAllModules();
    logger.info('Modules fetched successfully', {
      count: modules.length,
      correlationId: req.correlationId,
    });

    // Cache for 30 minutes
    await cacheService.set(cacheKey, modules, 1800);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: modules,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching modules list', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getModuleByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info('Fetching module by ID', {
      moduleId: id,
      correlationId: req.correlationId,
    });

    // Try to get from cache
    const cacheKey = `module:${id}`;
    const cachedModule = await cacheService.get(cacheKey);
    if (cachedModule) {
      logger.info('Module retrieved from cache', {
        moduleId: id,
        correlationId: req.correlationId,
      });
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: cachedModule,
        meta: { cached: true },
      };
      return res.status(200).json(successResponse);
    }

    const module = await getModuleById(id);

    if (!module) {
      logger.warn('Module not found', {
        moduleId: id,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Module not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    logger.info('Module fetched successfully', {
      moduleId: id,
      correlationId: req.correlationId,
    });

    // Cache for 1 hour
    await cacheService.set(cacheKey, module, 3600);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: module,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching module by ID', {
      moduleId: req.params.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getLessonsByModuleIdController = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    logger.info('Fetching lessons by module ID', {
      moduleId,
      correlationId: req.correlationId,
    });

    // Try to get from cache
    const cacheKey = `module:${moduleId}:lessons`;
    const cachedLessons = await cacheService.get(cacheKey);
    if (cachedLessons) {
      logger.info('Lessons retrieved from cache', {
        moduleId,
        count: cachedLessons.length,
        correlationId: req.correlationId,
      });
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: cachedLessons,
        meta: { cached: true },
      };
      return res.status(200).json(successResponse);
    }

    const lessons = await getLessonsByModuleId(moduleId);

    logger.info('Lessons fetched successfully', {
      moduleId,
      count: lessons.length,
      correlationId: req.correlationId,
    });

    // Cache for 1 hour
    await cacheService.set(cacheKey, lessons, 3600);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: lessons,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching lessons by module ID', {
      moduleId: req.params.moduleId,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

// Enhanced controller to get quizzes by module slug with better error handling and logging
const getQuizzesByModuleSlugController = async (req, res, next) => {
  try {
    const { slug } = req.params;

    logger.info('Fetching quizzes by module slug', {
      moduleSlug: slug,
      correlationId: req.correlationId,
    });

    // Check if it's a short slug and if it's valid
    if (isShortSlug(slug) && !isValidShortSlug(slug)) {
      logger.warn('Invalid short slug provided', {
        moduleSlug: slug,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Module not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    // Resolve short slug to full slug if needed
    const resolvedSlug = resolveSlug(slug);

    // First find the module by slug
    const module = await Module.findOne({
      where: {
        slug: resolvedSlug,
      },
    });

    if (!module) {
      logger.warn('Module not found when fetching quizzes', {
        moduleSlug: slug,
        resolvedSlug,
        correlationId: req.correlationId,
      });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Module not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    logger.info('Module found, fetching lessons', {
      moduleSlug: slug,
      resolvedSlug,
      moduleId: module.id,
      correlationId: req.correlationId,
    });

    // Get all lessons for this module
    const lessons = await Lesson.findAll({
      where: {
        module_id: module.id,
        isPublished: true,
      },
      order: [['order', 'ASC']],
    });

    logger.info('Lessons fetched, fetching quizzes', {
      moduleSlug: slug,
      resolvedSlug,
      lessonCount: lessons.length,
      correlationId: req.correlationId,
    });

    // Get all quizzes for all lessons
    const lessonIds = lessons.map((lesson) => lesson.id);

    if (lessonIds.length === 0) {
      logger.warn('No lessons found for module, returning empty quiz array', {
        moduleSlug: slug,
        resolvedSlug,
        moduleId: module.id,
        correlationId: req.correlationId,
      });

      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [],
      };

      return res.status(200).json(successResponse);
    }

    logger.info('About to call LessonQuiz.findAll', {
      lessonIds,
      correlationId: req.correlationId,
    });

    const quizzes = await LessonQuiz.findAll({
      where: {
        lesson_id: { [Op.in]: lessonIds },
        isPublished: true,
      },
      order: [['sort_order', 'ASC']],
    });

    logger.info('Quizzes fetched successfully', {
      moduleSlug: slug,
      resolvedSlug,
      quizCount: quizzes.length,
      correlationId: req.correlationId,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: quizzes,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching quizzes by module slug', {
      moduleSlug: req.params.slug,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getAllModulesController,
  getModuleByIdController,
  getLessonsByModuleIdController,
  getQuizzesByModuleSlugController,
};
