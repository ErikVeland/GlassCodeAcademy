const {
  getLessonById,
  getQuizzesByLessonId,
} = require('../services/contentService');

const getLessonByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    const quizzes = await getQuizzesByLessonId(lessonId);

    // If no quizzes found in DB, return empty array
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
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