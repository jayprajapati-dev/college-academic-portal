const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  category: {
    type: String,
    enum: ['Mini Project', 'Major Project', 'Lab Project', 'Custom'],
    default: 'Mini Project'
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'hod', 'teacher', 'coordinator'],
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  teamSize: {
    type: Number,
    default: 1,
    min: 1,
    max: 12
  },
  resources: [{
    name: String,
    url: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

projectSchema.index({ subjectId: 1, branchId: 1, semesterId: 1, status: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
