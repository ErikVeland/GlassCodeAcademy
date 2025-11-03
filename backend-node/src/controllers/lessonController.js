const {
  getLessonById,
  getQuizzesByLessonId,
} = require('../services/contentService');
const cacheService = require('../services/cacheService');

const getLessonByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cacheKey = `lesson:${id}`;
    const cachedLesson = await cacheService.get(cacheKey);
    if (cachedLesson) {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: cachedLesson,
        meta: { cached: true },
      };
      return res.status(200).json(successResponse);
    }

    const lesson = await getLessonById(id);

    if (!lesson) {
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

    // Cache lesson content aggressively (2 hours) as it rarely changes
    await cacheService.set(cacheKey, lesson, 7200);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: lesson,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getLessonQuizzesController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    // Try to get from cache
    const cacheKey = `lesson:${lessonId}:quizzes`;
    const cachedQuizzes = await cacheService.get(cacheKey);
    if (cachedQuizzes) {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: cachedQuizzes,
        meta: { cached: true },
      };
      return res.status(200).json(successResponse);
    }

    const quizzes = await getQuizzesByLessonId(lessonId);

    // If no quizzes found in DB, return empty array
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      // Cache empty result for shorter time (30 minutes)
      await cacheService.set(cacheKey, [], 1800);

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
      return isValid;
    });

    // Cache quizzes for 1 hour
    await cacheService.set(cacheKey, validQuizzes, 3600);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: validQuizzes,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getLessonByIdController,
  getLessonQuizzesController,
};
