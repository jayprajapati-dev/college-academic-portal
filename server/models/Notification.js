const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Task', 'Notice', 'Assignment', 'Custom', 'System'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Reference to Task or Notice
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedType'
  },
  relatedType: {
    type: String,
    enum: ['Task', 'Notice'],
    required: true
  },
  // For Task notifications: which subject
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  // For Notice: general broadcast
  isNotice: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Index for efficient querying
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ relatedId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
