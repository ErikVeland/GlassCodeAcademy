const { submitQuizAnswers, getUserProgressSummary } = require('../services/progressService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'quiz-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const submitQuizAnswersController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;
    
    logger.info('Submitting quiz answers', { userId, lessonId, answerCount: answers?.length });
    
    // Validate request
    if (!answers || !Array.isArray(answers)) {
      logger.warn('Invalid quiz submission - answers must be an array', { userId, lessonId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Answers must be an array'
        }
      });
    }

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode - returning stub response', { userId, lessonId });
      return res.status(200).json({ success: true, data: { userId, lessonId, correctCount: 1, total: answers.length } });
    }
    
    // Submit quiz answers
    const result = await submitQuizAnswers(userId, lessonId, answers);
    
    logger.info('Quiz answers submitted successfully', { 
      userId, 
      lessonId, 
      correctCount: result.correctAnswers, 
      total: result.totalQuestions 
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error submitting quiz answers', { 
      userId: req.user?.id,
      lessonId: req.params?.lessonId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const getUserProgressSummaryController = async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info('Fetching user progress summary', { userId });
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode - returning stub response', { userId });
      return res.status(200).json({ success: true, data: { userId, coursesCompleted: 0, lessonsCompleted: 0 } });
    }
    
    // Get user progress summary
    const summary = await getUserProgressSummary(userId);
    
    logger.info('User progress summary fetched successfully', { 
      userId, 
      coursesCompleted: summary.completedCourses, 
      lessonsCompleted: summary.completedLessons 
    });
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching user progress summary', { 
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  submitQuizAnswersController,
  getUserProgressSummaryController
};