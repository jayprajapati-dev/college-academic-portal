const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  note: {
    type: String,
    trim: true
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
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
  dateKey: {
    type: String,
    required: true,
    index: true
  },
  session: {
    type: String,
    default: 'Regular'
  },
  records: [attendanceRecordSchema],
  summary: {
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedByRole: {
    type: String,
    enum: ['admin', 'hod', 'teacher'],
    required: true
  }
}, {
  timestamps: true
});

attendanceSchema.index({ subjectId: 1, dateKey: 1, session: 1 }, { unique: true });
attendanceSchema.index({ branchId: 1, semesterId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
