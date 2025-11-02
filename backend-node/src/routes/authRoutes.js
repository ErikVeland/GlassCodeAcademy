const express = require('express');
const {
  registerController,
  loginController,
  getMeController,
} = require('../controllers/authController');
const { strictLimiter } = require('../middleware/rateLimitMiddleware');
const authenticate = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Routes
router.post(
  '/register',
  strictLimiter,
  validate(registerSchema),
  registerController
);
router.post('/login', strictLimiter, validate(loginSchema), loginController);
router.get('/me', authenticate, getMeController);
router.use('/password', require('./passwordResetRoutes'));

module.exports = router;
