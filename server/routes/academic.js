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

const getHodBranchScope = (user) => ([
  ...(Array.isArray(user.branches) ? user.branches : []),
  user.branch,
  user.department
].filter(Boolean).map((id) => String(id)));

const getCoordinatorScope = (user) => {
  const assignment = user?.coordinator;
  if (!assignment || assignment.status === 'expired') return null;
  return {
    branchId: assignment.branch ? String(assignment.branch) : null,
    semesterIds: Array.isArray(assignment.semesters) ? assignment.semesters.map((id) => String(id)) : []
  };
};

const getTeacherScope = async (user) => {
  const assigned = Array.isArray(user?.assignedSubjects) ? user.assignedSubjects : [];
  if (assigned.length === 0) return { branchIds: [], semesterIds: [] };

  const subjectDocs = await Subject.find({ _id: { $in: assigned } }).select('branchId semesterId offerings');
  const offeringBranchIds = subjectDocs
    .flatMap((subject) => (Array.isArray(subject.offerings) ? subject.offerings.map((off) => String(off.branchId)) : []))
    .filter(Boolean);
  const offeringSemesterIds = subjectDocs
    .flatMap((subject) => (Array.isArray(subject.offerings) ? subject.offerings.map((off) => String(off.semesterId)) : []))
    .filter(Boolean);
  return {
    branchIds: Array.from(new Set(subjectDocs.map((s) => String(s.branchId)).concat(offeringBranchIds).filter(Boolean))),
    semesterIds: Array.from(new Set(subjectDocs.map((s) => String(s.semesterId)).concat(offeringSemesterIds).filter(Boolean)))
  };
};

const uniqueObjectIds = (values) => {
  const seen = new Set();
  const out = [];
  (Array.isArray(values) ? values : []).forEach((value) => {
    if (!value) return;
    const str = String(value);
    if (!mongoose.Types.ObjectId.isValid(str)) return;
    if (seen.has(str)) return;
    seen.add(str);
    out.push(new mongoose.Types.ObjectId(str));
  });
  return out;
};

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
      .select('_id name code type description semesterId branchId offerings');

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

