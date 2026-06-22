const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Null recipient = a broadcast notification (e.g. "for all admins" or
    // "for all customers", distinguished by audience below).
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // Who this is meant for when recipient is null: every admin, or every
    // customer. Ignored when recipient is set (it's just for that one user).
    audience: {
      type: String,
      enum: ['admin', 'customer', 'all'],
      default: 'admin'
    },
    type: {
      type: String,
      enum: ['order', 'system', 'promo', 'low_stock', 'announcement'],
      default: 'system'
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, trim: true }, // optional relative path, e.g. /orders/<id>
    isRead: { type: Boolean, default: false },
    // Tracks which recipients have read a broadcast notification, since a
    // single broadcast doc is shared by many users.
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
