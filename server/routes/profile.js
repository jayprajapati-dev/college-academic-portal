const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const { protect } = require('../middleware/auth');

// @route   GET /api/profile/me
// @desc    Get logged-in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('branch semester assignedSubjects assignedHOD coordinator.branch coordinator.semesters')
      .select('-password -tempPassword -securityAnswer');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in fetching profile'
    });
  }
});

// @route   PUT /api/profile/me
// @desc    Update profile (only editable fields)
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email, phone, mobile, branch, semester, dateOfBirth, gender, address, qualifications, experience } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update only editable fields
    if (name) user.name = name;
    if (email && user.role === 'student') user.email = email; // Students can update email
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (address) user.address = address;

    if (user.role === 'student') {
      if (mobile) {
        if (!/^[0-9]{10}$/.test(mobile)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid 10-digit mobile number'
          });
        }
        user.mobile = mobile;
      }

      if (branch) {
        if (!mongoose.Types.ObjectId.isValid(branch)) {
          return res.status(400).json({ success: false, message: 'Invalid branch id' });
        }
        const branchDoc = await Branch.findById(branch);
        if (!branchDoc) {
          return res.status(404).json({ success: false, message: 'Branch not found' });
        }
        user.branch = branchDoc._id;
      }

      if (semester) {
        if (!mongoose.Types.ObjectId.isValid(semester)) {
          return res.status(400).json({ success: false, message: 'Invalid semester id' });
        }
        const semesterDoc = await Semester.findById(semester);
        if (!semesterDoc) {
          return res.status(404).json({ success: false, message: 'Semester not found' });
        }
        user.semester = semesterDoc._id;
      }
    }
    
    // Teachers and HODs can update qualifications and experience
    if ((user.role === 'teacher' || user.role === 'hod' || user.role === 'coordinator') && qualifications !== undefined) {
      user.qualifications = qualifications;
    }
    if ((user.role === 'teacher' || user.role === 'hod' || user.role === 'coordinator') && experience !== undefined) {
      user.experience = experience;
    }

    await user.save();

    // Get updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .populate('branch semester assignedSubjects assignedHOD coordinator.branch coordinator.semesters')
      .select('-password -tempPassword -securityAnswer');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in updating profile'
    });
  }
});

// @route   PUT /api/profile/complete-profile
// @desc    Complete profile after first login
// @access  Private
router.put('/complete-profile', protect, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user._id)
      .populate('branch semester assignedSubjects assignedHOD coordinator.branch coordinator.semesters');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update name if provided
    if (name) user.name = name;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        assignedSubjects: user.assignedSubjects,
        assignedHOD: user.assignedHOD
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in completing profile'
    });
  }
});

module.exports = router;
