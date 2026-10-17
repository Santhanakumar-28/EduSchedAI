const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['Leave', 'Substitution', 'Attendance', 'Notice', 'System'],
      default: 'System'
    },
    relatedEntityId: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
