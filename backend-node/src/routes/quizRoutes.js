const express = require('express');
const { 
  submitQuizAnswersController,
  getUserProgressSummaryController
} = require('../controllers/quizController');
const authenticate = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const submitQuizAnswersSchema = Joi.object({
  answers: Joi.array().items(Joi.object({
    quizId: Joi.number().integer().required(),
    selectedAnswer: Joi.number().integer().optional(),
    userAnswer: Joi.string().optional()
  })).required()
});

// Routes
router.post('/lessons/:lessonId/submit', authenticate, generalLimiter, validate(submitQuizAnswersSchema), submitQuizAnswersController);
router.get('/summary', authenticate, generalLimiter, getUserProgressSummaryController);

module.exports = router;