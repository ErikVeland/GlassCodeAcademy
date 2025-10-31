const { 
  ForumCategory, 
  ForumThread, 
  ForumPost, 
  ForumVote, 
  User 
} = require('../models');
const { sendForumReplyNotification } = require('./notificationIntegrationService');
const { autoModerateContent } = require('./reportService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Forum Service
 * Handles business logic for forum features
 */

/**
 * Get all forum categories
 * @returns {Promise<Array>} List of forum categories
 */
async function getForumCategories() {
  try {
    const categories = await ForumCategory.findAll({
      where: {
        isActive: true,
      },
      order: [['order', 'ASC']],
    });

    return categories;
  } catch (error) {
    logger.error('Error fetching forum categories:', error);
    throw error;
  }
}

/**
 * Get category by ID
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>} Category object
 */
async function getForumCategoryById(categoryId) {
  try {
    const category = await ForumCategory.findByPk(categoryId);
    return category;
  } catch (error) {
    logger.error('Error fetching forum category:', error);
    throw error;
  }
}

/**
 * Get threads by category
 * @param {number} categoryId - Category ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Threads with pagination
 */
async function getThreadsByCategory(categoryId, options = {}) {
  try {
    const { page = 1, limit = 20, sortBy = 'lastReplyAt', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const whereClause = {
      categoryId,
      isActive: true,
    };

    // Add pinned threads filter if requested
    if (options.pinnedOnly) {
      whereClause.isPinned = true;
    }

    const { count, rows } = await ForumThread.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    return {
      threads: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching threads by category:', error);
    throw error;
  }
}

/**
 * Get thread by ID with posts
 * @param {number} threadId - Thread ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Thread with posts
 */
async function getThreadById(threadId, options = {}) {
  try {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const thread = await ForumThread.findByPk(threadId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ForumCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!thread) {
      return null;
    }

    // Get posts for this thread
    const { count, rows } = await ForumPost.findAndCountAll({
      where: {
        threadId,
        isActive: true,
        parentId: null, // Top-level posts only
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ForumPost,
          as: 'replies',
          where: {
            isActive: true,
          },
          required: false,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [
        ['created_at', 'ASC'],
        [{ model: ForumPost, as: 'replies' }, 'created_at', 'ASC'],
      ],
      limit,
      offset,
    });

    // Update view count
    await thread.increment('viewCount');

    return {
      thread,
      posts: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching thread by ID:', error);
    throw error;
  }
}

/**
 * Create a new forum thread
 * @param {number} userId - User ID
 * @param {number} categoryId - Category ID
 * @param {Object} threadData - Thread data
 * @returns {Promise<Object>} Created thread
 */
async function createThread(userId, categoryId, threadData) {
  try {
    // Validate category exists and is active
    const category = await ForumCategory.findByPk(categoryId);
    if (!category || !category.isActive) {
      throw new Error('Invalid or inactive category');
    }

    // Create thread
    const thread = await ForumThread.create({
      categoryId,
      userId,
      title: threadData.title,
      slug: createSlug(threadData.title),
      content: threadData.content,
    });

    // Include author and category info
    thread.author = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
    });
    thread.category = category;

    // Check for auto-moderation based on report count
    await autoModerateContent('thread', thread.id, 3);

    return thread;
  } catch (error) {
    logger.error('Error creating forum thread:', error);
    throw error;
  }
}

/**
 * Create a new forum post
 * @param {number} userId - User ID
 * @param {number} threadId - Thread ID
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} Created post
 */
async function createPost(userId, threadId, postData) {
  try {
    // Validate thread exists and is active
    const thread = await ForumThread.findByPk(threadId);
    if (!thread || !thread.isActive) {
      throw new Error('Invalid or inactive thread');
    }

    // Check if thread is locked
    if (thread.isLocked) {
      throw new Error('Thread is locked');
    }

    // Create post
    const post = await ForumPost.create({
      threadId,
      userId,
      content: postData.content,
      parentId: postData.parentId || null,
    });

    // Update thread reply count and last reply info
    await thread.update({
      replyCount: thread.replyCount + 1,
      lastReplyAt: new Date(),
      lastReplyUserId: userId,
    });

    // Include author info
    post.author = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
    });

    // Send notification to thread author if this is a reply (not the original post)
    if (postData.parentId || thread.userId !== userId) {
      // Get thread author
      const threadAuthor = await User.findByPk(thread.userId);
      if (threadAuthor && threadAuthor.id !== userId) {
        await sendForumReplyNotification(threadAuthor.id, {
          postTitle: thread.title,
          replierName: post.author.name || post.author.email,
          replyContent: postData.content.substring(0, 100) + '...',
        });
      }
    }

    // Check for auto-moderation based on report count
    await autoModerateContent('post', post.id, 3);

    return post;
  } catch (error) {
    logger.error('Error creating forum post:', error);
    throw error;
  }
}

/**
 * Vote on a forum post
 * @param {number} userId - User ID
 * @param {number} postId - Post ID
 * @param {string} voteType - Vote type ('up' or 'down')
 * @returns {Promise<Object>} Vote result
 */
async function voteOnPost(userId, postId, voteType) {
  try {
    // Validate vote type
    if (!['up', 'down'].includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    // Check if post exists and is active
    const post = await ForumPost.findByPk(postId);
    if (!post || !post.isActive) {
      throw new Error('Invalid or inactive post');
    }

    // Check if user has already voted on this post
    const existingVote = await ForumVote.findOne({
      where: {
        userId,
        postId,
      },
    });

    let vote;
    let voteChange = 0;

    if (existingVote) {
      // Update existing vote
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await existingVote.destroy();
        voteChange = voteType === 'up' ? -1 : 1;
      } else {
        // Change vote
        await existingVote.update({ voteType });
        voteChange = voteType === 'up' ? 2 : -2;
      }
      vote = existingVote;
    } else {
      // Create new vote
      vote = await ForumVote.create({
        userId,
        postId,
        voteType,
      });
      voteChange = voteType === 'up' ? 1 : -1;
    }

    // Update post vote count
    await post.increment('voteCount', { by: voteChange });

    return {
      vote,
      newVoteCount: post.voteCount + voteChange,
    };
  } catch (error) {
    logger.error('Error voting on forum post:', error);
    throw error;
  }
}

/**
 * Get user's vote on a post
 * @param {number} userId - User ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} User's vote
 */
async function getUserVote(userId, postId) {
  try {
    const vote = await ForumVote.findOne({
      where: {
        userId,
        postId,
      },
    });

    return vote;
  } catch (error) {
    logger.error('Error fetching user vote:', error);
    throw error;
  }
}

/**
 * Search forum threads
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
async function searchThreads(query, options = {}) {
  try {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const whereClause = {
      isActive: true,
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } },
      ],
    };

    const { count, rows } = await ForumThread.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ForumCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      threads: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error searching forum threads:', error);
    throw error;
  }
}

/**
 * Create a URL-friendly slug from a string
 * @param {string} text - Text to create slug from
 * @returns {string} URL-friendly slug
 */
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}

module.exports = {
  getForumCategories,
  getForumCategoryById,
  getThreadsByCategory,
  getThreadById,
  createThread,
  createPost,
  voteOnPost,
  getUserVote,
  searchThreads,
};