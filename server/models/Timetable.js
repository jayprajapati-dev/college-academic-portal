const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    slot: {
      type: Number, // 1-based slot index (e.g., 1 = 08:00-09:00)
      required: true
    },
    lectureType: {
      type: String,
      enum: ['Theory', 'Lab'],
      default: 'Theory'
    },
    slotSpan: {
      type: Number, // 1 for lecture, 2 for lab
      default: 1
	},
	status: {
		type: String,
		enum: ['active', 'cancelled', 'archived'],
		default: 'active'
	}
  },
  { timestamps: true }
);

// Indexes for efficient querying
TimetableSchema.index({ semesterId: 1, branchId: 1 });
TimetableSchema.index({ subjectId: 1 });
TimetableSchema.index({ teacherId: 1 });
TimetableSchema.index({ dayOfWeek: 1, slot: 1 });
TimetableSchema.index({ roomId: 1 });

// Populate references by default
TimetableSchema.pre(/^find/, function(next) {
  this.populate('semesterId', 'name code')
    .populate('branchId', 'name code')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name email role')
    .populate('roomId', 'roomNo type');
  next();
});

module.exports = mongoose.model('Timetable', TimetableSchema);
