const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const Timetable = require('../models/Timetable');
const { getCoordinatorStatus } = require('../utils/coordinatorScheduler');

const getJwtSecret = () => process.env.JWT_SECRET || 'smartacademics-dev-jwt-secret';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseSemesterNumber = (value) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const num = Number(match[0]);
  if (!Number.isInteger(num) || num < 1 || num > 8) return null;
  return num;
};

const normalizeStudentAcademicRefs = async (user) => {
  if (!user || user.role !== 'student') return;

  let changed = false;

  if (user.branch && !isObjectId(user.branch)) {
    const rawBranch = String(user.branch).trim();
    if (rawBranch) {
      const branchDoc = await Branch.findOne({
        $or: [
          { code: rawBranch.toUpperCase() },
          { name: new RegExp(`^${escapeRegex(rawBranch)}$`, 'i') }
        ]
      }).select('_id');

      if (branchDoc) {
        user.branch = branchDoc._id;
        changed = true;
      }
    }
  }

  if (user.semester && !isObjectId(user.semester)) {
    const parsedNumber = parseSemesterNumber(user.semester);
    let semesterDoc = null;

    if (parsedNumber) {
      semesterDoc = await Semester.findOne({ semesterNumber: parsedNumber }).select('_id');
    }

    if (!semesterDoc) {
      const rawSemester = String(user.semester).trim();
      if (rawSemester) {
        semesterDoc = await Semester.findOne({
          academicYear: new RegExp(`^${escapeRegex(rawSemester)}$`, 'i')
        }).select('_id');
      }
    }

    if (semesterDoc) {
      user.semester = semesterDoc._id;
      changed = true;
    }
  }

  if (changed) {
    await user.save();
  }
};

const syncTeacherAssignedSubjectsFromTimetable = async (user) => {
  if (!user || user.role !== 'teacher') return;

  const timetableSubjectIds = await Timetable.distinct('subjectId', {
    teacherId: user._id,
    status: 'active'
  });

  const assigned = Array.isArray(user.assignedSubjects) ? user.assignedSubjects : [];
  const mergedIds = Array.from(new Set(
    [...assigned, ...timetableSubjectIds]
      .filter(Boolean)
      .map((id) => String(id))
  ));

  const hasChanged = mergedIds.length !== assigned.length
    || assigned.some((id) => !mergedIds.includes(String(id)));

  if (hasChanged) {
    user.assignedSubjects = mergedIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    await user.save();
  }
};

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
      const decoded = jwt.verify(token, getJwtSecret());

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

      if (req.user.role === 'student') {
        await normalizeStudentAcademicRefs(req.user);
      }

      if (req.user.role === 'teacher') {
        await syncTeacherAssignedSubjectsFromTimetable(req.user);
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
