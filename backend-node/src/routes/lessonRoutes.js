const express = require('express');
const {
  getLessonByIdController,
  getLessonQuizzesController,
} = require('../controllers/lessonController');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Routes
router.get('/:id', generalLimiter, getLessonByIdController);
router.get('/:lessonId/quizzes', generalLimiter, getLessonQuizzesController);

module.exports = router;
