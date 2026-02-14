const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, enrollmentNumber, password } = req.body;

    // Validation
    if (!name || !email || !enrollmentNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { enrollmentNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or enrollment number already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      enrollmentNumber,
      password,
      role: 'student',
      status: 'active'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (all roles)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or mobile

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    // Find user by email or mobile
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    }).select('+password +tempPassword');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is disabled
    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact admin.'
      });
    }

    // Check password or temp password
    let isPasswordMatch = false;
    
    if (user.passwordChangeRequired && user.tempPassword) {
      // For first time login with temp password
      isPasswordMatch = password === user.tempPassword;
    } else {
      // Regular password check
      try {
        isPasswordMatch = await user.comparePassword(password);
      } catch (error) {
        console.error('Password comparison error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authentication error'
        });
      }
    }

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove sensitive data
    user.password = undefined;
    user.tempPassword = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        adminAccess: user.adminAccess === true,
        status: user.status,
        passwordChangeRequired: user.passwordChangeRequired,
        branch: user.branch,
        semester: user.semester,
        assignedSubjects: user.assignedSubjects || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login'
    });
  }
});

// @route   POST /api/auth/first-login
// @desc    Change password and set security question (first login)
// @access  Private
router.post('/first-login', protect, async (req, res) => {
  try {
    const { newPassword, securityQuestion, securityAnswer, caseInsensitiveAnswer } = req.body;

    // Validation
    if (!newPassword || !securityQuestion || !securityAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get user with password fields
    const user = await User.findById(req.user._id).select('+password +tempPassword');

    if (!user.passwordChangeRequired) {
      return res.status(400).json({
        success: false,
        message: 'Password change is not required for this account'
      });
    }

    // Update user
    user.password = newPassword;
    user.securityQuestion = securityQuestion;
    user.securityAnswer = securityAnswer;
    user.caseInsensitiveAnswer = caseInsensitiveAnswer || false;
    user.tempPassword = undefined;
    user.passwordChangeRequired = false;
    user.status = 'active';

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please complete your profile.'
    });
  } catch (error) {
    console.error('First login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in password change'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Get security question by mobile/email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body; // email or mobile

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or mobile number'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.securityQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Security question not set for this account'
      });
    }

    res.status(200).json({
      success: true,
      securityQuestion: user.securityQuestion,
      userId: user._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in forgot password'
    });
  }
});

// @route   POST /api/auth/verify-security-answer
// @desc    Verify security answer
// @access  Public
router.post('/verify-security-answer', async (req, res) => {
  try {
    const { userId, answer } = req.body;

    if (!userId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID and answer'
      });
    }

    // Get user with security answer
    const user = await User.findById(userId).select('+securityAnswer');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify answer
    const isMatch = await user.compareSecurityAnswer(answer);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect security answer'
      });
    }

    // Generate temporary reset token
    const resetToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Security answer verified',
      resetToken
    });
  } catch (error) {
    console.error('Verify answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in verification'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password after verification
// @access  Private (with reset token)
router.post('/reset-password', protect, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get user
    const user = await User.findById(req.user._id).select('+password');

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in password reset'
    });
  }
});

// @route   GET /api/auth/verify-token
// @desc    Verify JWT token validity
// @access  Private
router.get('/verify-token', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        passwordChangeRequired: req.user.passwordChangeRequired
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in token verification'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // In a JWT system, logout is handled client-side by removing the token
    // But we can add additional logic here if needed (e.g., blacklist token)
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in logout'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @route   POST /api/auth/verify-temp-credentials
// @desc    Verify temporary credentials for first-time password setup
// @access  Public
router.post('/verify-temp-credentials', async (req, res) => {
  try {
    const { mobileNumber, tempPassword } = req.body;

    // Validation
    if (!mobileNumber || !tempPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and temporary password are required'
      });
    }

    // Find user by mobile
    const user = await User.findOne({ mobile: mobileNumber }).select('+tempPassword');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or temporary password'
      });
    }

    // Check if user status is pending
    if (user.status !== 'active' && user.status !== 'pending_first_login') {
      return res.status(410).json({
        success: false,
        message: 'Account is not available for password setup'
      });
    }

    // Verify temp password
    if (user.tempPassword !== tempPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or temporary password'
      });
    }

    // Generate setup token (valid for 30 minutes)
    const setupToken = jwt.sign(
      { userId: user._id, mobile: user.mobile },
      process.env.SETUP_JWT_SECRET || 'setup-secret-key',
      { expiresIn: '30m' }
    );

    res.status(200).json({
      success: true,
      message: 'Credentials verified successfully',
      setupToken,
      userId: user._id,
      userName: user.name
    });
  } catch (error) {
    console.error('Verify temp credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying credentials'
    });
  }
});

// @route   POST /api/auth/setup-password
// @desc    Setup new password for first-time login
// @access  Private (requires setupToken)
router.post('/setup-password', async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword, securityQuestion, securityAnswer } = req.body;
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Setup token required'
      });
    }

    // Verify setup token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SETUP_JWT_SECRET || 'setup-secret-key');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired setup token'
      });
    }

    // Validation
    if (!newPassword || !confirmPassword || !securityQuestion || !securityAnswer) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (securityAnswer.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Security answer is required'
      });
    }

    // Get user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already setup
    if (user.passwordSetupCompletedAt) {
      return res.status(409).json({
        success: false,
        message: 'Password already configured. Please login with your credentials.'
      });
    }

    // Update user
    user.password = newPassword;
    user.securityQuestion = securityQuestion;
    user.securityAnswer = securityAnswer;
    user.status = 'active';
    user.passwordSetupRequired = false;
    user.passwordSetupCompletedAt = new Date();
    user.tempPassword = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password setup completed successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        passwordSetupCompleted: true
      }
    });
  } catch (error) {
    console.error('Setup password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up password'
    });
  }
});

module.exports = router;
