const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5, 6, 7, 8],
    unique: true,
    index: true
  },
  academicYear: {
    type: String,
    required: true, // e.g., "2023-2024"
    index: true
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
semesterSchema.index({ semesterNumber: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);
