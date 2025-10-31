const {
  getPublishedFaqs,
  getFaqById,
  getAllFaqs,
  getFaqCategories,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  recordFaqFeedback,
} = require('../services/faqService');
const logger = require('../utils/logger');

/**
 * FAQ Controller
 * Handles HTTP requests for FAQ management
 */

/**
 * Get published FAQs
 * GET /api/faqs
 */
async function getFaqs(req, res) {
  try {
    const { category, limit, offset } = req.query;

    const faqs = await getPublishedFaqs({
      category,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    logger.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message,
    });
  }
}

/**
 * Get FAQ by ID
 * GET /api/faqs/:id
 */
async function getFaq(req, res) {
  try {
    const { id } = req.params;

    const faq = await getFaqById(id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    logger.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error.message,
    });
  }
}

/**
 * Get FAQ categories
 * GET /api/faqs/categories
 */
async function getFaqCategoriesHandler(req, res) {
  try {
    const categories = await getFaqCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching FAQ categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ categories',
      error: error.message,
    });
  }
}

/**
 * Create a new FAQ
 * POST /api/admin/faqs
 */
async function createFaqHandler(req, res) {
  try {
    const { question, answer, category, isPublished } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required',
      });
    }

    const faq = await createFaq(userId, {
      question,
      answer,
      category,
      isPublished,
    });

    res.status(201).json({
      success: true,
      data: faq,
      message: 'FAQ created successfully',
    });
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ',
      error: error.message,
    });
  }
}

/**
 * Update an FAQ
 * PUT /api/admin/faqs/:id
 */
async function updateFaqHandler(req, res) {
  try {
    const { id } = req.params;
    const { question, answer, category, order, isPublished } = req.body;
    const userId = req.user.id;

    const faq = await updateFaq(id, userId, {
      question,
      answer,
      category,
      order,
      isPublished,
    });

    res.json({
      success: true,
      data: faq,
      message: 'FAQ updated successfully',
    });
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ',
      error: error.message,
    });
  }
}

/**
 * Delete an FAQ
 * DELETE /api/admin/faqs/:id
 */
async function deleteFaqHandler(req, res) {
  try {
    const { id } = req.params;

    const deleted = await deleteFaq(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ',
      error: error.message,
    });
  }
}

/**
 * Get all FAQs (admin only)
 * GET /api/admin/faqs
 */
async function getAllFaqsHandler(req, res) {
  try {
    const { page, limit, category, includeUnpublished } = req.query;

    const result = await getAllFaqs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      category,
      includeUnpublished: includeUnpublished === 'true',
    });

    res.json({
      success: true,
      data: result.faqs,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching all FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message,
    });
  }
}

/**
 * Reorder FAQs
 * PUT /api/admin/faqs/reorder
 */
async function reorderFaqsHandler(req, res) {
  try {
    const { faqOrder } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!faqOrder || !Array.isArray(faqOrder)) {
      return res.status(400).json({
        success: false,
        message: 'FAQ order array is required',
      });
    }

    const updatedFaqs = await reorderFaqs(faqOrder, userId);

    res.json({
      success: true,
      data: updatedFaqs,
      message: 'FAQs reordered successfully',
    });
  } catch (error) {
    logger.error('Error reordering FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder FAQs',
      error: error.message,
    });
  }
}

/**
 * Record FAQ feedback
 * POST /api/faqs/:id/feedback
 */
async function recordFaqFeedbackHandler(req, res) {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;

    // Validate required fields
    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isHelpful field is required and must be a boolean',
      });
    }

    const faq = await recordFaqFeedback(id, isHelpful);

    res.json({
      success: true,
      data: faq,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    logger.error('Error recording FAQ feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: error.message,
    });
  }
}

module.exports = {
  getFaqs,
  getFaq,
  getFaqCategoriesHandler,
  createFaqHandler,
  updateFaqHandler,
  deleteFaqHandler,
  getAllFaqsHandler,
  reorderFaqsHandler,
  recordFaqFeedbackHandler,
};