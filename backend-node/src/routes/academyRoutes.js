const express = require('express');
const {
  createAcademyController,
  getAllAcademiesController,
  getAcademyByIdController,
  updateAcademyController,
  deleteAcademyController,
  exportAcademyController,
} = require('../controllers/academyController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createAcademySchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  slug: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).optional(),
  isPublished: Joi.boolean().optional(),
  version: Joi.string().max(20).optional(),
  theme: Joi.object().optional(),
});

const updateAcademySchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  slug: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  isPublished: Joi.boolean().optional(),
  version: Joi.string().max(20).optional(),
  theme: Joi.object().optional(),
});

// Routes with RBAC enforcement
// Only admin and instructor roles can access academy management endpoints
router.post(
  '/',
  authenticate,
  authorize('admin', 'instructor'),
  generalLimiter,
  validate(createAcademySchema),
  createAcademyController
);
router.get(
  '/',
  authenticate,
  authorize('admin', 'instructor'),
  generalLimiter,
  getAllAcademiesController
);
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'instructor'),
  generalLimiter,
  getAcademyByIdController
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'instructor'),
  generalLimiter,
  validate(updateAcademySchema),
  updateAcademyController
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  generalLimiter,
  deleteAcademyController
);
router.get(
  '/:id/export',
  authenticate,
  authorize('admin', 'instructor'),
  generalLimiter,
  exportAcademyController
);

module.exports = router;
