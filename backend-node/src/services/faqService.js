const { FAQ, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * FAQ Service
 * Handles business logic for FAQ management
 */

/**
 * Get all published FAQs
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of published FAQs
 */
async function getPublishedFaqs(options = {}) {
  try {
    const { category, limit = 50, offset = 0 } = options;

    const whereClause = {
      isPublished: true,
    };

    if (category) {
      whereClause.category = category;
    }

    const faqs = await FAQ.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    return faqs;
  } catch (error) {
    logger.error('Error fetching published FAQs:', error);
    throw error;
  }
}

/**
 * Get FAQ by ID
 * @param {number} id - FAQ ID
 * @returns {Promise<Object>} FAQ object
 */
async function getFaqById(id) {
  try {
    const faq = await FAQ.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Increment view count
    if (faq) {
      await faq.increment('viewCount');
    }

    return faq;
  } catch (error) {
    logger.error('Error fetching FAQ:', error);
    throw error;
  }
}

/**
 * Get all FAQs (admin only)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} FAQs with pagination
 */
async function getAllFaqs(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      includeUnpublished = false,
    } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (!includeUnpublished) {
      whereClause.isPublished = true;
    }
    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await FAQ.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    return {
      faqs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching all FAQs:', error);
    throw error;
  }
}

/**
 * Get FAQ categories
 * @returns {Promise<Array>} List of FAQ categories
 */
async function getFaqCategories() {
  try {
    const categories = await FAQ.findAll({
      attributes: [
        'category',
        [FAQ.sequelize.fn('COUNT', FAQ.sequelize.col('id')), 'count'],
      ],
      where: {
        isPublished: true,
        category: {
          [Op.not]: null,
        },
      },
      group: ['category'],
      order: [[FAQ.sequelize.fn('COUNT', FAQ.sequelize.col('id')), 'DESC']],
    });

    return categories.map((cat) => ({
      name: cat.category,
      count: parseInt(cat.get('count')),
    }));
  } catch (error) {
    logger.error('Error fetching FAQ categories:', error);
    throw error;
  }
}

/**
 * Create a new FAQ
 * @param {number} userId - User ID
 * @param {Object} faqData - FAQ data
 * @returns {Promise<Object>} Created FAQ
 */
async function createFaq(userId, faqData) {
  try {
    // Get the next order value
    const maxOrder = await FAQ.max('order');
    const nextOrder = maxOrder ? maxOrder + 1 : 0;

    const faq = await FAQ.create({
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category,
      order: nextOrder,
      isPublished: faqData.isPublished || false,
      createdBy: userId,
      updatedBy: userId,
    });

    // Include creator info
    faq.creator = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
    });

    return faq;
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    throw error;
  }
}

/**
 * Update an FAQ
 * @param {number} id - FAQ ID
 * @param {number} userId - User ID
 * @param {Object} faqData - FAQ data
 * @returns {Promise<Object>} Updated FAQ
 */
async function updateFaq(id, userId, faqData) {
  try {
    const faq = await FAQ.findByPk(id);
    if (!faq) {
      throw new Error('FAQ not found');
    }

    await faq.update({
      ...faqData,
      updatedBy: userId,
    });

    // Include creator and updater info
    faq.creator = await User.findByPk(faq.createdBy, {
      attributes: ['id', 'name', 'email'],
    });
    if (faq.updatedBy) {
      faq.updater = await User.findByPk(faq.updatedBy, {
        attributes: ['id', 'name', 'email'],
      });
    }

    return faq;
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    throw error;
  }
}

/**
 * Delete an FAQ
 * @param {number} id - FAQ ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteFaq(id) {
  try {
    const deleted = await FAQ.destroy({
      where: { id },
    });

    return deleted > 0;
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    throw error;
  }
}

/**
 * Reorder FAQs
 * @param {Array} faqOrder - Array of {id, order} objects
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Updated FAQs
 */
async function reorderFaqs(faqOrder, userId) {
  try {
    const updatedFaqs = [];

    for (const { id, order } of faqOrder) {
      const faq = await FAQ.findByPk(id);
      if (faq) {
        await faq.update({
          order,
          updatedBy: userId,
        });
        updatedFaqs.push(faq);
      }
    }

    return updatedFaqs;
  } catch (error) {
    logger.error('Error reordering FAQs:', error);
    throw error;
  }
}

/**
 * Record FAQ feedback
 * @param {number} id - FAQ ID
 * @param {boolean} isHelpful - Whether the FAQ was helpful
 * @returns {Promise<Object>} Updated FAQ
 */
async function recordFaqFeedback(id, isHelpful) {
  try {
    const faq = await FAQ.findByPk(id);
    if (!faq) {
      throw new Error('FAQ not found');
    }

    if (isHelpful) {
      await faq.increment('helpfulCount');
    } else {
      await faq.increment('notHelpfulCount');
    }

    // Reload to get updated counts
    await faq.reload();

    return faq;
  } catch (error) {
    logger.error('Error recording FAQ feedback:', error);
    throw error;
  }
}

module.exports = {
  getPublishedFaqs,
  getFaqById,
  getAllFaqs,
  getFaqCategories,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  recordFaqFeedback,
};
