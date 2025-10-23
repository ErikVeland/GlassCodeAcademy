const express = require('express');
const { getAllTiersController } = require('../controllers/tierController');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.get('/', generalLimiter, getAllTiersController);

module.exports = router;