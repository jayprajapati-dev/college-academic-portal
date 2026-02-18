const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');
const crypto = require('crypto');
const { ROLE_DEFAULTS, getRoleDefaults } = require('../utils/rolePermissions');
const { getCoordinatorStatus } = require('../utils/coordinatorScheduler');

// Generate random password
const generateTempPassword = () => {
  return crypto.randomBytes(4).toString('hex'); // 8 character password
};

const getHodBranchScope = (user) => ([
  ...(Array.isArray(user.branches) ? user.branches : []),
  user.branch,
  user.department
].filter(Boolean));

const getCoordinatorScope = (user) => {
  const assignment = user?.coordinator;
  if (!assignment || assignment.status === 'expired') return null;
  return {
    branchId: assignment.branch,
    semesterIds: Array.isArray(assignment.semesters) ? assignment.semesters : []
  };
};

const logActivity = async (payload) => {
  try {
    await ActivityLog.create(payload);
  } catch (error) {
    console.error('Activity log error:', error);
  }
};

// @route   POST /api/admin/add-hod
// @desc    Create HOD with temp password and branch assignments
// @access  Private/Admin
router.post('/add-hod', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, mobile, email, branchIds = [], semesterIds = [], subjectIds = [] } = req.body;

    // Validation
    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and mobile number'
      });
    }

    // Validate mobile format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this mobile number already exists'
      });
    }

    // Verify at least one branch is provided
    if (!branchIds || branchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one branch'
      });
    }

    // Verify all branches exist
    const branches = await Branch.find({ _id: { $in: branchIds } });
    if (branches.length !== branchIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more branches not found'
      });
    }

    // Verify semesters if provided
    let semesters = [];
    if (semesterIds && semesterIds.length > 0) {
      semesters = await Semester.find({ _id: { $in: semesterIds } });
      if (semesters.length !== semesterIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more semesters not found'
        });
      }
    }

    // Verify subjects if provided
    let subjects = [];
    if (subjectIds && subjectIds.length > 0) {
      subjects = await Subject.find({ _id: { $in: subjectIds } });
      if (subjects.length !== subjectIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more subjects not found'
        });
      }
    }

    // Generate temp password
    const tempPassword = generateTempPassword();

    // Create HOD with new schema
    const hod = await User.create({
      name,
      mobile,
      email: email || `${mobile}@college.edu`,
      role: 'hod',
      branches: branchIds,
      semesters: semesterIds,
      subjects: subjectIds,
      department: branchIds[0], // Primary branch as department
      tempPassword: tempPassword,
      password: tempPassword, // Will be hashed, replaced during first login
      status: 'active',
      passwordChangeRequired: true,
      addedBy: req.user._id,
      addedByRole: req.user.role
    });

    // Populate relationships
    await hod.populate('branches semesters subjects department');

    res.status(201).json({
      success: true,
      message: 'HOD created successfully. Share the temp password with the HOD.',
      data: {
        id: hod._id,
        name: hod.name,
        mobile: hod.mobile,
        email: hod.email,
        role: hod.role,
        branches: hod.branches.map(b => ({ id: b._id, name: b.name })),
        semesters: hod.semesters.map(s => ({ id: s._id, name: s.name })),
        subjects: hod.subjects.map(s => ({ id: s._id, name: s.name })),
        department: hod.department?.name,
        tempPassword: tempPassword, // Share with HOD
        passwordChangeRequired: true,
        status: hod.status,
        setupInstructions: 'HOD should login with mobile + temp password and complete first-login flow'
      }
    });
  } catch (error) {
    console.error('Add HOD error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in adding HOD'
    });
  }
});

