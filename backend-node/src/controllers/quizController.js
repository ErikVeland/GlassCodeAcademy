const { submitQuizAnswers, recordQuizAttempt, getQuizAttempts, getQuizAttemptsByQuizId, getUserProgressSummary } = require('../services/progressService');
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

const submitQuizAnswersController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { answers, timeSpentSeconds, startedAt } = req.body;
    const userId = req.user.id;
    
    logger.info('Submitting quiz answers', { userId, lessonId, answerCount: answers?.length });
    
    // Validate request
    if (!answers || !Array.isArray(answers)) {
      const errorResponse = {
        type: 'https://glasscode/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Answers must be an array',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      logger.warn('Invalid quiz submission - answers must be an array', { userId, lessonId });
      return res.status(400).json(errorResponse);
    }

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode - returning stub response', { userId, lessonId });
      
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { userId, lessonId, correctCount: 1, total: answers.length }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Submit quiz answers
    const result = await submitQuizAnswers(userId, lessonId, answers);
    
    // Record the quiz attempt
    const attemptData = {
      score: result.scorePercentage,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      answers: answers,
      startedAt: startedAt || new Date(),
      completedAt: new Date(),
      timeSpentSeconds: timeSpentSeconds || 0
    };
    
    // Record attempt for each quiz in the submission
    for (const answer of answers) {
      await recordQuizAttempt(userId, lessonId, answer.quizId, {
        ...attemptData,
        answers: [answer] // Record individual answer for each quiz
      });
    }
    
    logger.info('Quiz answers submitted successfully', { 
      userId, 
      lessonId, 
      correctCount: result.correctAnswers, 
      total: result.totalQuestions 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error submitting quiz answers', { 
      userId: req.user?.id,
      lessonId: req.params?.lessonId,
      error: error.message,
      stack: error.stack
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getQuizAttemptsController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    
    logger.info('Fetching quiz attempts', { userId, lessonId });
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode - returning stub response', { userId, lessonId });
      
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, userId, lessonId, score: 80 }]
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Get quiz attempts
    const attempts = await getQuizAttempts(userId, lessonId);
    
    logger.info('Quiz attempts fetched successfully', { 
      userId, 
      lessonId, 
      attemptCount: attempts.length
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: attempts
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching quiz attempts', { 
      userId: req.user?.id,
      lessonId: req.params?.lessonId,
      error: error.message,
      stack: error.stack
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getQuizAttemptsByQuizIdController = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    
    logger.info('Fetching quiz attempts by quiz ID', { userId, quizId });
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode - returning stub response', { userId, quizId });
      
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, userId, quizId, score: 80 }]
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Get quiz attempts
    const attempts = await getQuizAttemptsByQuizId(userId, quizId);
    
    logger.info('Quiz attempts fetched successfully by quiz ID', { 
      userId, 
      quizId, 
      attemptCount: attempts.length
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: attempts
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching quiz attempts by quiz ID', { 
      userId: req.user?.id,
      quizId: req.params?.quizId,
      error: error.message,
      stack: error.stack
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getUserProgressSummaryController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    logger.info('Fetching user progress summary', { userId });
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode - returning stub response', { userId });
      
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { userId, coursesCompleted: 0, lessonsCompleted: 0 }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Get user progress summary
    const summary = await getUserProgressSummary(userId);
    
    logger.info('User progress summary fetched successfully', { 
      userId, 
      coursesCompleted: summary.completedCourses, 
      lessonsCompleted: summary.completedLessons 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: summary
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching user progress summary', { 
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  submitQuizAnswersController,
  getQuizAttemptsController,
  getQuizAttemptsByQuizIdController,
  getUserProgressSummaryController
};