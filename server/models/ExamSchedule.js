const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    trim: true,
    required: true,
    default: 'Internal Exam'
  },
  examCategory: {
    type: String,
    enum: [
      'Custom',
      'Mid Exam',
      'Pa-1 Exam',
      'Pa-2 Exam',
      'GTU Exam',
      'Test Exam',
      'Practical Exam',
      'Internal Exam',
      'External Exam'
    ],
    default: 'Internal Exam'
  },
  customExamType: {
    type: String,
    trim: true,
    default: ''
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
    enum: ['admin', 'hod', 'teacher', 'coordinator'],
    required: true
  }
}, {
  timestamps: true
});

examScheduleSchema.index({ subjectId: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