// @route   POST /api/admin/add-teacher
// @desc    Create Teacher with temp password and assignments
// @access  Private/Admin or HOD
router.post('/add-teacher', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { name, mobile, email, branchIds = [], semesterIds = [], subjectIds = [] } = req.body;

    // Validation
    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and mobile number'
      });
    }

    // Validate mobile format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this mobile number already exists'
      });
    }

    // Verify at least one branch is provided
    if (!branchIds || branchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one branch'
      });
    }

    // Verify all branches exist
    const branches = await Branch.find({ _id: { $in: branchIds } });
    if (branches.length !== branchIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more branches not found'
      });
    }

    // Verify at least one semester is provided
    if (!semesterIds || semesterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one semester'
      });
    }

    // Verify all semesters exist
    const semesters = await Semester.find({ _id: { $in: semesterIds } });
    if (semesters.length !== semesterIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more semesters not found'
      });
    }

    // Verify subjects if provided
    let subjects = [];
    if (subjectIds && subjectIds.length > 0) {
      subjects = await Subject.find({ _id: { $in: subjectIds } });
      if (subjects.length !== subjectIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more subjects not found'
        });
      }
    }

    // Generate temp password
    const tempPassword = generateTempPassword();

    // Create teacher with new schema
    const teacher = await User.create({
      name,
      mobile,
      email: email || `${mobile}@college.edu`,
      role: 'teacher',
      branches: branchIds,
      semesters: semesterIds,
      subjects: subjectIds,
      tempPassword: tempPassword,
      password: tempPassword, // Will be hashed, replaced during first login
      status: 'active',
      passwordChangeRequired: true,
      addedBy: req.user._id,
      addedByRole: req.user.role
    });

    // Update subjects with teacher assignment
    if (subjectIds && subjectIds.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { teacher: teacher._id }
      );
    }

    // Populate relationships
    await teacher.populate('branches semesters subjects');

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully. Share the temp password with the teacher.',
      data: {
        id: teacher._id,
        name: teacher.name,
        mobile: teacher.mobile,
        email: teacher.email,
        role: teacher.role,
        branches: teacher.branches.map(b => ({ id: b._id, name: b.name })),
        semesters: teacher.semesters.map(s => ({ id: s._id, name: s.name })),
        subjects: teacher.subjects.map(s => ({ id: s._id, name: s.name })),
        tempPassword: tempPassword, // Share with teacher
        passwordChangeRequired: true,
        status: teacher.status,
        setupInstructions: 'Teacher should login with mobile + temp password and complete first-login flow'
      }
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in adding teacher'
    });
  }
});

// @route   POST /api/admin/add-admin
// @desc    Create Admin with temp password
// @access  Private/Admin
router.post('/add-admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, mobile, email } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and mobile number'
      });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this mobile number already exists'
      });
    }

    const tempPassword = generateTempPassword();

    const admin = await User.create({
      name,
      mobile,
      email: email || `${mobile}@college.edu`,
      role: 'admin',
      adminAccess: true,
      tempPassword: tempPassword,
      password: 'temp',
      status: 'active',
      passwordSetupRequired: true,
      addedBy: req.user._id,
      addedByRole: req.user.role
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully. Share the temp password with the admin.',
      data: {
        id: admin._id,
        name: admin.name,
        mobile: admin.mobile,
        email: admin.email,
        role: admin.role,
        tempPassword: tempPassword,
        passwordSetupRequired: true,
        status: admin.status,
        setupInstructions: 'Admin should visit password-setup page and enter mobile + temp password'
      }
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in adding admin'
    });
  }
});

// @route   GET /api/admin/activity
// @desc    Get activity logs
// @access  Private/Admin/HOD/Coordinator
router.get('/activity', protect, authorize('admin', 'hod', 'coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const queryParts = [];

    if (req.user.role === 'hod') {
      const branchScope = getHodBranchScope(req.user).map((id) => String(id));
      if (branchScope.length > 0) {
        queryParts.push({ 'scope.branchId': { $in: branchScope } });
      }
    }

    if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope || !scope.branchId) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      queryParts.push({ 'scope.branchId': scope.branchId });
      if (scope.semesterIds.length > 0) {
        queryParts.push({ 'scope.semesterIds': { $in: scope.semesterIds } });
      }
    }

    const query = queryParts.length ? { $and: queryParts } : {};
    const logs = await ActivityLog.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in fetching activity logs'
    });
  }
});
// @route   GET /api/admin/users
// @desc    Get users with pagination and filters
// @access  Private/Admin/HOD/Teacher/Coordinator (scoped)
router.get('/users', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search, scope } = req.query;
    const isAdmin = req.user.role === 'admin' || req.user.adminAccess === true;
    const useRoleScope = !isAdmin || (scope === 'role' && req.user.role !== 'admin');
    const queryParts = [];

    if (status && status !== 'all') {
      queryParts.push({ status });
    }

    if (search) {
      queryParts.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (!useRoleScope) {
      // Admin mode - no role scope restrictions
      if (role && role !== 'all') {
        if (role === 'admin') {
          queryParts.push({ $or: [{ role: 'admin' }, { adminAccess: true }] });
        } else {
          queryParts.push({ role });
        }
      }
      // If no role specified, default to showing all non-admin users for clarity
      // This allows listing all users by default
    } else if (req.user.role === 'hod') {
      const branchIds = getHodBranchScope(req.user);

      if (branchIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      if (role && !['teacher', 'student', 'coordinator', 'all'].includes(role)) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      const teacherQuery = {
        role: 'teacher',
        $or: [
          { branch: { $in: branchIds } },
          { branches: { $in: branchIds } },
          { department: { $in: branchIds } }
        ]
      };
      const studentQuery = { role: 'student', branch: { $in: branchIds } };
      const coordinatorQuery = {
        role: 'coordinator',
        'coordinator.branch': { $in: branchIds }
      };
      const scopedRoleQuery = role === 'teacher'
        ? teacherQuery
        : role === 'student'
          ? studentQuery
          : role === 'coordinator'
            ? coordinatorQuery
            : { $or: [teacherQuery, studentQuery, coordinatorQuery] };

      queryParts.push(scopedRoleQuery);
    } else if (req.user.role === 'teacher') {
      if (role && !['student', 'all'].includes(role)) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      const assigned = Array.isArray(req.user.assignedSubjects) ? req.user.assignedSubjects : [];
      if (assigned.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      const subjectDocs = await Subject.find({ _id: { $in: assigned } }).select('branchId semesterId');
      const branchIds = Array.from(new Set(subjectDocs.map((s) => s.branchId).filter(Boolean)));
      const semesterIds = Array.from(new Set(subjectDocs.map((s) => s.semesterId).filter(Boolean)));

      const studentQuery = { role: 'student' };
      if (branchIds.length) studentQuery.branch = { $in: branchIds };
      if (semesterIds.length) studentQuery.semester = { $in: semesterIds };

      queryParts.push(studentQuery);
    } else if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope || !scope.branchId) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      if (role && !['student', 'all'].includes(role)) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          data: []
        });
      }

      const studentQuery = { role: 'student', branch: scope.branchId };
      if (scope.semesterIds.length > 0) {
        studentQuery.semester = { $in: scope.semesterIds };
      }
      queryParts.push(studentQuery);
    }

    const query = queryParts.length ? { $and: queryParts } : {};

    // Execute query with pagination
    const users = await User.find(query)
      .populate('branch semester assignedSubjects assignedHOD')
      .select('-password -tempPassword -securityAnswer')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get total count
    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in fetching users'
    });
  }
});

