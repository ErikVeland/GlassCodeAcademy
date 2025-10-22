const express = require('express');
const { 
  getUserCourseProgressController,
  updateUserLessonProgressController,
  getUserLessonProgressController
} = require('../controllers/progressController');
const authenticate = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Routes
router.get('/courses/:courseId', authenticate, generalLimiter, getUserCourseProgressController);
router.post('/lessons/:lessonId', authenticate, generalLimiter, updateUserLessonProgressController);
router.get('/lessons/:lessonId', authenticate, generalLimiter, getUserLessonProgressController);

module.exports = router;