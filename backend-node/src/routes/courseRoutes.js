const express = require('express');
const { 
  getAllCoursesController, 
  getCourseByIdController 
} = require('../controllers/courseController');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Routes
router.get('/', generalLimiter, getAllCoursesController);
router.get('/:id', generalLimiter, getCourseByIdController);

module.exports = router;