// @route   GET /api/admin/user/:id
// @desc    Get single user details
// @access  Private/Admin
router.get('/user/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('branch semester assignedSubjects assignedHOD')
      .select('-password -tempPassword -securityAnswer');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in fetching user'
    });
  }
});

// @route   PUT /api/admin/user/:id/status
// @desc    Activate/Deactivate user
// @access  Private/Admin/Coordinator
router.put('/user/:id/status', protect, authorize('admin', 'coordinator'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "disabled"'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.role === 'coordinator') {
      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Coordinators can only update student status'
        });
      }

      const scope = getCoordinatorScope(req.user);
      const inBranch = scope && String(user.branch) === String(scope.branchId);
      const inSemester = scope && (!scope.semesterIds.length || scope.semesterIds.map(String).includes(String(user.semester)));
      if (!inBranch || !inSemester) {
        return res.status(403).json({
          success: false,
          message: 'You can only update students in your assigned classes'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: status === 'active' ? 'unblock_student' : 'block_student',
      targetType: 'User',
      targetId: updatedUser._id,
      targetLabel: updatedUser.name,
      scope: {
        branchId: updatedUser.branch || null,
        semesterIds: updatedUser.semester ? [updatedUser.semester] : []
      }
    });

    res.status(200).json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in updating user status'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Private/Admin
router.put('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'hod', 'teacher', 'student', 'coordinator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (role === 'coordinator') {
      return res.status(400).json({
        success: false,
        message: 'Use coordinator assignment to set coordinator role'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't change admin's role
    if (user.role === 'admin' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change admin role'
      });
    }

    user.role = role;
    if (user.coordinator) {
      user.coordinator = {
        ...user.coordinator,
        status: 'expired',
        revokedAt: new Date()
      };
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role changed to ${role} successfully`,
      data: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in updating user role'
    });
  }
});

// @route   POST /api/admin/users/:id/coordinator
// @desc    Assign coordinator role with scope and validity
// @access  Private/Admin/HOD
router.post('/users/:id/coordinator', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { branchId, semesterIds = [], academicYear, validFrom, validTill } = req.body;

    if (!branchId || !Array.isArray(semesterIds) || semesterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Branch and at least one semester are required'
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
    }

    const validFromDate = validFrom ? new Date(validFrom) : null;
    const validTillDate = validTill ? new Date(validTill) : null;
    if (validFromDate && Number.isNaN(validFromDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid valid from date'
      });
    }

    if (validTillDate && Number.isNaN(validTillDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid valid till date'
      });
    }

    if (validFromDate && validTillDate && validFromDate.getTime() > validTillDate.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Valid from must be before valid till'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin' || user.role === 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only teacher or HOD can be assigned as coordinator'
      });
    }

    if (req.user.role === 'hod' && user.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'HOD can only assign coordinator from teachers'
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const semesters = await Semester.find({ _id: { $in: semesterIds } });
    if (semesters.length !== semesterIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more semesters not found'
      });
    }

    if (req.user.role === 'hod') {
      const branchScope = getHodBranchScope(req.user).map((id) => String(id));
      if (!branchScope.includes(String(branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign coordinators within your branch'
        });
      }

      const allowedSemesters = Array.isArray(req.user.semesters) ? req.user.semesters.map((id) => String(id)) : [];
      if (allowedSemesters.length > 0) {
        const invalidSemester = semesterIds.some((id) => !allowedSemesters.includes(String(id)));
        if (invalidSemester) {
          return res.status(403).json({
            success: false,
            message: 'You can only assign coordinators within your semesters'
          });
        }
      }
    }

    const baseRole = user.role === 'coordinator'
      ? (user.coordinator?.baseRole || 'teacher')
      : user.role;

    user.role = 'coordinator';
    user.coordinator = {
      branch: branchId,
      semesters: semesterIds,
      academicYear: String(academicYear).trim(),
      validFrom: validFromDate,
      validTill: validTillDate,
      graceDays: 0,
      baseRole,
      status: getCoordinatorStatus({
        validTill: validTillDate,
        graceDays: 0
      }, new Date()),
      assignedAt: new Date(),
      revokedAt: null
    };

    await user.save();

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'assign_coordinator',
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.name,
      scope: {
        branchId,
        semesterIds
      }
    });

    res.status(200).json({
      success: true,
      message: 'Coordinator assigned successfully',
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        coordinator: user.coordinator
      }
    });
  } catch (error) {
    console.error('Assign coordinator error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in assigning coordinator'
    });
  }
});

// @route   DELETE /api/admin/users/:id/coordinator
// @desc    Revoke coordinator role and revert to base role
// @access  Private/Admin/HOD
router.delete('/users/:id/coordinator', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'coordinator') {
      return res.status(400).json({
        success: false,
        message: 'User is not a coordinator'
      });
    }

    if (req.user.role === 'hod') {
      const branchScope = getHodBranchScope(req.user).map((id) => String(id));
      if (!branchScope.includes(String(user.coordinator?.branch))) {
        return res.status(403).json({
          success: false,
          message: 'You can only revoke coordinators within your branch'
        });
      }
    }

    const baseRole = user.coordinator?.baseRole || 'teacher';
    user.role = baseRole;
    user.coordinator = {
      ...user.coordinator,
      status: 'expired',
      revokedAt: new Date()
    };

    await user.save();

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'revoke_coordinator',
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.name,
      scope: {
        branchId: user.coordinator?.branch || null,
        semesterIds: user.coordinator?.semesters || []
      }
    });

    res.status(200).json({
      success: true,
      message: 'Coordinator revoked successfully',
      data: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Revoke coordinator error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in revoking coordinator'
    });
  }
});

// @route   PUT /api/admin/users/:id/admin-access
// @desc    Grant or revoke admin access for teacher/HOD
// @access  Private/Admin
router.put('/users/:id/admin-access', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminAccess } = req.body;

    if (typeof adminAccess !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'adminAccess must be a boolean'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin users already have admin access'
      });
    }

    if (!['teacher', 'hod'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Admin access can only be granted to teacher or HOD'
      });
    }

    user.adminAccess = adminAccess;
    await user.save();

    res.status(200).json({
      success: true,
      message: adminAccess ? 'Admin access granted' : 'Admin access revoked',
      data: {
        id: user._id,
        role: user.role,
        adminAccess: user.adminAccess
      }
    });
  } catch (error) {
    console.error('Update admin access error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in updating admin access'
    });
  }
});

// @route   PUT /api/admin/users/:id/permissions
// @desc    Update user permissions (nav modules)
// @access  Private/Admin
router.put('/users/:id/permissions', protect, authorize('admin'), async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!['admin', 'hod', 'teacher', 'coordinator'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions are only supported for admin, hod, teacher, or coordinator'
      });
    }

    const allowed = new Set(getRoleDefaults(user.role));
    const cleaned = permissions.filter((item) => allowed.has(item));

    user.permissions = cleaned;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        id: user._id,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in updating permissions'
    });
  }
});

// @route   GET /api/admin/permissions/modules
// @desc    Get role module definitions
// @access  Private/Admin
router.get('/permissions/modules', protect, authorize('admin'), async (req, res) => {
  res.status(200).json({
    success: true,
    data: ROLE_DEFAULTS
  });
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/All Roles
router.delete('/users/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator', 'student'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Role restrictions intentionally removed to allow all roles to delete any user.

    // If teacher, remove from subjects
    if (user.role === 'teacher') {
      await Subject.updateMany(
        { teacher: user._id },
        { teacher: null }
      );
    }

    // If HOD, remove from branch
    if (user.role === 'hod') {
      await Branch.updateMany(
        { hod: user._id },
        { hod: null }
      );
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'delete_user',
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.name,
      scope: {
        branchId: user.branch || null,
        semesterIds: user.semester ? [user.semester] : []
      }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: user._id,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in deleting user'
    });
  }
});

module.exports = router;
