const express = require('express');
const router = express.Router();
const User = require('../models/User');
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
    const { name, email, phone, dateOfBirth, gender, address, qualifications, experience } = req.body;

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
