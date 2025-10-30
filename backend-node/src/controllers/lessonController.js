const {
  getLessonById,
  getQuizzesByLessonId,
  getModuleById,
} = require('../services/contentService');
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
      format: winston.format.simple(),
    }),
  ],
});

const getLessonByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info('Fetching lesson by ID', { lessonId: id });

    const lesson = await getLessonById(id);

    if (!lesson) {
      logger.warn('Lesson not found', { lessonId: id });

      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Lesson not found',
        instance: req.originalUrl,
        traceId: req.correlationId,
      };

      return res.status(404).json(errorResponse);
    }

    logger.info('Lesson fetched successfully', { lessonId: id });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: lesson,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching lesson by ID', {
      lessonId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getLessonQuizzesController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    logger.info('Fetching quizzes by lesson ID', { lessonId });

    const quizzes = await getQuizzesByLessonId(lessonId);

    // If no quizzes found in DB, return empty array
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      logger.info('No quizzes found for lesson', { lessonId });

      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [],
      };

      return res.status(200).json(successResponse);
    }

    // Ensure all quiz IDs are valid positive integers
    const validQuizzes = quizzes.filter((quiz) => {
      const isValid = quiz.id && Number.isInteger(quiz.id) && quiz.id > 0;
      if (!isValid) {
        logger.warn('Invalid quiz ID detected', {
          lessonId,
          quizId: quiz.id,
          quizQuestion: quiz.question?.substring(0, 50),
        });
      }
      return isValid;
    });

    logger.info('Quizzes fetched successfully', {
      lessonId,
      quizCount: validQuizzes.length,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: validQuizzes,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching quizzes by lesson ID', {
      lessonId: req.params.lessonId,
      error: error.message,
      stack: error.stack,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getLessonByIdController,
  getLessonQuizzesController,
};
