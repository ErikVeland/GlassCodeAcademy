const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getFaqs,
  getFaq,
  getFaqCategoriesHandler,
  createFaqHandler,
  updateFaqHandler,
  deleteFaqHandler,
  getAllFaqsHandler,
  reorderFaqsHandler,
  recordFaqFeedbackHandler,
} = require('../controllers/faqController');

// Public routes
router.get('/', getFaqs);
router.get('/categories', getFaqCategoriesHandler);
router.get('/:id', getFaq);

// Feedback route (no authentication required)
router.post('/:id/feedback', recordFaqFeedbackHandler);

// Admin routes
router.use(authenticateToken);

router.post('/', requireAdmin, createFaqHandler);
router.put('/:id', requireAdmin, updateFaqHandler);
router.delete('/:id', requireAdmin, deleteFaqHandler);

router.get('/admin/all', requireAdmin, getAllFaqsHandler);
router.put('/admin/reorder', requireAdmin, reorderFaqsHandler);

module.exports = router;
