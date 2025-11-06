const express = require('express');
const {
  getAggregateStatsController,
} = require('../controllers/statsController');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Aggregate stats endpoint
router.get('/aggregate', generalLimiter, getAggregateStatsController);

module.exports = router;
