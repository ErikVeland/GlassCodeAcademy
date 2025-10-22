const express = require('express');
const { getModuleByIdController, getLessonsByModuleIdController, getQuizzesByModuleSlugController } = require('../controllers/moduleController');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Routes
router.get('/:id', generalLimiter, getModuleByIdController);
router.get('/:moduleId/lessons', generalLimiter, getLessonsByModuleIdController);
// Add new route to get quizzes by module slug
router.get('/:slug/quiz', generalLimiter, getQuizzesByModuleSlugController);

module.exports = router;