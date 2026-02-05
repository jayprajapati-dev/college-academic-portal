const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Semester = require('../models/Semester');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/materials');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /pdf|doc|docx|ppt|pptx|zip|txt|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX, ZIP, TXT, XLSX files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
});

// ======================
// PUBLIC ROUTES (Landing Page)
// ======================

// @route   GET /api/academic/semesters
// @desc    Get all semesters (PUBLIC - for landing page)
// @access  Public
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await Semester.find()
      .sort({ semesterNumber: 1 })
      .select('_id name semesterNumber startDate endDate');

    res.json({
      success: true,
      data: semesters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/branches
// @desc    Get all branches (PUBLIC - for landing page)
// @access  Public
router.get('/branches', async (req, res) => {
  try {
    const branches = await Branch.find()
      .sort({ name: 1 })
      .select('_id name code');

    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/subjects
// @desc    Get all subjects (PUBLIC - for landing page)
// @access  Public
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find()
      .sort({ name: 1 })
      .select('_id name code description semesterId branchId');

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/subjects/:id/public
// @desc    Get subject details with materials (PUBLIC)
// @access  Public
router.get('/subjects/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject id'
      });
    }
    const subject = await Subject.findById(id)
      .populate('branchId', 'name')
      .populate('semesterId', 'semesterNumber')
      .select('name code description type credits syllabus faculty marks materials branchId semesterId');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/analytics/public
// @desc    Get public institutional analytics counts
// @access  Public
router.get('/analytics/public', async (req, res) => {
  try {
    const [
      students,
      teachers,
      hods,
      activeStudents,
      activeFaculty,
      totalSubjects,
      subjectsWithMaterials
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'hod' }),
      User.countDocuments({ role: 'student', status: 'active' }),
      User.countDocuments({ role: { $in: ['teacher', 'hod'] }, status: 'active' }),
      Subject.countDocuments(),
      Subject.countDocuments({ materials: { $exists: true, $ne: [] } })
    ]);

    const faculty = teachers + hods;
    const studentPerformance = students ? Math.round((activeStudents / students) * 100) : 0;
    const facultyEngagement = faculty ? Math.round((activeFaculty / faculty) * 100) : 0;
    const resourceUtilization = totalSubjects ? Math.round((subjectsWithMaterials / totalSubjects) * 100) : 0;

    res.json({
      success: true,
      data: {
        students,
        faculty,
        studentPerformance,
        facultyEngagement,
        resourceUtilization
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/branch-stats
// @desc    Get branch stats (teachers, students, subjects)
// @access  Private (HOD/Admin)
router.get('/branch-stats', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const branchId = req.query.branchId || req.user.branch;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    const [teachers, students, subjects] = await Promise.all([
      User.countDocuments({ role: 'teacher', branch: branchId }),
      User.countDocuments({ role: 'student', branch: branchId }),
      Subject.countDocuments({ branchId })
    ]);

    res.json({
      success: true,
      data: { teachers, students, subjects }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// SEMESTER ROUTES (ADMIN)
// ======================

// @route   GET /api/academic/semesters/admin/list
// @desc    Get all semesters with pagination (ADMIN)
// @access  Private/Admin
router.get('/semesters/admin/list', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const semesters = await Semester.find()
      .skip(skip)
      .limit(limit)
      .sort({ semesterNumber: 1 })
      .populate('createdBy', 'name email');

    const total = await Semester.countDocuments();

    res.json({
      success: true,
      semesters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/semesters/:id
// @desc    Get semester by ID
// @access  Private/Admin
router.get('/semesters/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Get branches and subjects count
    const branches = await Branch.find({ semesterId: semester._id });
    const subjects = await Subject.find({ semesterId: semester._id });
    const students = await User.countDocuments({
      role: 'student',
      semester: semester._id
    });

    res.json({
      success: true,
      semester,
      stats: {
        branchCount: branches.length,
        subjectCount: subjects.length,
        studentCount: students
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/academic/semesters
// @desc    Create new semester
// @access  Private/Admin
router.post('/semesters', protect, authorize('admin'), async (req, res) => {
  try {
    const { semesterNumber, academicYear, startDate, endDate, isActive } = req.body;

    // Validation
    if (!semesterNumber || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide semester number and academic year'
      });
    }

    // Check if semester already exists
    const existingSemester = await Semester.findOne({ semesterNumber });
    if (existingSemester) {
      return res.status(400).json({
        success: false,
        message: 'Semester with this number already exists'
      });
    }

    const semester = new Semester({
      semesterNumber,
      academicYear,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await semester.save();

    res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      semester
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/academic/semesters/:id
// @desc    Update semester
// @access  Private/Admin
router.put('/semesters/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { semesterNumber, academicYear, startDate, endDate, isActive } = req.body;

    let semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if new semester number exists (if changed)
    if (semesterNumber && semesterNumber !== semester.semesterNumber) {
      const existingSemester = await Semester.findOne({ semesterNumber });
      if (existingSemester) {
        return res.status(400).json({
          success: false,
          message: 'Semester with this number already exists'
        });
      }
    }

    semester = await Semester.findByIdAndUpdate(
      req.params.id,
      {
        semesterNumber: semesterNumber || semester.semesterNumber,
        academicYear: academicYear || semester.academicYear,
        startDate: startDate ? new Date(startDate) : semester.startDate,
        endDate: endDate ? new Date(endDate) : semester.endDate,
        isActive: isActive !== undefined ? isActive : semester.isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Semester updated successfully',
      semester
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/academic/semesters/:id
// @desc    Delete semester
// @access  Private/Admin
router.delete('/semesters/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if branches exist
    const branchCount = await Branch.countDocuments({ semesterId: semester._id });
    if (branchCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete semester with ${branchCount} branches. Delete branches first.`
      });
    }

    await Semester.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Semester deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// BRANCH ROUTES (ADMIN)
// ======================

// @route   GET /api/academic/branches/admin/list
// @desc    Get all branches with filters (ADMIN)
// @access  Private/Admin
router.get('/branches/admin/list', protect, authorize('admin'), async (req, res) => {
  try {
    const { semesterId, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (semesterId) filter.semesterId = semesterId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const branches = await Branch.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    const total = await Branch.countDocuments(filter);

    res.json({
      success: true,
      branches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/branches/:id
// @desc    Get branch by ID
// @access  Private/Admin
router.get('/branches/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email');

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get subjects and students count
    const subjects = await Subject.find({ branchId: branch._id });
    const students = await User.countDocuments({
      role: 'student',
      branch: branch._id
    });

    res.json({
      success: true,
      branch,
      stats: {
        subjectCount: subjects.length,
        studentCount: students
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/academic/branches
// @desc    Create new branch
// @access  Private/Admin
router.post('/branches', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, semesterId, description, totalSeats, isActive } = req.body;

    // Validation
    if (!name || !code || !semesterId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, and semester'
      });
    }

    // Check if code already exists
    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: 'Branch code already exists'
      });
    }

    // Check if semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if branch name already exists in this semester
    const existingName = await Branch.findOne({
      name: new RegExp(`^${name}$`, 'i'),
      semesterId
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Branch name already exists in this semester'
      });
    }

    const branch = new Branch({
      name,
      code: code.toUpperCase(),
      semesterId,
      description,
      totalSeats: totalSeats || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await branch.save();

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/academic/branches/:id
// @desc    Update branch
// @access  Private/Admin
router.put('/branches/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, description, totalSeats, isActive } = req.body;

    let branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if new code exists (if changed)
    if (code && code !== branch.code) {
      const existingBranch = await Branch.findOne({ code });
      if (existingBranch) {
        return res.status(400).json({
          success: false,
          message: 'Branch code already exists'
        });
      }
    }

    // Check if new name exists in same semester (if changed)
    if (name && name !== branch.name) {
      const existingName = await Branch.findOne({
        name: new RegExp(`^${name}$`, 'i'),
        semesterId: branch.semesterId,
        _id: { $ne: branch._id }
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'Branch name already exists in this semester'
        });
      }
    }

    branch = await Branch.findByIdAndUpdate(
      req.params.id,
      {
        name: name || branch.name,
        code: code ? code.toUpperCase() : branch.code,
        description: description || branch.description,
        totalSeats: totalSeats !== undefined ? totalSeats : branch.totalSeats,
        isActive: isActive !== undefined ? isActive : branch.isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('semesterId', 'semesterNumber academicYear');

    res.json({
      success: true,
      message: 'Branch updated successfully',
      branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/academic/branches/:id
// @desc    Delete branch
// @access  Private/Admin
router.delete('/branches/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if students exist in this branch
    const studentCount = await User.countDocuments({
      role: 'student',
      branch: branch._id
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete branch with ${studentCount} enrolled students`
      });
    }

    // Delete all subjects in this branch
    await Subject.deleteMany({ branchId: branch._id });

    await Branch.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// SUBJECT ROUTES (ADMIN)
// ======================

// @route   GET /api/academic/subjects/admin/list
// @desc    Get all subjects with filters (ADMIN)
// @access  Private/Admin
router.get('/subjects/admin/list', protect, authorize('admin'), async (req, res) => {
  try {
    const { branchId, semesterId, type, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (branchId) filter.branchId = branchId;
    if (semesterId) filter.semesterId = semesterId;
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const subjects = await Subject.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email')
      .sort({ code: 1 });

    const total = await Subject.countDocuments(filter);

    res.json({
      success: true,
      subjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/subjects/:id
// @desc    Get subject by ID
// @access  Private/Admin
router.get('/subjects/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/academic/subjects
// @desc    Create new subject
// @access  Private/Admin
router.post('/subjects', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      credits,
      branchId,
      semesterId,
      description,
      syllabus,
      marks,
      isActive
    } = req.body;

    // Validation
    if (!name || !code || !type || !branchId || !semesterId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, type, branch, and semester'
      });
    }

    // Check if code already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject code already exists'
      });
    }

    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Validate marks if provided
    if (marks) {
      if (type === 'theory' || type === 'theory+practical') {
        if (!marks.theory || !marks.theory.internal === undefined || marks.theory.external === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Invalid theory marks'
          });
        }
      }
      if (type === 'practical' || type === 'theory+practical') {
        if (!marks.practical || marks.practical.internal === undefined || marks.practical.external === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Invalid practical marks'
          });
        }
      }
    }

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      type,
      credits: credits || 0,
      branchId,
      semesterId,
      description,
      syllabus,
      marks: marks || {
        theory: { internal: 0, external: 0, total: 0 },
        practical: { internal: 0, external: 0, total: 0 },
        totalMarks: 0,
        passingMarks: 0
      },
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await subject.save();

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/academic/subjects/:id
// @desc    Update subject
// @access  Private/Admin
router.put('/subjects/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      credits,
      description,
      syllabus,
      marks,
      isActive
    } = req.body;

    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if new code exists (if changed)
    if (code && code !== subject.code) {
      const existingSubject = await Subject.findOne({ code });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject code already exists'
        });
      }
    }

    subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name: name || subject.name,
        code: code ? code.toUpperCase() : subject.code,
        type: type || subject.type,
        credits: credits !== undefined ? credits : subject.credits,
        description: description || subject.description,
        syllabus: syllabus || subject.syllabus,
        marks: marks || subject.marks,
        isActive: isActive !== undefined ? isActive : subject.isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('branchId', 'name code')
     .populate('semesterId', 'semesterNumber academicYear');

    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/academic/subjects/:id
// @desc    Delete subject
// @access  Private/Admin
router.delete('/subjects/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/structure
// @desc    Get complete academic hierarchy
// @access  Private/Admin
router.get('/structure', protect, authorize('admin'), async (req, res) => {
  try {
    const semesters = await Semester.find()
      .sort({ semesterNumber: 1 });

    const structure = await Promise.all(
      semesters.map(async (semester) => {
        const branches = await Branch.find({ semesterId: semester._id })
          .sort({ name: 1 });

        const branchesWithSubjects = await Promise.all(
          branches.map(async (branch) => {
            const subjects = await Subject.find({ branchId: branch._id })
              .select('name code type marks credits');

            return {
              ...branch.toObject(),
              subjects
            };
          })
        );

        return {
          ...semester.toObject(),
          branches: branchesWithSubjects
        };
      })
    );

    res.json({
      success: true,
      structure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// MATERIALS ROUTES
// ======================

// @route   POST /api/academic/subjects/:id/materials
// @desc    Upload study material for a subject
// @access  Private/Admin
router.post(
  '/subjects/:id/materials',
  protect,
  authorize('admin'),
  upload.single('material'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        // Delete uploaded file if title is missing
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const subject = await Subject.findById(id);
      if (!subject) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Create material object
      const material = {
        title: title.trim(),
        fileName: req.file.originalname,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        fileSize: req.file.size,
        filePath: `/uploads/materials/${req.file.filename}`,
        downloadCount: 0,
        uploadedAt: new Date()
      };

      // Add material to subject
      subject.materials.push(material);
      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully',
        material: material
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   GET /api/academic/subjects/:id/materials
// @desc    Get all materials for a subject
// @access  Private
router.get('/subjects/:id/materials', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id).select('materials');
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      materials: subject.materials || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/academic/subjects/:id/materials/:matId
// @desc    Delete a material from subject
// @access  Private/Admin
router.delete('/subjects/:id/materials/:matId', protect, authorize('admin'), async (req, res) => {
  try {
    const { id, matId } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const materialIndex = subject.materials.findIndex(
      (mat) => mat._id.toString() === matId
    );

    if (materialIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    const material = subject.materials[materialIndex];

    // Delete file from storage
    const filePath = path.join(__dirname, '../' + material.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove material from array
    subject.materials.splice(materialIndex, 1);
    await subject.save();

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PATCH /api/academic/subjects/:id/materials/:matId/download
// @desc    Increment download count for a material
// @access  Private
router.patch('/subjects/:id/materials/:matId/download', protect, async (req, res) => {
  try {
    const { id, matId } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const material = subject.materials.find(
      (mat) => mat._id.toString() === matId
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    material.downloadCount = (material.downloadCount || 0) + 1;
    await subject.save();

    res.json({
      success: true,
      message: 'Download count updated',
      downloadCount: material.downloadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// NEW LINK-BASED MATERIALS
// ======================

// @route   POST /api/academic/subjects/:id/materials/link
// @desc    Add a material link (by teacher/HOD/admin)
// @access  Private/Authorized
router.post('/subjects/:id/materials/link', protect, authorize('teacher', 'hod', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, link } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    if (!title || !link) {
      return res.status(400).json({
        success: false,
        message: 'Title and link are required'
      });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const material = {
      title: title.trim(),
      category: category || 'Notes',
      description: description || '',
      link: link.trim(),
      addedBy: req.user._id,
      addedByRole: req.user.role,
      downloadCount: 0,
      uploadedAt: new Date()
    };

    subject.materials.push(material);
    await subject.save();

    res.status(201).json({
      success: true,
      message: 'Material link added successfully',
      material
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/academic/subjects/:id/materials/categories
// @desc    Get all material categories for a subject
// @access  Public
router.get('/subjects/:id/materials/categories', async (req, res) => {
  try {
    const categories = ['All', 'Syllabus', 'Book', 'Notes', 'Manuals', 'Test', 'Mid Exam Paper', 'GTU Exam Paper', 'Other'];
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/academic/subjects/:id/materials/:matId/link
// @desc    Update a material link
// @access  Private/Authorized (only author/admin)
router.put('/subjects/:id/materials/:matId/link', protect, authorize('teacher', 'hod', 'admin'), async (req, res) => {
  try {
    const { id, matId } = req.params;
    const { title, category, description, link } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const material = subject.materials.find((mat) => mat._id.toString() === matId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    // Only author or admin can update
    if (material.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this material' });
    }

    if (title) material.title = title;
    if (category) material.category = category;
    if (description !== undefined) material.description = description;
    if (link) material.link = link;

    await subject.save();

    res.json({
      success: true,
      message: 'Material updated successfully',
      material
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/academic/subjects/:id/materials/:matId/link
// @desc    Delete a material link
// @access  Private/Authorized (only author/admin)
router.delete('/subjects/:id/materials/:matId/link', protect, authorize('teacher', 'hod', 'admin'), async (req, res) => {
  try {
    const { id, matId } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const material = subject.materials.find((mat) => mat._id.toString() === matId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    // Only author or admin can delete
    if (material.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this material' });
    }

    const index = subject.materials.findIndex((mat) => mat._id.toString() === matId);
    subject.materials.splice(index, 1);
    await subject.save();

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======================
// GET TEACHER'S ASSIGNED SUBJECTS
// ======================
router.get('/teacher/:teacherId/subjects', protect, async (req, res) => {
  try {
    const teacher = await User.findById(req.params.teacherId).populate('assignedSubjects');
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({
      success: true,
      subjects: teacher.assignedSubjects || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
