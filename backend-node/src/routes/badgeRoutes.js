const express = require('express');
const {
  getAllBadgesController,
  getUserBadgesController,
  awardBadgeToUserController,
  checkAndAwardProgressBadgesController,
  createBadgeController,
  updateBadgeController,
  deleteBadgeController,
} = require('../controllers/badgeController');
const authenticate = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Public routes
router.get('/', generalLimiter, getAllBadgesController);

// User routes (authenticated)
router.get('/my-badges', authenticate, generalLimiter, getUserBadgesController);

// Get badges for a specific user (public or admin)
router.get(
  '/user/:userId',
  authenticate,
  generalLimiter,
  getUserBadgesController
);

router.post(
  '/check-progress',
  authenticate,
  generalLimiter,
  checkAndAwardProgressBadgesController
);

// Admin routes (authenticated + authorized)
router.post(
  '/',
  authenticate,
  authorizeRoles(['admin']),
  generalLimiter,
  createBadgeController
);

router.put(
  '/:badgeId',
  authenticate,
  authorizeRoles(['admin']),
  generalLimiter,
  updateBadgeController
);

router.delete(
  '/:badgeId',
  authenticate,
  authorizeRoles(['admin']),
  generalLimiter,
  deleteBadgeController
);

// Award badge to user (admin only)
router.post(
  '/award/:userId/:badgeId',
  authenticate,
  authorizeRoles(['admin']),
  generalLimiter,
  awardBadgeToUserController
);

module.exports = router;
