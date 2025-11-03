const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCategories,
  getThreads,
  getThread,
  createThreadHandler,
  createPostHandler,
  voteOnPostHandler,
  getUserVoteHandler,
  searchThreadsHandler,
} = require('../controllers/forumController');

// Public routes (no authentication required)
router.get('/categories', getCategories);
router.get('/categories/:categoryId/threads', getThreads);
router.get('/threads/:threadId', getThread);
router.get('/search', searchThreadsHandler);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/categories/:categoryId/threads', createThreadHandler);
router.post('/threads/:threadId/posts', createPostHandler);
router.post('/posts/:postId/vote', voteOnPostHandler);
router.get('/posts/:postId/vote', getUserVoteHandler);

module.exports = router;
