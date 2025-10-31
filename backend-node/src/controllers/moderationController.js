const {
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
} = require('../services/moderationService');
const logger = require('../utils/logger');

/**
 * Moderation Controller
 * Handles HTTP requests for moderation actions
 */

/**
 * Get pending moderation items
 * GET /api/admin/moderation/pending
 */
async function getPendingItemsHandler(req, res) {
  try {
    const { page, limit, itemType } = req.query;

    const result = await getPendingItems({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      itemType: itemType || 'all',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching pending moderation items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending moderation items',
      error: error.message,
    });
  }
}

/**
 * Approve a forum thread
 * POST /api/admin/moderation/threads/:threadId/approve
 */
async function approveThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const thread = await approveThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      data: thread,
      message: 'Thread approved successfully',
    });
  } catch (error) {
    logger.error('Error approving thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve thread',
      error: error.message,
    });
  }
}

/**
 * Reject a forum thread
 * POST /api/admin/moderation/threads/:threadId/reject
 */
async function rejectThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const thread = await rejectThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      data: thread,
      message: 'Thread rejected successfully',
    });
  } catch (error) {
    logger.error('Error rejecting thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject thread',
      error: error.message,
    });
  }
}

/**
 * Approve a forum post
 * POST /api/admin/moderation/posts/:postId/approve
 */
async function approvePostHandler(req, res) {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const post = await approvePost(postId, moderatorId, reason);

    res.json({
      success: true,
      data: post,
      message: 'Post approved successfully',
    });
  } catch (error) {
    logger.error('Error approving post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve post',
      error: error.message,
    });
  }
}

/**
 * Reject a forum post
 * POST /api/admin/moderation/posts/:postId/reject
 */
async function rejectPostHandler(req, res) {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const post = await rejectPost(postId, moderatorId, reason);

    res.json({
      success: true,
      data: post,
      message: 'Post rejected successfully',
    });
  } catch (error) {
    logger.error('Error rejecting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject post',
      error: error.message,
    });
  }
}

/**
 * Delete a forum thread
 * DELETE /api/admin/moderation/threads/:threadId
 */
async function deleteThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    await deleteThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      message: 'Thread deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete thread',
      error: error.message,
    });
  }
}

/**
 * Delete a forum post
 * DELETE /api/admin/moderation/posts/:postId
 */
async function deletePostHandler(req, res) {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    await deletePost(postId, moderatorId, reason);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
}

/**
 * Lock a forum thread
 * POST /api/admin/moderation/threads/:threadId/lock
 */
async function lockThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const thread = await lockThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      data: thread,
      message: 'Thread locked successfully',
    });
  } catch (error) {
    logger.error('Error locking thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock thread',
      error: error.message,
    });
  }
}

/**
 * Unlock a forum thread
 * POST /api/admin/moderation/threads/:threadId/unlock
 */
async function unlockThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const thread = await unlockThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      data: thread,
      message: 'Thread unlocked successfully',
    });
  } catch (error) {
    logger.error('Error unlocking thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock thread',
      error: error.message,
    });
  }
}

/**
 * Pin a forum thread
 * POST /api/admin/moderation/threads/:threadId/pin
 */
async function pinThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const thread = await pinThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      data: thread,
      message: 'Thread pinned successfully',
    });
  } catch (error) {
    logger.error('Error pinning thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin thread',
      error: error.message,
    });
  }
}

/**
 * Unpin a forum thread
 * POST /api/admin/moderation/threads/:threadId/unpin
 */
async function unpinThreadHandler(req, res) {
  try {
    const { threadId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    const thread = await unpinThread(threadId, moderatorId, reason);

    res.json({
      success: true,
      data: thread,
      message: 'Thread unpinned successfully',
    });
  } catch (error) {
    logger.error('Error unpinning thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpin thread',
      error: error.message,
    });
  }
}

/**
 * Get moderation history
 * GET /api/admin/moderation/history
 */
async function getModerationHistoryHandler(req, res) {
  try {
    const { page, limit, moderatorId, actionType } = req.query;

    const result = await getModerationHistory({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      moderatorId: moderatorId ? parseInt(moderatorId) : null,
      actionType,
    });

    res.json({
      success: true,
      data: result.actions,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching moderation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation history',
      error: error.message,
    });
  }
}

module.exports = {
  getPendingItemsHandler,
  approveThreadHandler,
  rejectThreadHandler,
  approvePostHandler,
  rejectPostHandler,
  deleteThreadHandler,
  deletePostHandler,
  lockThreadHandler,
  unlockThreadHandler,
  pinThreadHandler,
  unpinThreadHandler,
  getModerationHistoryHandler,
};