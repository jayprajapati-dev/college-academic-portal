const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const LibraryBook = require('../models/LibraryBook');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const { protect, authorize } = require('../middleware/auth');

const buildBranchScope = (user) => {
  const branchIds = [];
  if (user.branch) branchIds.push(user.branch);
  if (user.department) branchIds.push(user.department);
  if (user.coordinator?.branch) branchIds.push(user.coordinator.branch);
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

const getSubjectScopes = (subject) => {
  const scopes = [];

  if (subject?.branchId) {
    scopes.push({
      branchId: String(subject.branchId),
      semesterId: subject.semesterId ? String(subject.semesterId) : null
    });
  }

  if (Array.isArray(subject?.offerings)) {
    subject.offerings.forEach((offering) => {
      if (!offering?.branchId) return;
      scopes.push({
        branchId: String(offering.branchId),
        semesterId: offering.semesterId ? String(offering.semesterId) : null
      });
    });
  }

  const seen = new Set();
  return scopes.filter((scope) => {
    const key = `${scope.branchId}|${scope.semesterId || ''}`;
    if (!scope.branchId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getEffectiveSubjectScope = (subject, allowedBranches) => {
  const subjectScopes = getSubjectScopes(subject);
  return subjectScopes.find((scope) => allowedBranches.includes(scope.branchId)) || null;
};

const getTeacherScopedSubjectIds = async (user) => {
  if (!user || user.role !== 'teacher') return [];

  const assigned = Array.isArray(user.assignedSubjects) ? user.assignedSubjects : [];
  const timetableSubjectIds = await Timetable.distinct('subjectId', {
    teacherId: user._id,
    status: 'active'
  });

  return Array.from(new Set(
    [...assigned, ...timetableSubjectIds]
      .filter(Boolean)
      .map((id) => String(id))
  ));
};

const buildEffectiveBranchScope = async (user) => {
  const branchSet = new Set(buildBranchScope(user));

  if (user?.role === 'teacher') {
    const teacherSubjectIds = await getTeacherScopedSubjectIds(user);

    if (teacherSubjectIds.length > 0) {
      const teacherSubjects = await Subject.find({ _id: { $in: teacherSubjectIds } })
        .select('branchId offerings.branchId');

      teacherSubjects.forEach((subject) => {
        if (subject?.branchId) branchSet.add(String(subject.branchId));
        if (Array.isArray(subject?.offerings)) {
          subject.offerings.forEach((offering) => {
            if (offering?.branchId) branchSet.add(String(offering.branchId));
          });
        }
      });
    }
  }

  return Array.from(branchSet).filter(Boolean);
};

const teacherCanAccessBook = (book, allowedBranches, teacherSubjectIds) => {
  const branchAllowed = allowedBranches.includes(String(book?.branchId));
  const subjectAllowed = teacherSubjectIds.includes(String(book?.subjectId));
  return branchAllowed || subjectAllowed;
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

// PRIVATE: Get library books (admin/hod/teacher/coordinator)
router.get('/books', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 10, subjectId, branchId, semesterId, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) query.subjectId = subjectId;
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) query.branchId = branchId;
    if (semesterId && mongoose.Types.ObjectId.isValid(semesterId)) query.semesterId = semesterId;

    const searchQuery = buildSearchQuery(search);
    if (searchQuery) Object.assign(query, searchQuery);

    if (req.user.role !== 'admin') {
      const allowedBranches = await buildEffectiveBranchScope(req.user);
      const teacherSubjectIds = req.user.role === 'teacher'
        ? await getTeacherScopedSubjectIds(req.user)
        : [];

      if (allowedBranches.length === 0) {
        if (req.user.role === 'teacher' && teacherSubjectIds.length > 0) {
          if (query.subjectId && !teacherSubjectIds.includes(String(query.subjectId))) {
            return res.status(403).json({
              success: false,
              message: 'You are not allowed to access this subject'
            });
          }

          if (!query.subjectId) {
            query.subjectId = { $in: teacherSubjectIds };
          }
        } else {
          return res.json({
            success: true,
            count: 0,
            total: 0,
            pages: 0,
            currentPage: Number(page),
            data: []
          });
        }
      }

      if (allowedBranches.length > 0 && query.branchId && !allowedBranches.includes(String(query.branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to access this branch'
        });
      }

      if (allowedBranches.length > 0 && !query.branchId) {
        query.branchId = { $in: allowedBranches };
      }

      if (req.user.role === 'teacher' && query.subjectId && !teacherSubjectIds.includes(String(query.subjectId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to access this subject'
        });
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
router.post('/books', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
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

    let effectiveBranchId = subject.branchId;
    let effectiveSemesterId = subject.semesterId;

    if (req.user.role !== 'admin') {
      const allowedBranches = await buildEffectiveBranchScope(req.user);
      let subjectScope = getEffectiveSubjectScope(subject, allowedBranches);

      if (!subjectScope && req.user.role === 'teacher') {
        const teacherSubjectIds = await getTeacherScopedSubjectIds(req.user);
        if (teacherSubjectIds.includes(String(subject._id))) {
          const subjectScopes = getSubjectScopes(subject);
          subjectScope = subjectScopes[0] || null;
        }
      }

      if (!subjectScope) {
        return res.status(403).json({
          success: false,
          message: 'You can only add books for subjects in your branch'
        });
      }

      effectiveBranchId = subjectScope.branchId;
      effectiveSemesterId = subjectScope.semesterId || subject.semesterId;
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
      branchId: effectiveBranchId,
      semesterId: effectiveSemesterId,
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
router.put('/books/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
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
      const allowedBranches = await buildEffectiveBranchScope(req.user);
      const teacherSubjectIds = req.user.role === 'teacher'
        ? await getTeacherScopedSubjectIds(req.user)
        : [];

      if (req.user.role === 'teacher') {
        if (!teacherCanAccessBook(book, allowedBranches, teacherSubjectIds)) {
          return res.status(403).json({
            success: false,
            message: 'You are not allowed to update this book'
          });
        }
      } else if (!allowedBranches.includes(String(book.branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to update this book'
        });
      }
    }

    let subject = null;
    let effectiveBranchId = book.branchId;
    let effectiveSemesterId = book.semesterId;

    if (req.body.subjectId && mongoose.Types.ObjectId.isValid(req.body.subjectId)) {
      subject = await Subject.findById(req.body.subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      if (req.user.role !== 'admin') {
        const allowedBranches = await buildEffectiveBranchScope(req.user);
        let subjectScope = getEffectiveSubjectScope(subject, allowedBranches);

        if (!subjectScope && req.user.role === 'teacher') {
          const teacherSubjectIds = await getTeacherScopedSubjectIds(req.user);
          if (teacherSubjectIds.includes(String(subject._id))) {
            const subjectScopes = getSubjectScopes(subject);
            subjectScope = subjectScopes[0] || null;
          }
        }

        if (!subjectScope) {
          return res.status(403).json({
            success: false,
            message: 'You can only assign books to subjects in your branch'
          });
        }

        effectiveBranchId = subjectScope.branchId;
        effectiveSemesterId = subjectScope.semesterId || subject.semesterId;
      } else {
        effectiveBranchId = subject.branchId;
        effectiveSemesterId = subject.semesterId;
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
      branchId: subject ? effectiveBranchId : book.branchId,
      semesterId: subject ? effectiveSemesterId : book.semesterId
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
router.delete('/books/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
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
      const allowedBranches = await buildEffectiveBranchScope(req.user);
      const teacherSubjectIds = req.user.role === 'teacher'
        ? await getTeacherScopedSubjectIds(req.user)
        : [];

      if (req.user.role === 'teacher') {
        if (!teacherCanAccessBook(book, allowedBranches, teacherSubjectIds)) {
          return res.status(403).json({
            success: false,
            message: 'You are not allowed to delete this book'
          });
        }
      } else if (!allowedBranches.includes(String(book.branchId))) {
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
