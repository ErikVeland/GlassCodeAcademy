const {
  getForumCategories,
  getThreadsByCategory,
  getThreadById,
  createThread,
  createPost,
  voteOnPost,
  getUserVote,
  searchThreads,
} = require('../services/forumService');
const logger = require('../utils/logger');

/**
 * Forum Controller
 * Handles HTTP requests for forum features
 */

/**
 * Get all forum categories
 * GET /api/forum/categories
 */
async function getCategories(req, res) {
  try {
    const categories = await getForumCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching forum categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum categories',
      error: error.message,
    });
  }
}

/**
 * Get threads by category
 * GET /api/forum/categories/:categoryId/threads
 */
async function getThreads(req, res) {
  try {
    const { categoryId } = req.params;
    const { page, limit, sortBy, sortOrder, pinnedOnly } = req.query;

    const result = await getThreadsByCategory(categoryId, {
      page,
      limit,
      sortBy,
      sortOrder,
      pinnedOnly: pinnedOnly === 'true',
    });

    res.json({
      success: true,
      data: result.threads,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching forum threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum threads',
      error: error.message,
    });
  }
}

/**
 * Get thread by ID with posts
 * GET /api/forum/threads/:threadId
 */
async function getThread(req, res) {
  try {
    const { threadId } = req.params;
    const { page, limit } = req.query;

    const result = await getThreadById(threadId, {
      page,
      limit,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found',
      });
    }

    res.json({
      success: true,
      data: {
        thread: result.thread,
        posts: result.posts,
      },
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching forum thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum thread',
      error: error.message,
    });
  }
}

/**
 * Create a new forum thread
 * POST /api/forum/categories/:categoryId/threads
 */
async function createThreadHandler(req, res) {
  try {
    const { categoryId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const thread = await createThread(userId, categoryId, {
      title,
      content,
    });

    res.status(201).json({
      success: true,
      data: thread,
      message: 'Thread created successfully',
    });
  } catch (error) {
    logger.error('Error creating forum thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create forum thread',
      error: error.message,
    });
  }
}

/**
 * Create a new forum post
 * POST /api/forum/threads/:threadId/posts
 */
async function createPostHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const post = await createPost(userId, threadId, {
      content,
      parentId,
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully',
    });
  } catch (error) {
    logger.error('Error creating forum post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create forum post',
      error: error.message,
    });
  }
}

/**
 * Vote on a forum post
 * POST /api/forum/posts/:postId/vote
 */
async function voteOnPostHandler(req, res) {
  try {
    const { postId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!voteType) {
      return res.status(400).json({
        success: false,
        message: 'Vote type is required',
      });
    }

    const result = await voteOnPost(userId, postId, voteType);

    res.json({
      success: true,
      data: result,
      message: 'Vote recorded successfully',
    });
  } catch (error) {
    logger.error('Error voting on forum post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: error.message,
    });
  }
}

/**
 * Get user's vote on a post
 * GET /api/forum/posts/:postId/vote
 */
async function getUserVoteHandler(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const vote = await getUserVote(userId, postId);

    res.json({
      success: true,
      data: vote || null,
    });
  } catch (error) {
    logger.error('Error fetching user vote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user vote',
      error: error.message,
    });
  }
}

/**
 * Search forum threads
 * GET /api/forum/search
 */
async function searchThreadsHandler(req, res) {
  try {
    const { q: query, page, limit } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await searchThreads(query, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.threads,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error searching forum threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search forum threads',
      error: error.message,
    });
  }
}

module.exports = {
  getCategories,
  getThreads,
  getThread,
  createThreadHandler,
  createPostHandler,
  voteOnPostHandler,
  getUserVoteHandler,
  searchThreadsHandler,
};