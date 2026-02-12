const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSchedule',
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  grade: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pass', 'fail'],
    default: 'pass'
  },
  remarks: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedByRole: {
    type: String,
    enum: ['admin', 'hod', 'teacher'],
    required: true
  }
}, {
  timestamps: true
});

examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
