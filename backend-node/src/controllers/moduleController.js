const { getModuleById, getLessonsByModuleId, getAllModules } = require('../services/contentService');
const { Module, Lesson, LessonQuiz } = require('../models');
const { resolveSlug, isShortSlug, isValidShortSlug } = require('../utils/slugMapping');
const winston = require('winston');

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
      format: winston.format.simple()
    })
  ]
});

const getAllModulesController = async (req, res) => {
  try {
    logger.info('Fetching all published modules');
    const modules = await getAllModules();
    logger.info('Modules fetched successfully', { count: modules.length });
    res.status(200).json(modules);
  } catch (error) {
    logger.error('Error fetching modules list', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching modules.'
      }
    });
  }
};

const getModuleByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Fetching module by ID', { moduleId: id });
    
    const module = await getModuleById(id);
    
    if (!module) {
      logger.warn('Module not found', { moduleId: id });
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Module not found'
        }
      });
    }
    
    logger.info('Module fetched successfully', { moduleId: id });
    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    logger.error('Error fetching module by ID', { 
      moduleId: req.params.id, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const getLessonsByModuleIdController = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    logger.info('Fetching lessons by module ID', { moduleId });
    
    const lessons = await getLessonsByModuleId(moduleId);
    
    logger.info('Lessons fetched successfully', { moduleId, count: lessons.length });
    res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    logger.error('Error fetching lessons by module ID', { 
      moduleId: req.params.moduleId, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

// Enhanced controller to get quizzes by module slug with better error handling and logging
const getQuizzesByModuleSlugController = async (req, res) => {
  try {
    const { slug } = req.params;
    
    logger.info('Fetching quizzes by module slug', { moduleSlug: slug });
    
    // Check if it's a short slug and if it's valid
    if (isShortSlug(slug) && !isValidShortSlug(slug)) {
      logger.warn('Invalid short slug provided', { moduleSlug: slug });
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Module not found'
        }
      });
    }
    
    // Resolve short slug to full slug if needed
    const resolvedSlug = resolveSlug(slug);
    
    // First find the module by slug
    const module = await Module.findOne({
      where: {
        slug: resolvedSlug
      }
    });
    
    if (!module) {
      logger.warn('Module not found when fetching quizzes', { moduleSlug: slug, resolvedSlug });
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Module not found'
        }
      });
    }
    
    logger.info('Module found, fetching lessons', { moduleSlug: slug, resolvedSlug, moduleId: module.id });
    
    // Get all lessons for this module
    const lessons = await Lesson.findAll({
      where: {
        module_id: module.id,
        isPublished: true
      },
      order: [['order', 'ASC']]
    });
    
    logger.info('Lessons fetched, fetching quizzes', { moduleSlug: slug, resolvedSlug, lessonCount: lessons.length });
    
    // Get all quizzes for all lessons
    const lessonIds = lessons.map(lesson => lesson.id);
    
    if (lessonIds.length === 0) {
      logger.warn('No lessons found for module, returning empty quiz array', { moduleSlug: slug, resolvedSlug, moduleId: module.id });
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const quizzes = await LessonQuiz.findAll({
      where: {
        lesson_id: lessonIds,
        isPublished: true
      },
      order: [['sort_order', 'ASC']]
    });
    
    logger.info('Quizzes fetched successfully', { moduleSlug: slug, resolvedSlug, quizCount: quizzes.length });
    
    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    logger.error('Error fetching quizzes by module slug', { 
      moduleSlug: req.params.slug, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching quizzes. Please try again later.'
      }
    });
  }
};

module.exports = {
  getAllModulesController,
  getModuleByIdController,
  getLessonsByModuleIdController,
  getQuizzesByModuleSlugController
};