// @route   GET /api/academic/subjects/hod
// @desc    Get subjects for HOD's branch(es)
// @access  Private (HOD/Admin)
router.get('/subjects/hod', protect, authorize('hod', 'admin'), async (req, res) => {
  try {
    const branchIds = [];

    if (req.user.branch) branchIds.push(req.user.branch);
    if (req.user.department) branchIds.push(req.user.department);
    if (Array.isArray(req.user.branches) && req.user.branches.length > 0) {
      branchIds.push(...req.user.branches);
    }

    const uniqueBranchIds = [...new Set(branchIds.map(id => String(id)))]
      .filter(Boolean)
      .map(id => id);

    if (uniqueBranchIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    let query = {
      $or: [
        { branchId: { $in: uniqueBranchIds } },
        { 'offerings.branchId': { $in: uniqueBranchIds } }
      ]
    };
    if (req.query.semesterId) {
      const semesterObjectId = mongoose.Types.ObjectId.isValid(String(req.query.semesterId))
        ? new mongoose.Types.ObjectId(String(req.query.semesterId))
        : null;

      query = {
        $or: [
          { branchId: { $in: uniqueBranchIds }, semesterId: req.query.semesterId },
          semesterObjectId
            ? { offerings: { $elemMatch: { branchId: { $in: uniqueBranchIds }, semesterId: semesterObjectId } } }
            : { _id: null }
        ]
      };
    }

    const subjects = await Subject.find(query)
      .sort({ name: 1 })
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'semesterNumber academicYear')
      .select('_id name code description semesterId branchId offerings type credits marks isActive');

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
// @route   GET /api/academic/subjects/coordinator
// @desc    Get subjects for coordinator scope
// @access  Private (Coordinator)
router.get('/subjects/coordinator', protect, authorize('coordinator'), async (req, res) => {
  try {
    const assignment = req.user.coordinator;
    if (!assignment || assignment.status === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'Coordinator scope is not configured'
      });
    }

    const branchId = assignment.branch;
    const semesterIds = Array.isArray(assignment.semesters) ? assignment.semesters : [];

    const query = {};
    if (branchId && semesterIds.length > 0) {
      const semesterObjectIds = uniqueObjectIds(semesterIds);
      query.$or = [
        { branchId, semesterId: { $in: semesterIds } },
        { offerings: { $elemMatch: { branchId: mongoose.Types.ObjectId.isValid(String(branchId)) ? new mongoose.Types.ObjectId(String(branchId)) : branchId, semesterId: { $in: semesterObjectIds } } } }
      ];
    } else if (branchId) {
      query.$or = [
        { branchId },
        { 'offerings.branchId': branchId }
      ];
    } else if (semesterIds.length > 0) {
      const semesterObjectIds = uniqueObjectIds(semesterIds);
      query.$or = [
        { semesterId: { $in: semesterIds } },
        { 'offerings.semesterId': { $in: semesterObjectIds } }
      ];
    }

    const subjects = await Subject.find(query)
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'semesterNumber academicYear')
      .sort({ name: 1 });

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

// @route   GET /api/academic/subjects/student
// @desc    Get subjects for logged-in student branch/semester
// @access  Private (Student)
router.get('/subjects/student', protect, authorize('student'), async (req, res) => {
  try {
    const studentBranchRefs = [
      req.user.branch,
      req.user.department,
      ...(Array.isArray(req.user.branches) ? req.user.branches : [])
    ].filter(Boolean);

    const studentSemesterRefs = [
      req.user.semester,
      ...(Array.isArray(req.user.semesters) ? req.user.semesters : [])
    ].filter(Boolean);

    const branchIds = uniqueObjectIds(studentBranchRefs);
    const semesterIds = uniqueObjectIds(studentSemesterRefs);

    if (branchIds.length === 0 || semesterIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const subjects = await Subject.find({
      $or: [
        { branchId: { $in: branchIds }, semesterId: { $in: semesterIds } },
        { offerings: { $elemMatch: { branchId: { $in: branchIds }, semesterId: { $in: semesterIds } } } }
      ],
      isActive: true
    })
      .sort({ name: 1 })
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'semesterNumber academicYear')
      .select('_id name code description semesterId branchId offerings type credits isActive');

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
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'semesterNumber')
      .select('name code description type credits syllabus faculty marks materials branchId semesterId offerings');

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
    const requestedBranchId = String(req.query.branchId || '').trim();
    const isAdmin = req.user.role === 'admin' || req.user.adminAccess === true;
    const hodBranchScope = getHodBranchScope(req.user);
    const branchIds = requestedBranchId
      ? [requestedBranchId]
      : (isAdmin ? [] : hodBranchScope);
    const uniqueBranchIds = Array.from(new Set(branchIds.filter(Boolean).map((id) => String(id))));

    if (requestedBranchId && !isAdmin && !hodBranchScope.includes(requestedBranchId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access stats for this branch'
      });
    }

    if (uniqueBranchIds.length === 0) {
      if (isAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID is required'
        });
      }

      return res.json({
        success: true,
        data: { teachers: 0, students: 0, subjects: 0 }
      });
    }

    const branchFilter = { $in: uniqueBranchIds };

    const [teachers, students, subjects] = await Promise.all([
      User.countDocuments({
        role: 'teacher',
        $or: [
          { branch: branchFilter },
          { branches: branchFilter },
          { department: branchFilter }
        ]
      }),
      User.countDocuments({ role: 'student', branch: branchFilter }),
      Subject.countDocuments({
        $or: [
          { branchId: branchFilter },
          { 'offerings.branchId': branchFilter }
        ]
      })
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
// @desc    Get all semesters with pagination (ADMIN, HOD)
// @access  Private/Admin/HOD
router.get('/semesters/admin/list', protect, authorize('admin', 'hod'), async (req, res) => {
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
router.get('/branches/admin/list', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { semesterId, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (semesterId) filter.semesterId = semesterId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (req.user.role === 'hod') {
      const branchScope = getHodBranchScope(req.user);
      if (!branchScope.length) {
        return res.json({ success: true, branches: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      filter._id = { $in: branchScope };
    }

    if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope || !scope.branchId) {
        return res.json({ success: true, branches: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      filter._id = scope.branchId;
    }

    if (req.user.role === 'teacher') {
      const scope = await getTeacherScope(req.user);
      if (!scope.branchIds.length) {
        return res.json({ success: true, branches: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      filter._id = { $in: scope.branchIds };
    }

    const branches = await Branch.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    const branchIds = branches.map((branch) => branch._id);
    const branchIdStrings = branchIds.map((id) => String(id));
    const branchCodes = branches.map((branch) => branch.code).filter(Boolean);
    const branchNames = branches.map((branch) => branch.name).filter(Boolean);
    const branchLookupValues = [...new Set([...branchIdStrings, ...branchCodes, ...branchNames])];
    const studentCounts = branchIds.length > 0
      ? await User.aggregate([
          {
            $match: {
              role: 'student',
              $or: [
                { branch: { $in: branchIds } },
                { department: { $in: branchIds } },
                { branches: { $in: branchIds } },
                {
                  $expr: {
                    $in: [{ $toString: '$branch' }, branchLookupValues]
                  }
                },
                {
                  $expr: {
                    $in: [{ $toString: '$department' }, branchLookupValues]
                  }
                },
                {
                  $expr: {
                    $gt: [
                      {
                        $size: {
                          $setIntersection: [
                            {
                              $map: {
                                input: { $ifNull: ['$branches', []] },
                                as: 'branchRef',
                                in: { $toString: '$$branchRef' }
                              }
                            },
                            branchLookupValues
                          ]
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          },
          {
            $project: {
              targetBranch: {
                $ifNull: [
                  '$branch',
                  {
                    $ifNull: [
                      '$department',
                      {
                        $cond: [
                          { $gt: [{ $size: { $ifNull: ['$branches', []] } }, 0] },
                          { $arrayElemAt: ['$branches', 0] },
                          {
                            $ifNull: ['$branch', '$department']
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            $match: {
              $expr: {
                $in: [{ $toString: '$targetBranch' }, branchIdStrings]
              }
            }
          },
          {
            $group: {
              _id: { $toString: '$targetBranch' },
              count: { $sum: 1 }
            }
          }
        ])
      : [];

    const countMap = new Map(studentCounts.map((item) => [String(item._id), item.count]));

    const enrichedBranches = branches.map((branchDoc) => {
      const branch = branchDoc.toObject();
      const enrolledStudents = countMap.get(String(branch._id)) || 0;
      const overrideSeat = Array.isArray(branch.semesterSeatOverrides)
        ? branch.semesterSeatOverrides.find((item) => String(item.semester) === String(branch.semesterId?._id || branch.semesterId))
        : null;
      const totalSeats = Number(overrideSeat?.totalSeats ?? branch.totalSeats ?? 0);
      const availableSeats = Math.max(totalSeats - enrolledStudents, 0);
      const capacityPercent = totalSeats > 0 ? Math.min(100, Math.round((enrolledStudents / totalSeats) * 100)) : 0;

      return {
        ...branch,
        enrolledStudents,
        availableSeats,
        capacityPercent
      };
    });

    const total = await Branch.countDocuments(filter);

    res.json({
      success: true,
      branches: enrichedBranches,
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
    const branchLookupValues = [String(branch._id), branch.code, branch.name].filter(Boolean);

    const studentCountAgg = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $addFields: {
          branchRefStr: { $toString: '$branch' },
          departmentRefStr: { $toString: '$department' },
          branchListRefStr: {
            $map: {
              input: { $ifNull: ['$branches', []] },
              as: 'branchRef',
              in: { $toString: '$$branchRef' }
            }
          }
        }
      },
      {
        $match: {
          $or: [
            { branchRefStr: { $in: branchLookupValues } },
            { departmentRefStr: { $in: branchLookupValues } },
            {
              $expr: {
                $gt: [
                  {
                    $size: {
                      $setIntersection: ['$branchListRefStr', branchLookupValues]
                    }
                  },
                  0
                ]
              }
            }
          ]
        }
      },
      { $count: 'count' }
    ]);

    const students = studentCountAgg[0]?.count || 0;

    const totalSeats = Number(branch.totalSeats || 0);
    const availableSeats = Math.max(totalSeats - students, 0);

    res.json({
      success: true,
      branch,
      stats: {
        subjectCount: subjects.length,
        studentCount: students,
        availableSeats,
        capacityPercent: totalSeats > 0 ? Math.min(100, Math.round((students / totalSeats) * 100)) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/academic/branches/:id/students
// @desc    Get students assigned to a branch
// @access  Private/Admin/HOD/Teacher/Coordinator
router.get('/branches/:id/students', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { semesterId } = req.query;
    const branch = await Branch.findById(req.params.id).populate('semesterId', 'semesterNumber academicYear');

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    if (req.user.role === 'hod') {
      const scope = getHodBranchScope(req.user);
      if (!scope.includes(String(branch._id))) {
        return res.status(403).json({ success: false, message: 'Not allowed for this branch' });
      }
    }

    if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope || String(scope.branchId) !== String(branch._id)) {
        return res.status(403).json({ success: false, message: 'Not allowed for this branch' });
      }
      if (semesterId && scope.semesterIds.length > 0 && !scope.semesterIds.includes(String(semesterId))) {
        return res.status(403).json({ success: false, message: 'Not allowed for this semester' });
      }
    }

    if (req.user.role === 'teacher') {
      const scope = await getTeacherScope(req.user);
      if (!scope.branchIds.includes(String(branch._id))) {
        return res.status(403).json({ success: false, message: 'Not allowed for this branch' });
      }
      if (semesterId && scope.semesterIds.length > 0 && !scope.semesterIds.includes(String(semesterId))) {
        return res.status(403).json({ success: false, message: 'Not allowed for this semester' });
      }
    }

    const branchLookupValues = [String(branch._id), branch.code, branch.name].filter(Boolean);

    const students = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $addFields: {
          branchRefStr: { $toString: '$branch' },
          departmentRefStr: { $toString: '$department' },
          branchListRefStr: {
            $map: {
              input: { $ifNull: ['$branches', []] },
              as: 'branchRef',
              in: { $toString: '$$branchRef' }
            }
          }
        }
      },
      {
        $match: {
          $or: [
            { branchRefStr: { $in: branchLookupValues } },
            { departmentRefStr: { $in: branchLookupValues } },
            {
              $expr: {
                $gt: [
                  {
                    $size: {
                      $setIntersection: ['$branchListRefStr', branchLookupValues]
                    }
                  },
                  0
                ]
              }
            }
          ]
        }
      },
      ...(semesterId ? [{
        $match: {
          $expr: {
            $eq: [{ $toString: '$semester' }, String(semesterId)]
          }
        }
      }] : []),
      {
        $project: {
          name: 1,
          email: 1,
          enrollmentNumber: 1,
          mobile: 1,
          status: 1,
          semester: 1,
          profileUpdateRequired: 1,
          createdAt: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    await User.populate(students, { path: 'semester', select: 'semesterNumber academicYear' });

    const overrideSeat = Array.isArray(branch.semesterSeatOverrides)
      ? branch.semesterSeatOverrides.find((item) => String(item.semester) === String(semesterId || branch.semesterId?._id || branch.semesterId))
      : null;
    const totalSeats = Number(overrideSeat?.totalSeats ?? branch.totalSeats ?? 0);
    const enrolledStudents = students.length;
    const availableSeats = Math.max(totalSeats - enrolledStudents, 0);

    res.json({
      success: true,
      branch,
      stats: {
        totalSeats,
        enrolledStudents,
        availableSeats,
        capacityPercent: totalSeats > 0 ? Math.min(100, Math.round((enrolledStudents / totalSeats) * 100)) : 0
      },
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/academic/branches/:id/semester-capacity
// @desc    Set branch seat capacity for specific semester
// @access  Private/Admin/HOD
router.put('/branches/:id/semester-capacity', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { semesterId, totalSeats } = req.body;

    if (!semesterId || totalSeats === undefined) {
      return res.status(400).json({ success: false, message: 'semesterId and totalSeats are required' });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    if (req.user.role === 'hod') {
      const scope = getHodBranchScope(req.user);
      if (!scope.includes(String(branch._id))) {
        return res.status(403).json({ success: false, message: 'Not allowed to modify this branch capacity' });
      }
    }

    const parsedSeats = Math.max(0, Number(totalSeats));
    const existingIdx = (branch.semesterSeatOverrides || []).findIndex((item) => String(item.semester) === String(semesterId));

    if (existingIdx >= 0) {
      branch.semesterSeatOverrides[existingIdx].totalSeats = parsedSeats;
    } else {
      branch.semesterSeatOverrides.push({ semester: semesterId, totalSeats: parsedSeats });
    }

    await branch.save();

    res.json({
      success: true,
      message: 'Semester capacity updated successfully',
      data: {
        branchId: branch._id,
        semesterId,
        totalSeats: parsedSeats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/academic/branches/:branchId/students/:studentId
// @desc    Update student assignment/status from branch view
// @access  Private/Admin/HOD/Teacher/Coordinator
router.put('/branches/:branchId/students/:studentId', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { branchId, studentId } = req.params;
    const { semesterId, status } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (String(student.branch) !== String(branchId) && String(student.department) !== String(branchId)) {
      return res.status(400).json({ success: false, message: 'Student is not assigned to this branch' });
    }

    if (req.user.role === 'hod') {
      const scope = getHodBranchScope(req.user);
      if (!scope.includes(String(branchId))) {
        return res.status(403).json({ success: false, message: 'Not allowed for this branch' });
      }
    }

    if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope || String(scope.branchId) !== String(branchId)) {
        return res.status(403).json({ success: false, message: 'Not allowed for this branch' });
      }
    }

    if (req.user.role === 'teacher') {
      const scope = await getTeacherScope(req.user);
      if (!scope.branchIds.includes(String(branchId))) {
        return res.status(403).json({ success: false, message: 'Not allowed for this branch' });
      }
    }

    if (semesterId) student.semester = semesterId;
    if (status && ['active', 'disabled', 'pending'].includes(status)) student.status = status;
    await student.save();

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/academic/branches
// @desc    Create new branch
// @access  Private/Admin
router.post('/branches', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, semesterId, description, totalSeats, isActive } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and code'
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

    // If semester is provided, ensure it exists
    if (semesterId) {
      const semester = await Semester.findById(semesterId);
      if (!semester) {
        return res.status(404).json({
          success: false,
          message: 'Semester not found'
        });
      }
    }

    // Check if branch name already exists
    const nameFilter = {
      name: new RegExp(`^${name}$`, 'i')
    };
    if (semesterId) {
      nameFilter.semesterId = semesterId;
    }

    const existingName = await Branch.findOne(nameFilter);
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: semesterId ? 'Branch name already exists in this semester' : 'Branch name already exists'
      });
    }

    const branch = new Branch({
      name,
      code: code.toUpperCase(),
      ...(semesterId ? { semesterId } : {}),
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
    await Subject.deleteMany({
      $or: [
        { branchId: branch._id },
        { 'offerings.branchId': branch._id }
      ]
    });

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
// @desc    Get all subjects with filters (ADMIN, HOD)
// @access  Private/Admin/HOD
router.get('/subjects/admin/list', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { branchId, semesterId, type, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check HOD scope first
    let hodBranchIds = [];
    if (req.user.role === 'hod') {
      const hodBranchScope = getHodBranchScope(req.user);
      if (!hodBranchScope.length) {
        return res.json({ success: true, subjects: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      hodBranchIds = hodBranchScope.map(id => new mongoose.Types.ObjectId(String(id)));
    }

    const filter = {};
    
    if (branchId && semesterId) {
      const semesterObjectId = mongoose.Types.ObjectId.isValid(String(semesterId))
        ? new mongoose.Types.ObjectId(String(semesterId))
        : null;
      const branchObjectId = mongoose.Types.ObjectId.isValid(String(branchId))
        ? new mongoose.Types.ObjectId(String(branchId))
        : null;

      filter.$or = [
        { branchId, semesterId },
        semesterObjectId && branchObjectId
          ? { offerings: { $elemMatch: { branchId: branchObjectId, semesterId: semesterObjectId } } }
          : { _id: null }
      ];
    } else if (branchId) {
      const branchObjectId = mongoose.Types.ObjectId.isValid(String(branchId))
        ? new mongoose.Types.ObjectId(String(branchId))
        : null;
      filter.$or = [
        { branchId },
        branchObjectId ? { 'offerings.branchId': branchObjectId } : { _id: null }
      ];
    } else if (semesterId) {
      const semesterObjectId = mongoose.Types.ObjectId.isValid(String(semesterId))
        ? new mongoose.Types.ObjectId(String(semesterId))
        : null;
      filter.$or = [
        { semesterId },
        semesterObjectId ? { 'offerings.semesterId': semesterObjectId } : { _id: null }
      ];
    }
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Apply HOD branch scope if applicable
    if (req.user.role === 'hod' && hodBranchIds.length > 0) {
      const hodBranchFilter = {
        $or: [
          { branchId: { $in: hodBranchIds } },
          { 'offerings.branchId': { $in: hodBranchIds } }
        ]
      };
      
      if (filter.$or) {
        // If there's already an $or clause, wrap both with $and
        filter.$and = [
          { $or: filter.$or },
          hodBranchFilter
        ];
        delete filter.$or;
      } else if (Object.keys(filter).length > 0) {
        // If there are other filters, combine them
        filter.$and = [
          filter,
          hodBranchFilter
        ];
      } else {
        // No other filters, just use HOD filter
        Object.assign(filter, hodBranchFilter);
      }
    }

    const subjects = await Subject.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'semesterNumber academicYear')
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
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'semesterNumber academicYear')
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
// @access  Private/Admin/HOD
router.post('/subjects', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      credits,
      branchId,
      semesterId,
      offerings,
      description,
      syllabus,
      marks,
      isActive
    } = req.body;

    const normalizedOfferings = Array.isArray(offerings)
      ? offerings
        .map((item) => ({
          branchId: item?.branchId ? String(item.branchId) : '',
          semesterId: item?.semesterId ? String(item.semesterId) : ''
        }))
        .filter((item) => item.branchId && item.semesterId)
      : [];

    if (normalizedOfferings.length === 0 && branchId && semesterId) {
      normalizedOfferings.push({ branchId: String(branchId), semesterId: String(semesterId) });
    }

    const dedupOfferingsMap = new Map();
    normalizedOfferings.forEach((item) => {
      dedupOfferingsMap.set(`${item.branchId}:${item.semesterId}`, item);
    });
    const uniqueOfferings = Array.from(dedupOfferingsMap.values());

    // Validation
    if (!name || !code || !type || uniqueOfferings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, type, and at least one branch-semester mapping'
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

    if (req.user.role === 'hod') {
      const branchIds = [];
      if (req.user.branch) branchIds.push(String(req.user.branch));
      if (req.user.department) branchIds.push(String(req.user.department));
      if (Array.isArray(req.user.branches) && req.user.branches.length > 0) {
        branchIds.push(...req.user.branches.map((id) => String(id)));
      }

      const hasUnauthorizedBranch = uniqueOfferings.some((item) => !branchIds.includes(String(item.branchId)));
      if (branchIds.length === 0 || hasUnauthorizedBranch) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create subjects for one or more selected branches'
        });
      }
    }

    const branchIdsToCheck = Array.from(new Set(uniqueOfferings.map((item) => item.branchId)));
    const semesterIdsToCheck = Array.from(new Set(uniqueOfferings.map((item) => item.semesterId)));

    const [branchCount, semesterCount] = await Promise.all([
      Branch.countDocuments({ _id: { $in: branchIdsToCheck } }),
      Semester.countDocuments({ _id: { $in: semesterIdsToCheck } })
    ]);

    if (branchCount !== branchIdsToCheck.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected branches were not found'
      });
    }

    if (semesterCount !== semesterIdsToCheck.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected semesters were not found'
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

    const firstOffering = uniqueOfferings[0];

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      type,
      credits: credits || 0,
      branchId: firstOffering.branchId,
      semesterId: firstOffering.semesterId,
      offerings: uniqueOfferings,
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
// @access  Private/Admin/HOD/Teacher
router.put('/subjects/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      credits,
      branchId,
      semesterId,
      offerings,
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

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      const subjectId = String(subject._id);
      const subjectBranchId = String(subject.branchId);

      if (req.user.role === 'teacher') {
        const assignedSubjects = Array.isArray(req.user.assignedSubjects)
          ? req.user.assignedSubjects.map((id) => String(id))
          : [];

        if (assignedSubjects.length === 0 || !assignedSubjects.includes(subjectId)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to modify this subject'
          });
        }
      }

      if (req.user.role === 'hod') {
        const branchIds = [];
        if (req.user.branch) branchIds.push(String(req.user.branch));
        if (req.user.department) branchIds.push(String(req.user.department));
        if (Array.isArray(req.user.branches) && req.user.branches.length > 0) {
          branchIds.push(...req.user.branches.map((id) => String(id)));
        }

        if (branchIds.length === 0 || !branchIds.includes(subjectBranchId)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to modify this subject'
          });
        }
      }
    }

    let normalizedOfferings = Array.isArray(offerings)
      ? offerings
        .map((item) => ({
          branchId: item?.branchId ? String(item.branchId) : '',
          semesterId: item?.semesterId ? String(item.semesterId) : ''
        }))
        .filter((item) => item.branchId && item.semesterId)
      : [];

    if (normalizedOfferings.length === 0 && branchId && semesterId) {
      normalizedOfferings.push({ branchId: String(branchId), semesterId: String(semesterId) });
    }

    if (normalizedOfferings.length === 0) {
      normalizedOfferings = Array.isArray(subject.offerings) && subject.offerings.length > 0
        ? subject.offerings.map((item) => ({
          branchId: String(item.branchId),
          semesterId: String(item.semesterId)
        }))
        : [{ branchId: String(subject.branchId), semesterId: String(subject.semesterId) }];
    }

    const dedupOfferings = new Map();
    normalizedOfferings.forEach((item) => {
      dedupOfferings.set(`${item.branchId}:${item.semesterId}`, item);
    });
    let uniqueOfferings = Array.from(dedupOfferings.values());

    if (req.user.role === 'teacher') {
      uniqueOfferings = Array.isArray(subject.offerings) && subject.offerings.length > 0
        ? subject.offerings.map((item) => ({
          branchId: String(item.branchId),
          semesterId: String(item.semesterId)
        }))
        : [{ branchId: String(subject.branchId), semesterId: String(subject.semesterId) }];
    }

    if (req.user.role === 'hod') {
      const branchIds = [];
      if (req.user.branch) branchIds.push(String(req.user.branch));
      if (req.user.department) branchIds.push(String(req.user.department));
      if (Array.isArray(req.user.branches) && req.user.branches.length > 0) {
        branchIds.push(...req.user.branches.map((id) => String(id)));
      }

      const hasUnauthorizedBranch = uniqueOfferings.some((item) => !branchIds.includes(String(item.branchId)));
      if (branchIds.length === 0 || hasUnauthorizedBranch) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to assign one or more selected branches'
        });
      }
    }

    const branchIdsToCheck = Array.from(new Set(uniqueOfferings.map((item) => item.branchId)));
    const semesterIdsToCheck = Array.from(new Set(uniqueOfferings.map((item) => item.semesterId)));

    const [branchCount, semesterCount] = await Promise.all([
      Branch.countDocuments({ _id: { $in: branchIdsToCheck } }),
      Semester.countDocuments({ _id: { $in: semesterIdsToCheck } })
    ]);

    if (branchCount !== branchIdsToCheck.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected branches were not found'
      });
    }

    if (semesterCount !== semesterIdsToCheck.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected semesters were not found'
      });
    }

    const firstOffering = uniqueOfferings[0];

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
        branchId: firstOffering.branchId,
        semesterId: firstOffering.semesterId,
        offerings: uniqueOfferings,
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
// @access  Private/Admin/HOD/Teacher
router.delete('/subjects/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      const subjectId = String(subject._id);
      const subjectBranchId = String(subject.branchId);

      if (req.user.role === 'teacher') {
        const assignedSubjects = Array.isArray(req.user.assignedSubjects)
          ? req.user.assignedSubjects.map((id) => String(id))
          : [];

        if (assignedSubjects.length === 0 || !assignedSubjects.includes(subjectId)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this subject'
          });
        }
      }

      if (req.user.role === 'hod') {
        const branchIds = [];
        if (req.user.branch) branchIds.push(String(req.user.branch));
        if (req.user.department) branchIds.push(String(req.user.department));
        if (Array.isArray(req.user.branches) && req.user.branches.length > 0) {
          branchIds.push(...req.user.branches.map((id) => String(id)));
        }

        if (branchIds.length === 0 || !branchIds.includes(subjectBranchId)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this subject'
          });
        }
      }
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
// @desc    Get academic hierarchy (full for admin, scoped for staff)
// @access  Private/Admin/HOD/Teacher/Coordinator
router.get('/structure', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const toUniqueStrings = (values) => Array.from(new Set((Array.isArray(values) ? values : [])
      .filter(Boolean)
      .map((value) => String(value))));

    let semesters = [];
    let branches = [];
    let subjects = [];

    if (req.user.role === 'admin') {
      [semesters, branches, subjects] = await Promise.all([
        Semester.find().sort({ semesterNumber: 1 }),
        Branch.find().sort({ name: 1 }),
        Subject.find({ isActive: true })
          .select('name code type marks credits branchId semesterId')
          .sort({ name: 1 })
      ]);
    } else {
      let scopedBranchIds = [];
      let scopedSemesterIds = [];

      if (req.user.role === 'hod') {
        scopedBranchIds = toUniqueStrings(getHodBranchScope(req.user));
      }

      if (req.user.role === 'teacher') {
        const scope = await getTeacherScope(req.user);
        scopedBranchIds = toUniqueStrings(scope.branchIds);
        scopedSemesterIds = toUniqueStrings(scope.semesterIds);
      }

      if (req.user.role === 'coordinator') {
        const scope = getCoordinatorScope(req.user);
        if (!scope || !scope.branchId) {
          return res.json({ success: true, structure: [] });
        }
        scopedBranchIds = toUniqueStrings([scope.branchId]);
        scopedSemesterIds = toUniqueStrings(scope.semesterIds);
      }

      if (scopedBranchIds.length === 0) {
        return res.json({ success: true, structure: [] });
      }

      const subjectQuery = {
        isActive: true,
        branchId: { $in: uniqueObjectIds(scopedBranchIds) }
      };

      if (scopedSemesterIds.length > 0) {
        subjectQuery.semesterId = { $in: uniqueObjectIds(scopedSemesterIds) };
      }

      subjects = await Subject.find(subjectQuery)
        .select('name code type marks credits branchId semesterId')
        .sort({ name: 1 });

      const effectiveBranchIds = uniqueObjectIds(toUniqueStrings([
        ...scopedBranchIds,
        ...subjects.map((subject) => subject.branchId)
      ]));

      branches = effectiveBranchIds.length > 0
        ? await Branch.find({ _id: { $in: effectiveBranchIds } }).sort({ name: 1 })
        : [];

      const effectiveSemesterIds = uniqueObjectIds(toUniqueStrings([
        ...scopedSemesterIds,
        ...branches.map((branch) => branch.semesterId),
        ...subjects.map((subject) => subject.semesterId)
      ]));

      semesters = effectiveSemesterIds.length > 0
        ? await Semester.find({ _id: { $in: effectiveSemesterIds } }).sort({ semesterNumber: 1 })
        : [];
    }

    const semesterMap = new Map();
    semesters.forEach((semester) => {
      semesterMap.set(String(semester._id), {
        ...semester.toObject(),
        branches: []
      });
    });

    const branchMap = new Map(branches.map((branch) => [String(branch._id), branch]));
    const semesterBranchMap = new Map();

    const ensureBranchInSemester = (semesterId, branchId) => {
      const semKey = String(semesterId);
      const brKey = String(branchId);
      const semesterNode = semesterMap.get(semKey);
      const branchNode = branchMap.get(brKey);

      if (!semesterNode || !branchNode) return null;

      const branchBucketKey = `${semKey}:${brKey}`;
      if (!semesterBranchMap.has(branchBucketKey)) {
        const entry = {
          ...branchNode.toObject(),
          subjects: []
        };
        semesterNode.branches.push(entry);
        semesterBranchMap.set(branchBucketKey, entry);
      }

      return semesterBranchMap.get(branchBucketKey);
    };

    branches.forEach((branch) => {
      if (branch.semesterId) {
        ensureBranchInSemester(branch.semesterId, branch._id);
      }
    });

    subjects.forEach((subject) => {
      if (!subject.branchId || !subject.semesterId) return;
      const targetBranch = ensureBranchInSemester(subject.semesterId, subject.branchId);
      if (!targetBranch) return;

      targetBranch.subjects.push({
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        type: subject.type,
        marks: subject.marks,
        credits: subject.credits
      });
    });

    const structure = semesters.map((semester) => {
      const semNode = semesterMap.get(String(semester._id));
      semNode.branches.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      semNode.branches.forEach((branch) => {
        branch.subjects.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      });
      return semNode;
    });

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

// ======================
// SYLLABUS ROUTES
// ======================

// @route   GET /api/academic/subjects/:id/syllabus
// @desc    Get syllabus link for a subject
// @access  Private
router.get('/subjects/:id/syllabus', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const subject = await Subject.findById(id).select('name code syllabus');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.json({
      success: true,
      data: {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        syllabus: subject.syllabus || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/academic/subjects/:id/syllabus
// @desc    Update syllabus PDF link for a subject
// @access  Private/Authorized
router.put('/subjects/:id/syllabus', protect, authorize('teacher', 'hod', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { syllabus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const nextSyllabus = (syllabus || '').trim();

    if (nextSyllabus) {
      try {
        const parsed = new URL(nextSyllabus);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return res.status(400).json({ success: false, message: 'Only HTTP/HTTPS links are allowed' });
        }
      } catch (_) {
        return res.status(400).json({ success: false, message: 'Please provide a valid syllabus URL' });
      }

      // Keep syllabus restricted to PDF links.
      if (!/\.pdf($|\?)/i.test(nextSyllabus)) {
        return res.status(400).json({ success: false, message: 'Only PDF links are allowed for syllabus' });
      }
    }

    subject.syllabus = nextSyllabus || null;
    await subject.save();

    res.json({
      success: true,
      message: 'Syllabus updated successfully',
      data: {
        subjectId: subject._id,
        syllabus: subject.syllabus || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'hod';
    if (!isPrivileged && String(req.user._id) !== String(req.params.teacherId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these subjects'
      });
    }

    const teacher = await User.findById(req.params.teacherId).populate({
      path: 'assignedSubjects',
      populate: [
        { path: 'branchId', select: 'name code' },
        { path: 'semesterId', select: 'semesterNumber academicYear' }
      ]
    });
    
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
