const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    default: null
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
    index: true
  },
  totalSeats: {
    type: Number,
    default: 0,
    min: 0
  },
  hod: {
    name: String,
    email: String,
    phone: String
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalFaculty: {
    type: Number,
    default: 0
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
branchSchema.index({ semesterId: 1, code: 1 });
branchSchema.index({ name: 1 });

module.exports = mongoose.model('Branch', branchSchema);
