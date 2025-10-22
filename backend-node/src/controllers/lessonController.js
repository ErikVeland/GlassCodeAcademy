const { getLessonById, getQuizzesByLessonId } = require('../services/contentService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lesson-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const getLessonByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Fetching lesson by ID', { lessonId: id });
    
    const lesson = await getLessonById(id);
    
    if (!lesson) {
      logger.warn('Lesson not found', { lessonId: id });
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Lesson not found'
        }
      });
    }
    
    logger.info('Lesson fetched successfully', { lessonId: id });
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    logger.error('Error fetching lesson by ID', { 
      lessonId: req.params.id,
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

const getLessonQuizzesController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    logger.info('Fetching quizzes by lesson ID', { lessonId });
    
    const quizzes = await getQuizzesByLessonId(lessonId);
    
    logger.info('Quizzes fetched successfully', { lessonId, quizCount: quizzes.length });
    
    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    logger.error('Error fetching quizzes by lesson ID', { 
      lessonId: req.params.lessonId,
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

module.exports = {
  getLessonByIdController,
  getLessonQuizzesController
};