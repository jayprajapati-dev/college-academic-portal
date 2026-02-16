const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCoordinatorStatus } = require('../utils/coordinatorScheduler');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password -tempPassword -securityAnswer');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (req.user.status === 'disabled') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been disabled'
        });
      }

      if (req.user.role === 'coordinator' && req.user.coordinator) {
        const now = new Date();
        const status = getCoordinatorStatus(req.user.coordinator, now);
        if (status === 'expired') {
          req.user.role = req.user.coordinator.baseRole || 'teacher';
          req.user.coordinator = {
            ...req.user.coordinator,
            status: 'expired',
            revokedAt: now
          };
          await req.user.save();
        } else if (status !== req.user.coordinator.status) {
          req.user.coordinator = {
            ...req.user.coordinator,
            status
          };
          await req.user.save();
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Check if first login is required
const checkFirstLogin = async (req, res, next) => {
  if (req.user.passwordChangeRequired) {
    return res.status(403).json({
      success: false,
      message: 'Password change required',
      requiresFirstLogin: true
    });
  }
  next();
};

// Restrict to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    const isAdmin = req.user.role === 'admin' || req.user.adminAccess === true;
    const allowed = roles.includes(req.user.role) || (roles.includes('admin') && isAdmin);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, checkFirstLogin, authorize };
