const express = require('express');
const {
  getProfileController,
  updateProfileController,
} = require('../controllers/profileController');
const authenticate = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  username: Joi.string().optional().min(3).max(50),
});

// Routes
router.get('/profile', authenticate, generalLimiter, getProfileController);
router.put(
  '/profile',
  authenticate,
  generalLimiter,
  validate(updateProfileSchema),
  updateProfileController
);

module.exports = router;
