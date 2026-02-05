const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
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
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 4
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
  faculty: {
    name: String,
    email: String,
    office: String,
    phone: String
  },
  type: {
    type: String,
    enum: ['theory', 'practical', 'theory+practical'],
    default: 'theory'
  },
  description: {
    type: String,
    default: null
  },
  syllabus: {
    type: String,
    default: null
  },
  marks: {
    theory: {
      internal: { type: Number, default: 0 },
      external: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    practical: {
      internal: { type: Number, default: 0 },
      external: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 }
  },
  materials: [{
    title: String,
    category: {
      type: String,
      enum: ['Syllabus', 'Book', 'Notes', 'Manuals', 'Test', 'Mid Exam Paper', 'GTU Exam Paper', 'Other'],
      default: 'Notes'
    },
    description: String,
    link: String,
    downloadCount: { type: Number, default: 0 },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByRole: {
      type: String,
      enum: ['teacher', 'hod', 'admin'],
      default: 'teacher'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
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
subjectSchema.index({ branchId: 1, semesterId: 1 });
subjectSchema.index({ code: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
