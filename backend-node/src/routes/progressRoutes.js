const express = require('express');
const {
  getUserCourseProgressController,
  updateUserLessonProgressController,
  getUserLessonProgressController,
  getCourseLessonProgressController,
  getUserQuizStatisticsController,
  getLeaderboardController,
} = require('../controllers/progressController');
const authenticate = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Routes
router.get(
  '/courses/:courseId',
  authenticate,
  generalLimiter,
  getUserCourseProgressController
);
router.post(
  '/lessons/:lessonId',
  authenticate,
  generalLimiter,
  updateUserLessonProgressController
);
router.get(
  '/lessons/:lessonId',
  authenticate,
  generalLimiter,
  getUserLessonProgressController
);

// New routes for enhanced progress tracking
router.get(
  '/courses/:courseId/lessons',
  authenticate,
  generalLimiter,
  getCourseLessonProgressController
);

router.get(
  '/quiz-statistics',
  authenticate,
  generalLimiter,
  getUserQuizStatisticsController
);

router.get(
  '/leaderboard',
  authenticate,
  generalLimiter,
  getLeaderboardController
);

module.exports = router;
