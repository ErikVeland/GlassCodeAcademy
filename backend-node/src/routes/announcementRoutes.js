const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  getAllAnnouncementsHandler,
  publishAnnouncementHandler,
} = require('../controllers/announcementController');

// Public routes
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);

// Admin routes
router.use(authenticateToken);

router.post('/', requireAdmin, createAnnouncementHandler);
router.put('/:id', requireAdmin, updateAnnouncementHandler);
router.delete('/:id', requireAdmin, deleteAnnouncementHandler);

router.get('/admin/all', requireAdmin, getAllAnnouncementsHandler);
router.post('/admin/:id/publish', requireAdmin, publishAnnouncementHandler);

module.exports = router;