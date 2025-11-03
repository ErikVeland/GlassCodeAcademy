const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  createReportHandler,
  getReportsHandler,
  getReportByIdHandler,
  updateReportStatusHandler,
  getUserReportHistoryHandler,
  getReportsByTargetHandler,
} = require('../controllers/reportController');

// Authenticated routes for users
router.use(authenticateToken);

// Create a new report
router.post('/', createReportHandler);

// Get user's report history
router.get('/my-reports', getUserReportHistoryHandler);

// Get reports by target
router.get('/target/:targetType/:targetId', getReportsByTargetHandler);

// Admin routes
router.use(requireAdmin);

// Get all reports
router.get('/', getReportsHandler);

// Get report by ID
router.get('/:id', getReportByIdHandler);

// Update report status
router.put('/:id/status', updateReportStatusHandler);

module.exports = router;
