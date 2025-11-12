/**
 * Minimal stub implementation of moderation service to unblock server startup.
 * Real logic can be wired later; for now, return deterministic placeholders.
 */

async function getPendingItems({ page = 1, limit = 20, itemType = 'all' } = {}) {
  return {
    page,
    limit,
    itemType,
    items: [],
    total: 0,
  };
}

async function approveThread(threadId, moderatorId, reason) {
  return { id: threadId, moderatorId, reason: reason || null, status: 'approved' };
}

async function rejectThread(threadId, moderatorId, reason) {
  return { id: threadId, moderatorId, reason: reason || null, status: 'rejected' };
}

async function approvePost(postId, moderatorId, reason) {
  return { id: postId, moderatorId, reason: reason || null, status: 'approved' };
}

async function rejectPost(postId, moderatorId, reason) {
  return { id: postId, moderatorId, reason: reason || null, status: 'rejected' };
}

async function deleteThread(threadId, moderatorId, reason) {
  return { id: threadId, moderatorId, reason: reason || null, status: 'deleted' };
}

async function deletePost(postId, moderatorId, reason) {
  return { id: postId, moderatorId, reason: reason || null, status: 'deleted' };
}

async function lockThread(threadId, moderatorId) {
  return { id: threadId, moderatorId, status: 'locked' };
}

async function unlockThread(threadId, moderatorId) {
  return { id: threadId, moderatorId, status: 'unlocked' };
}

async function pinThread(threadId, moderatorId) {
  return { id: threadId, moderatorId, status: 'pinned' };
}

async function unpinThread(threadId, moderatorId) {
  return { id: threadId, moderatorId, status: 'unpinned' };
}

async function getModerationHistory({ page = 1, limit = 20 } = {}) {
  return {
    page,
    limit,
    actions: [],
    total: 0,
  };
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