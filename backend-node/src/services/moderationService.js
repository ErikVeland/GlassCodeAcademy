const { ForumThread, ForumPost, User, ModerationAction } = require('../models');
const logger = require('../utils/logger');

/**
 * Moderation Service
 * Handles moderation actions for forum content
 */

/**
 * Get pending moderation items
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Pending items with pagination
 */
async function getPendingItems(options = {}) {
  try {
    const { page = 1, limit = 20, itemType = 'all' } = options;
    const offset = (page - 1) * limit;

    let threads = [];
    let posts = [];
    let threadCount = 0;
    let postCount = 0;

    // Get pending threads
    if (itemType === 'all' || itemType === 'thread') {
      const threadResult = await ForumThread.findAndCountAll({
        where: {
          isApproved: false,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      threads = threadResult.rows;
      threadCount = threadResult.count;
    }

    // Get pending posts
    if (itemType === 'all' || itemType === 'post') {
      const postResult = await ForumPost.findAndCountAll({
        where: {
          isApproved: false,
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: ForumThread,
            as: 'thread',
            attributes: ['id', 'title'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      posts = postResult.rows;
      postCount = postResult.count;
    }

    return {
      threads,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalThreads: threadCount,
        totalPosts: postCount,
      },
    };
  } catch (error) {
    logger.error('Error fetching pending moderation items:', error);
    throw error;
  }
}

/**
 * Approve a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for approval
 * @returns {Promise<Object>} Approved thread
 */
async function approveThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread
    await thread.update({
      isApproved: true,
      approvedBy: moderatorId,
      approvedAt: new Date(),
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'approve',
      reason,
      moderatorId,
    });

    return thread;
  } catch (error) {
    logger.error('Error approving thread:', error);
    throw error;
  }
}

/**
 * Reject a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for rejection
 * @returns {Promise<Object>} Rejected thread
 */
async function rejectThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread
    await thread.update({
      isApproved: false,
      isActive: false,
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'reject',
      reason,
      moderatorId,
    });

    return thread;
  } catch (error) {
    logger.error('Error rejecting thread:', error);
    throw error;
  }
}

/**
 * Approve a forum post
 * @param {number} postId - Post ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for approval
 * @returns {Promise<Object>} Approved post
 */
async function approvePost(postId, moderatorId, reason = null) {
  try {
    const post = await ForumPost.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Update post
    await post.update({
      isApproved: true,
      approvedBy: moderatorId,
      approvedAt: new Date(),
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'post',
      targetId: postId,
      actionType: 'approve',
      reason,
      moderatorId,
    });

    return post;
  } catch (error) {
    logger.error('Error approving post:', error);
    throw error;
  }
}

/**
 * Reject a forum post
 * @param {number} postId - Post ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for rejection
 * @returns {Promise<Object>} Rejected post
 */
async function rejectPost(postId, moderatorId, reason = null) {
  try {
    const post = await ForumPost.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Update post
    await post.update({
      isApproved: false,
      isActive: false,
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'post',
      targetId: postId,
      actionType: 'reject',
      reason,
      moderatorId,
    });

    return post;
  } catch (error) {
    logger.error('Error rejecting post:', error);
    throw error;
  }
}

/**
 * Delete a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise<boolean>} Success status
 */
async function deleteThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Delete thread (this will cascade to posts)
    await thread.destroy();

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'delete',
      reason,
      moderatorId,
    });

    return true;
  } catch (error) {
    logger.error('Error deleting thread:', error);
    throw error;
  }
}

/**
 * Delete a forum post
 * @param {number} postId - Post ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise<boolean>} Success status
 */
async function deletePost(postId, moderatorId, reason = null) {
  try {
    const post = await ForumPost.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Delete post
    await post.destroy();

    // Record moderation action
    await ModerationAction.create({
      targetType: 'post',
      targetId: postId,
      actionType: 'delete',
      reason,
      moderatorId,
    });

    return true;
  } catch (error) {
    logger.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Lock a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for locking
 * @returns {Promise<Object>} Locked thread
 */
async function lockThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread
    await thread.update({
      isLocked: true,
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'lock',
      reason,
      moderatorId,
    });

    return thread;
  } catch (error) {
    logger.error('Error locking thread:', error);
    throw error;
  }
}

/**
 * Unlock a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for unlocking
 * @returns {Promise<Object>} Unlocked thread
 */
async function unlockThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread
    await thread.update({
      isLocked: false,
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'unlock',
      reason,
      moderatorId,
    });

    return thread;
  } catch (error) {
    logger.error('Error unlocking thread:', error);
    throw error;
  }
}

/**
 * Pin a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for pinning
 * @returns {Promise<Object>} Pinned thread
 */
async function pinThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread
    await thread.update({
      isPinned: true,
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'pin',
      reason,
      moderatorId,
    });

    return thread;
  } catch (error) {
    logger.error('Error pinning thread:', error);
    throw error;
  }
}

/**
 * Unpin a forum thread
 * @param {number} threadId - Thread ID
 * @param {number} moderatorId - Moderator ID
 * @param {string} reason - Reason for unpinning
 * @returns {Promise<Object>} Unpinned thread
 */
async function unpinThread(threadId, moderatorId, reason = null) {
  try {
    const thread = await ForumThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread
    await thread.update({
      isPinned: false,
    });

    // Record moderation action
    await ModerationAction.create({
      targetType: 'thread',
      targetId: threadId,
      actionType: 'unpin',
      reason,
      moderatorId,
    });

    return thread;
  } catch (error) {
    logger.error('Error unpinning thread:', error);
    throw error;
  }
}

/**
 * Get moderation history
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Moderation actions with pagination
 */
async function getModerationHistory(options = {}) {
  try {
    const { page = 1, limit = 20, moderatorId, actionType } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (moderatorId) {
      whereClause.moderatorId = moderatorId;
    }
    if (actionType) {
      whereClause.actionType = actionType;
    }

    const { count, rows } = await ModerationAction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'moderator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      actions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching moderation history:', error);
    throw error;
  }
}

module.exports = {
  getPendingItems,
  approveThread,
  rejectThread,
  approvePost,
  rejectPost,
  deleteThread,
  deletePost,
  lockThread,
  unlockThread,
  pinThread,
  unpinThread,
  getModerationHistory,
};
