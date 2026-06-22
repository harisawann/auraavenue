const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Builds the Mongo filter for "notifications visible to this user", covering
// both notifications addressed directly to them and broadcasts for their role.
const visibilityFilter = (user) => ({
  $or: [
    { recipient: user._id },
    { recipient: null, audience: user.role === 'admin' ? { $in: ['admin', 'all'] } : { $in: ['customer', 'all'] } }
  ]
});

// @desc    Get notifications visible to the current user (admin or customer)
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find(visibilityFilter(req.user))
    .sort('-createdAt')
    .limit(50);

  const withReadFlag = notifications.map((n) => ({
    ...n.toObject(),
    isRead: n.recipient ? n.isRead : n.readBy.some((id) => id.equals(req.user._id))
  }));

  const unreadCount = withReadFlag.filter((n) => !n.isRead).length;

  res.json({ success: true, notifications: withReadFlag, unreadCount });
});

// @desc    Mark a single notification as read for the current user
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    ...visibilityFilter(req.user)
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  if (notification.recipient) {
    notification.isRead = true;
  } else if (!notification.readBy.some((id) => id.equals(req.user._id))) {
    notification.readBy.push(req.user._id);
  }
  await notification.save();

  res.json({ success: true });
});

// @desc    Mark all of the current user's visible notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  await Notification.updateMany(
    { recipient: null, audience: req.user.role === 'admin' ? { $in: ['admin', 'all'] } : { $in: ['customer', 'all'] }, readBy: { $ne: req.user._id } },
    { $push: { readBy: req.user._id } }
  );

  res.json({ success: true });
});

// @desc    Send an announcement notification to all customers, all admins,
//          or one specific user
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, audience = 'customer', recipientId, link, type = 'announcement' } = req.body;

  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  if (recipientId) {
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
  }

  const notification = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    link,
    type,
    recipient: recipientId || null,
    audience: recipientId ? undefined : audience
  });

  res.status(201).json({ success: true, notification });
});

// @desc    List all notifications (admin view, includes broadcasts the admin sent)
// @route   GET /api/notifications/admin/all
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({}).sort('-createdAt').limit(100).populate('recipient', 'name email');
  res.json({ success: true, notifications });
});

// Internal helper (not a route) used by other controllers to raise an
// admin-facing system notification, e.g. when a new order comes in.
const notifyAdmins = async ({ title, message, type = 'system', link }) => {
  await Notification.create({ title, message, type, link, audience: 'admin', recipient: null });
};

// Internal helper to notify a specific customer, e.g. on order status change.
const notifyUser = async (userId, { title, message, type = 'order', link }) => {
  await Notification.create({ title, message, type, link, recipient: userId });
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  getAllNotifications,
  notifyAdmins,
  notifyUser
};
