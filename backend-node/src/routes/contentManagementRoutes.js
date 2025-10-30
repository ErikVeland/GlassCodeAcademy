const express = require('express');
const {
  // Course routes
  createCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,

  // Module routes
  createModuleController,
  getModulesByCourseIdController,
  getModuleByIdController,
  updateModuleController,
  deleteModuleController,

  // Lesson routes
  createLessonController,
  getLessonsByModuleIdController,
  getLessonByIdController,
  updateLessonController,
  deleteLessonController,

  // Quiz routes
  createQuizController,
  getQuizzesByLessonIdController,
  getQuizByIdController,
  updateQuizController,
  deleteQuizController,
} = require('../controllers/contentManagementController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// All content management routes require admin authorization
router.use(authenticate, authorize('admin'));

// Course routes
router.post('/courses', generalLimiter, createCourseController);
router.get('/courses', generalLimiter, getAllCoursesController);
router.get('/courses/:id', generalLimiter, getCourseByIdController);
router.put('/courses/:id', generalLimiter, updateCourseController);
router.delete('/courses/:id', generalLimiter, deleteCourseController);

// Module routes
router.post(
  '/courses/:courseId/modules',
  generalLimiter,
  createModuleController
);
router.get(
  '/courses/:courseId/modules',
  generalLimiter,
  getModulesByCourseIdController
);
router.get('/modules/:id', generalLimiter, getModuleByIdController);
router.put('/modules/:id', generalLimiter, updateModuleController);
router.delete('/modules/:id', generalLimiter, deleteModuleController);

// Lesson routes
router.post(
  '/modules/:moduleId/lessons',
  generalLimiter,
  createLessonController
);
router.get(
  '/modules/:moduleId/lessons',
  generalLimiter,
  getLessonsByModuleIdController
);
router.get('/lessons/:id', generalLimiter, getLessonByIdController);
router.put('/lessons/:id', generalLimiter, updateLessonController);
router.delete('/lessons/:id', generalLimiter, deleteLessonController);

// Quiz routes
router.post('/lessons/:lessonId/quizzes', generalLimiter, createQuizController);
router.get(
  '/lessons/:lessonId/quizzes',
  generalLimiter,
  getQuizzesByLessonIdController
);
router.get('/quizzes/:id', generalLimiter, getQuizByIdController);
router.put('/quizzes/:id', generalLimiter, updateQuizController);
router.delete('/quizzes/:id', generalLimiter, deleteQuizController);

module.exports = router;
