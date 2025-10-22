const express = require('express');
const { 
  requestPasswordResetController,
  resetPasswordController
} = require('../controllers/passwordResetController');
const { strictLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Routes
router.post('/request-reset', strictLimiter, validate(requestPasswordResetSchema), requestPasswordResetController);
router.post('/reset', strictLimiter, validate(resetPasswordSchema), resetPasswordController);

module.exports = router;