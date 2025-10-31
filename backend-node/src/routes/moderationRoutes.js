const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/moderationController');

// All moderation routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Pending items
router.get('/pending', getPendingItemsHandler);

// Thread moderation
router.post('/threads/:threadId/approve', approveThreadHandler);
router.post('/threads/:threadId/reject', rejectThreadHandler);
router.delete('/threads/:threadId', deleteThreadHandler);
router.post('/threads/:threadId/lock', lockThreadHandler);
router.post('/threads/:threadId/unlock', unlockThreadHandler);
router.post('/threads/:threadId/pin', pinThreadHandler);
router.post('/threads/:threadId/unpin', unpinThreadHandler);

// Post moderation
router.post('/posts/:postId/approve', approvePostHandler);
router.post('/posts/:postId/reject', rejectPostHandler);
router.delete('/posts/:postId', deletePostHandler);

// Moderation history
router.get('/history', getModerationHistoryHandler);

module.exports = router;