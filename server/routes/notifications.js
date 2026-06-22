const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  getAllNotifications
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect); // everything below requires a logged-in user

router.get('/admin/all', adminOnly, getAllNotifications);
router.post('/', adminOnly, createNotification);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
