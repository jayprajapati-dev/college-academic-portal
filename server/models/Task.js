const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Task description is required']
  },
  category: {
    type: String,
    enum: ['Task', 'Assignment', 'Custom'],
    default: 'Task',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
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
  dueDate: {
    type: Date,
    default: null
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
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'submitted', 'completed'],
      default: 'pending'
    },
    submittedAt: Date,
    submissionFile: {
      fileName: String,
      filePath: String,
      url: String
    }
  }],
  reminders: {
    before3: { type: Date, default: null },
    before1: { type: Date, default: null },
    overdue: { type: Date, default: null }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'deleted'],
    default: 'active'
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
taskSchema.index({ subjectId: 1, branchId: 1, semesterId: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ status: 1 });
taskSchema.index({ 'recipients.studentId': 1 });

module.exports = mongoose.model('Task', taskSchema);
