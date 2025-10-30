const { 
  getUserCourseProgress, 
  updateUserLessonProgress, 
  getUserLessonProgress 
} = require('../services/progressService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'progress-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const getUserCourseProgressController = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const progress = await getUserCourseProgress(userId, courseId);
    
    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress || {}
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateUserLessonProgressController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    const progress = await updateUserLessonProgress(userId, lessonId, updates);
    
    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getUserLessonProgressController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    
    const progress = await getUserLessonProgress(userId, lessonId);
    
    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress || {}
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getUserCourseProgressController,
  updateUserLessonProgressController,
  getUserLessonProgressController
};