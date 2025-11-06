const cacheService = require('../services/cacheService');
const {
  Module,
  Lesson,
  LessonQuiz,
  Academy,
  initializeAssociations,
} = require('../models');
const { Sequelize } = require('sequelize');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'stats-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Helper to build aggregate stats
async function computeAggregateStats() {
  // Ensure associations are initialized once
  try {
    initializeAssociations();
  } catch {
    // ignore if already initialized
  }

  // Get the default academy
  const defaultAcademy = await Academy.findOne({
    where: { slug: 'glasscode-academy' },
  });

  if (!defaultAcademy) {
    throw new Error('Default academy not found');
  }

  // Totals - filtered by academy association
  const [totalModules, totalLessons, totalQuizzes] = await Promise.all([
    Module.count({
      where: { isPublished: true, academyId: defaultAcademy.id },
    }),
    Lesson.count({
      where: { isPublished: true, academyId: defaultAcademy.id },
    }),
    LessonQuiz.count({
      where: { isPublished: true, academyId: defaultAcademy.id },
    }),
  ]);

  // Average completion time: mean of per-item estimated minutes
  const lessonsTimeRow = await Lesson.findOne({
    where: { isPublished: true, academyId: defaultAcademy.id },
    attributes: [
      [
        Sequelize.fn(
          'COALESCE',
          Sequelize.fn('SUM', Sequelize.col('estimated_minutes')),
          0
        ),
        'sum_minutes',
      ],
    ],
    raw: true,
  });
  const quizzesTimeRow = await LessonQuiz.findOne({
    where: { isPublished: true, academyId: defaultAcademy.id },
    attributes: [
      [
        Sequelize.fn(
          'COALESCE',
          Sequelize.fn('SUM', Sequelize.col('estimated_time')),
          0
        ),
        'sum_seconds',
      ],
    ],
    raw: true,
  });
  const totalLessonMinutes = parseInt(lessonsTimeRow?.sum_minutes || 0, 10);
  const totalQuizSeconds = parseInt(quizzesTimeRow?.sum_seconds || 0, 10);
  const totalItems = totalLessons + totalQuizzes;
  const averageCompletionTime =
    totalItems > 0
      ? Math.round(
          (totalLessonMinutes + Math.round(totalQuizSeconds / 60)) / totalItems
        )
      : 0;

  // Module breakdown: lessons and quizzes per module - filtered by academy
  const modules = await Module.findAll({
    where: { isPublished: true, academyId: defaultAcademy.id },
    attributes: ['id', 'title', 'slug', 'order'],
    order: [['order', 'ASC']],
    raw: true,
  });

  const lessonCounts = await Lesson.findAll({
    where: { isPublished: true, academyId: defaultAcademy.id },
    attributes: [
      ['module_id', 'moduleId'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'lessons'],
    ],
    group: ['module_id'],
    raw: true,
  });
  const lessonCountMap = new Map(
    lessonCounts.map((r) => [r.moduleId, parseInt(r.lessons, 10)])
  );

  // Quizzes per module: group by lesson.module_id - filtered by academy
  const quizCounts = await LessonQuiz.findAll({
    where: { isPublished: true, academyId: defaultAcademy.id },
    include: [{ model: Lesson, as: 'lesson', attributes: [] }],
    attributes: [
      [Sequelize.col('lesson.module_id'), 'moduleId'],
      [Sequelize.fn('COUNT', Sequelize.col('LessonQuiz.id')), 'quizzes'],
    ],
    group: ['lesson.module_id'],
    raw: true,
  });
  const quizCountMap = new Map(
    quizCounts.map((r) => [r.moduleId, parseInt(r.quizzes, 10)])
  );

  const moduleBreakdown = modules.map((m) => ({
    name: m.title || m.slug,
    lessons: lessonCountMap.get(m.id) || 0,
    questions: quizCountMap.get(m.id) || 0,
    // color left to frontend palette management
    color: '#3B82F6',
  }));

  return {
    totalLessons,
    totalQuizzes,
    totalModules,
    totalQuestions: totalQuizzes,
    averageCompletionTime,
    difficultyBreakdown: { beginner: 0, intermediate: 0, advanced: 0 },
    moduleBreakdown,
    tierBreakdown: { foundational: 0, core: 0, specialized: 0, quality: 0 },
    topicDistribution: {},
  };
}

// GET /api/stats/aggregate
const getAggregateStatsController = async (req, res, next) => {
  try {
    logger.info('Fetching aggregate stats', {
      correlationId: req.correlationId,
    });

    const cacheKey = 'stats:aggregate';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Aggregate stats from cache', {
        correlationId: req.correlationId,
      });
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: cached,
        meta: { cached: true },
      };
      return res.status(200).json(successResponse);
    }

    const stats = await computeAggregateStats();

    // Cache for 5 minutes
    await cacheService.set(cacheKey, stats, 300);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: stats,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error computing aggregate stats', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
    });
    next(error);
  }
};

module.exports = {
  getAggregateStatsController,
  computeAggregateStats, // Export for testing
};
