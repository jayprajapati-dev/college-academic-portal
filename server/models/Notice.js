const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Notice content is required']
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High'],
    default: 'Normal'
  },
  targetAudience: {
    type: String,
    enum: ['Everyone', 'Students', 'Teachers', 'Staff', 'Branch', 'Semester', 'Selected'],
    default: 'Everyone'
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'hod', 'teacher', 'student']
  }],
  // Branch-specific notices (for HODs)
  targetBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  // Semester-specific notices
  targetSemesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'hod', 'teacher'],
    required: true
  },
  attachments: [{
    name: String,
    url: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    readAt: Date,
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
noticeSchema.index({ createdBy: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ priority: 1 });
noticeSchema.index({ status: 1 });
noticeSchema.index({ 'recipients.userId': 1 });
noticeSchema.index({ targetBranch: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
