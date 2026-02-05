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
    roomNo: {
      type: String,
      required: true,
      trim: true,
      example: 'A101, Lab-1, etc'
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    startTime: {
      type: String, // HH:MM format (24-hour)
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // Validate time format
    },
    endTime: {
      type: String, // HH:MM format (24-hour)
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // Validate time format
    },
    duration: {
      type: Number, // in minutes
      default: 60
    },
    lectureType: {
      type: String,
      enum: ['Theory', 'Practical', 'Tutorial', 'Lab'],
      default: 'Theory'
    },
    // Permission tracking
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
    // Can this timetable be modified by HOD/Teacher?
    canBeModifiedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['hod', 'teacher']
        },
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        grantedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'cancelled', 'archived'],
      default: 'active'
    },
    notes: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
TimetableSchema.index({ semesterId: 1, branchId: 1 });
TimetableSchema.index({ subjectId: 1 });
TimetableSchema.index({ teacherId: 1 });
TimetableSchema.index({ dayOfWeek: 1, startTime: 1 });
TimetableSchema.index({ createdBy: 1 });

// Populate references by default
TimetableSchema.pre(/^find/, function(next) {
  this.populate('semesterId', 'name code')
    .populate('branchId', 'name code')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name email role')
    .populate('createdBy', 'name email role');
  next();
});

// Validate that startTime is before endTime
TimetableSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    throw new Error('Start time must be before end time');
  }
  next();
});

// Validate time format and calculate duration
TimetableSchema.pre('save', function(next) {
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startInMinutes = startHour * 60 + startMin;
  const endInMinutes = endHour * 60 + endMin;
  
  this.duration = endInMinutes - startInMinutes;
  next();
});

module.exports = mongoose.model('Timetable', TimetableSchema);
