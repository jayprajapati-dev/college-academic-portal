const mongoose = require('mongoose');

const libraryBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  coverUrl: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  edition: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  addedByRole: {
    type: String,
    enum: ['admin', 'hod', 'teacher', 'system'],
    default: 'system'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LibraryBook', libraryBookSchema);
