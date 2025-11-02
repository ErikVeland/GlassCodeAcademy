const express = require('express');
const {
  getAllCoursesController,
  getCourseByIdController,
  createCourseController,
  updateCourseController,
  deleteCourseController,
} = require('../controllers/courseController');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const authenticate = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Public routes
router.get('/', generalLimiter, getAllCoursesController);
router.get('/:id', generalLimiter, getCourseByIdController);

// Admin routes (authenticated + authorized)
router.post(
  '/',
  authenticate,
  authorizeRoles(['admin', 'instructor']),
  generalLimiter,
  createCourseController
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(['admin', 'instructor']),
  generalLimiter,
  updateCourseController
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(['admin']),
  generalLimiter,
  deleteCourseController
);

module.exports = router;
