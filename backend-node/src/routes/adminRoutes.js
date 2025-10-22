const express = require('express');
const { 
  getAllUsersController,
  getUserByIdController,
  assignRoleToUserController,
  removeRoleFromUserController,
  getAllRolesController
} = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const assignRoleSchema = Joi.object({
  userId: Joi.number().integer().required(),
  roleId: Joi.number().integer().required()
});

const removeRoleSchema = Joi.object({
  userId: Joi.number().integer().required(),
  roleId: Joi.number().integer().required()
});

// Routes
router.get('/users', authenticate, authorize('admin'), generalLimiter, getAllUsersController);
router.get('/users/:id', authenticate, authorize('admin'), generalLimiter, getUserByIdController);
router.post('/users/roles', authenticate, authorize('admin'), generalLimiter, validate(assignRoleSchema), assignRoleToUserController);
router.delete('/users/roles', authenticate, authorize('admin'), generalLimiter, validate(removeRoleSchema), removeRoleFromUserController);
router.get('/roles', authenticate, authorize('admin'), generalLimiter, getAllRolesController);

module.exports = router;