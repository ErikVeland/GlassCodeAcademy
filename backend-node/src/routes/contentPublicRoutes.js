const express = require('express');
const { Op } = require('sequelize');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const Module = require('../models/moduleModel');
const Lesson = require('../models/lessonModel');
const LessonQuiz = require('../models/quizModel');

const router = express.Router();

// Public: Get quizzes for a module by slug
router.get('/quizzes/:slug', generalLimiter, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const module = await Module.findOne({ where: { slug } });
    if (!module) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'https://glasscode/errors/not-found',
          title: 'Module Not Found',
          status: 404,
          detail: `No module found for slug '${slug}'`,
        },
      });
    }

    const lessons = await Lesson.findAll({
      where: { moduleId: module.id },
      order: [['order', 'ASC']],
      attributes: ['id', 'slug', 'order'],
    });

    if (!lessons || lessons.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          module: { id: module.id, slug: module.slug, title: module.title },
          lessons: 0,
          quizzes: [],
          total: 0,
        },
      });
    }

    const lessonIds = lessons.map((l) => l.id);
    const quizzes = await LessonQuiz.findAll({
      where: { lesson_id: { [Op.in]: lessonIds } },
      order: [['sortOrder', 'ASC']],
      attributes: [
        'id',
        'question',
        'choices',
        'difficulty',
        'sortOrder',
        'quizType',
        'lesson_id',
      ],
    });

    // Do not expose correct answers on public route
    const sanitized = quizzes.map((q) => ({
      id: q.id,
      question: q.question,
      choices: q.choices,
      difficulty: q.difficulty,
      sortOrder: q.sortOrder,
      quizType: q.quizType,
      lessonId: q.get('lesson_id'),
    }));

    return res.status(200).json({
      success: true,
      data: {
        module: { id: module.id, slug: module.slug, title: module.title },
        lessons: lessons.length,
        quizzes: sanitized,
        total: sanitized.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
