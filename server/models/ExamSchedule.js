const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    enum: ['Internal', 'External', 'Mid', 'Final', 'Practical', 'Viva', 'Other'],
    default: 'Internal'
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
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
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
  }
}, {
  timestamps: true
});

examScheduleSchema.index({ subjectId: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
