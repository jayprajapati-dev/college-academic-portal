const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const LibraryBook = require('../models/LibraryBook');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

const buildBranchScope = (user) => {
  const branchIds = [];
  if (user.branch) branchIds.push(user.branch);
  if (user.department) branchIds.push(user.department);
  if (Array.isArray(user.branches)) branchIds.push(...user.branches);

  return [...new Set(branchIds.map((id) => String(id)))].filter(Boolean);
};

const buildSearchQuery = (search) => {
  if (!search) return null;
  const regex = new RegExp(search, 'i');
  return {
    $or: [
      { title: regex },
      { author: regex },
      { isbn: regex },
      { publisher: regex }
    ]
  };
};

// PUBLIC: Get library books
router.get('/books/public', async (req, res) => {
  try {
    const { subjectId, branchId, semesterId, search } = req.query;

    const query = { status: 'active' };

    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) query.subjectId = subjectId;
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) query.branchId = branchId;
    if (semesterId && mongoose.Types.ObjectId.isValid(semesterId)) query.semesterId = semesterId;

    const searchQuery = buildSearchQuery(search);
    if (searchQuery) Object.assign(query, searchQuery);

    const books = await LibraryBook.find(query)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error('Get public library books error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching library books'
    });
  }
});

// PRIVATE: Get library books (admin/hod/teacher)
router.get('/books', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 10, subjectId, branchId, semesterId, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) query.subjectId = subjectId;
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) query.branchId = branchId;
    if (semesterId && mongoose.Types.ObjectId.isValid(semesterId)) query.semesterId = semesterId;

    const searchQuery = buildSearchQuery(search);
    if (searchQuery) Object.assign(query, searchQuery);

    if (req.user.role !== 'admin') {
      const allowedBranches = buildBranchScope(req.user);
      if (allowedBranches.length === 0) {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      if (query.branchId && !allowedBranches.includes(String(query.branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to access this branch'
        });
      }

      if (!query.branchId) {
        query.branchId = { $in: allowedBranches };
      }
    }

    const books = await LibraryBook.find(query)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber')
      .populate('addedBy', 'name email role')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await LibraryBook.countDocuments(query);

    res.json({
      success: true,
      count: books.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: books
    });
  } catch (error) {
    console.error('Get library books error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching library books'
    });
  }
});

// PRIVATE: Create library book
router.post('/books', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { title, author, description, coverUrl, isbn, publisher, edition, subjectId, status } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Title and subject are required'
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (req.user.role !== 'admin') {
      const allowedBranches = buildBranchScope(req.user);
      const subjectBranch = subject.branchId ? String(subject.branchId) : null;
      if (!subjectBranch || !allowedBranches.includes(subjectBranch)) {
        return res.status(403).json({
          success: false,
          message: 'You can only add books for subjects in your branch'
        });
      }
    }

    const book = await LibraryBook.create({
      title,
      author,
      description,
      coverUrl,
      isbn,
      publisher,
      edition,
      status: status === 'inactive' ? 'inactive' : 'active',
      subjectId: subject._id,
      branchId: subject.branchId,
      semesterId: subject.semesterId,
      addedBy: req.user._id,
      addedByRole: req.user.role
    });

    res.status(201).json({
      success: true,
      message: 'Library book created successfully',
      data: book
    });
  } catch (error) {
    console.error('Create library book error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating library book'
    });
  }
});

// PRIVATE: Update library book
router.put('/books/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book id'
      });
    }

    const book = await LibraryBook.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (req.user.role !== 'admin') {
      const allowedBranches = buildBranchScope(req.user);
      if (!allowedBranches.includes(String(book.branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to update this book'
        });
      }
    }

    let subject = null;
    if (req.body.subjectId && mongoose.Types.ObjectId.isValid(req.body.subjectId)) {
      subject = await Subject.findById(req.body.subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      if (req.user.role !== 'admin') {
        const allowedBranches = buildBranchScope(req.user);
        const subjectBranch = subject.branchId ? String(subject.branchId) : null;
        if (!subjectBranch || !allowedBranches.includes(subjectBranch)) {
          return res.status(403).json({
            success: false,
            message: 'You can only assign books to subjects in your branch'
          });
        }
      }
    }

    const updatedFields = {
      title: req.body.title ?? book.title,
      author: req.body.author ?? book.author,
      description: req.body.description ?? book.description,
      coverUrl: req.body.coverUrl ?? book.coverUrl,
      isbn: req.body.isbn ?? book.isbn,
      publisher: req.body.publisher ?? book.publisher,
      edition: req.body.edition ?? book.edition,
      status: req.body.status === 'inactive' ? 'inactive' : 'active',
      subjectId: subject ? subject._id : book.subjectId,
      branchId: subject ? subject.branchId : book.branchId,
      semesterId: subject ? subject.semesterId : book.semesterId
    };

    const updatedBook = await LibraryBook.findByIdAndUpdate(id, updatedFields, { new: true });

    res.json({
      success: true,
      message: 'Library book updated successfully',
      data: updatedBook
    });
  } catch (error) {
    console.error('Update library book error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating library book'
    });
  }
});

// PRIVATE: Delete library book
router.delete('/books/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book id'
      });
    }

    const book = await LibraryBook.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (req.user.role !== 'admin') {
      const allowedBranches = buildBranchScope(req.user);
      if (!allowedBranches.includes(String(book.branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to delete this book'
        });
      }
    }

    await LibraryBook.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Library book deleted successfully'
    });
  } catch (error) {
    console.error('Delete library book error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting library book'
    });
  }
});

module.exports = router;
