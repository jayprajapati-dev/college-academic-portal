const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');
const crypto = require('crypto');

// Generate random password
const generateTempPassword = () => {
  return crypto.randomBytes(4).toString('hex'); // 8 character password
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
      password: 'temp', // Will be hashed, replaced during password setup
      status: 'active',
      passwordSetupRequired: true,
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
        passwordSetupRequired: true,
        status: hod.status,
        setupInstructions: 'HOD should visit password-setup page and enter mobile + temp password'
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
      password: 'temp', // Will be hashed, replaced during password setup
      status: 'active',
      passwordSetupRequired: true,
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
        passwordSetupRequired: true,
        status: teacher.status,
        setupInstructions: 'Teacher should visit password-setup page and enter mobile + temp password'
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

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

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
// @access  Private/Admin
router.put('/user/:id/status', protect, authorize('admin'), async (req, res) => {
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

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        status: user.status
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

    if (!['admin', 'hod', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
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

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of admin user
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

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
