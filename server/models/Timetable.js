const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestType: {
      type: String,
      enum: ['modify', 'delete'],
      required: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    proposed: {
      division: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null
      },
      roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
      },
      dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        default: null
      },
      slot: {
        type: Number,
        default: null
      },
      slotSpan: {
        type: Number,
        default: null
      },
      lectureType: {
        type: String,
        enum: ['Theory', 'Lab'],
        default: null
      }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

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
    division: {
      type: String,
      trim: true,
      maxlength: 30,
      default: 'General'
    },
    slot: {
      type: Number, // 1-based slot index (e.g., 1 = 08:00-09:00)
      required: true
    },
    startTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      default: null
    },
    endTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      default: null
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
	},
    canBeModifiedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['teacher', 'hod'],
          required: true
        },
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        grantedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    changeRequests: [changeRequestSchema]
  },
  { timestamps: true }
);

// Indexes for efficient querying
TimetableSchema.index({ semesterId: 1, branchId: 1 });
TimetableSchema.index({ subjectId: 1 });
TimetableSchema.index({ teacherId: 1 });
TimetableSchema.index({ dayOfWeek: 1, slot: 1 });
TimetableSchema.index({ roomId: 1 });
TimetableSchema.index({ 'changeRequests.status': 1, 'changeRequests.requesterId': 1 });

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
