const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

// Helper: Check if user can modify timetable
const canModifyTimetable = async (timetableId, userId, userRole) => {
  const timetable = await Timetable.findById(timetableId);
  if (!timetable) return false;

  // Admin can always modify
  if (userRole === 'admin') return true;

  // Creator can modify
  if (timetable.createdBy.equals(userId)) return true;

  // Check if user is in canBeModifiedBy list
  const hasPermission = timetable.canBeModifiedBy.some(
    perm => perm.userId.equals(userId)
  );

  return hasPermission;
};

// Helper: Check for conflicts
const checkConflicts = async (
  semesterId,
  branchId,
  dayOfWeek,
  startTime,
  endTime,
  teacherId,
  roomNo,
  excludeId = null
) => {
  const query = {
    semesterId,
    branchId,
    dayOfWeek,
    status: { $ne: 'cancelled' }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflicts = await Timetable.find(query);

  const timeConflicts = conflicts.filter(slot => {
    // Check if times overlap
    return !(endTime <= slot.startTime || startTime >= slot.endTime);
  });

  const result = {
    hasConflict: false,
    conflicts: []
  };

  // Check teacher conflict
  const teacherConflict = timeConflicts.find(
    slot => slot.teacherId.equals(teacherId)
  );
  if (teacherConflict) {
    result.hasConflict = true;
    result.conflicts.push({
      type: 'teacher',
      message: `Teacher already has class from ${teacherConflict.startTime} to ${teacherConflict.endTime}`,
      subject: teacherConflict.subjectId?.name,
      time: `${teacherConflict.startTime} - ${teacherConflict.endTime}`
    });
  }

  // Check room conflict
  const roomConflict = timeConflicts.find(slot => slot.roomNo === roomNo);
  if (roomConflict) {
    result.hasConflict = true;
    result.conflicts.push({
      type: 'room',
      message: `Room ${roomNo} is already booked from ${roomConflict.startTime} to ${roomConflict.endTime}`,
      subject: roomConflict.subjectId?.name,
      time: `${roomConflict.startTime} - ${roomConflict.endTime}`
    });
  }

  return result;
};

// ============ CREATE TIMETABLE ============
router.post('/create', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const {
      semesterId,
      branchId,
      subjectId,
      teacherId,
      roomNo,
      dayOfWeek,
      startTime,
      endTime,
      lectureType,
      notes
    } = req.body;

    // Validation
    if (
      !semesterId ||
      !branchId ||
      !subjectId ||
      !teacherId ||
      !roomNo ||
      !dayOfWeek ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if teacher is valid
    const teacher = await User.findById(teacherId);
    if (!teacher || !['teacher', 'hod'].includes(teacher.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Check for conflicts
    const conflictCheck = await checkConflicts(
      semesterId,
      branchId,
      dayOfWeek,
      startTime,
      endTime,
      teacherId,
      roomNo
    );

    if (conflictCheck.hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling conflict detected',
        conflicts: conflictCheck.conflicts
      });
    }

    // Authorization: HOD can only create for their branch
    if (req.user.role === 'hod') {
      if (!req.user.branch.equals(branchId)) {
        return res.status(403).json({
          success: false,
          message: 'HOD can only create timetables for their branch'
        });
      }
    }

    // Create timetable
    const timetable = await Timetable.create({
      semesterId,
      branchId,
      subjectId,
      teacherId,
      roomNo,
      dayOfWeek,
      startTime,
      endTime,
      lectureType: lectureType || 'Theory',
      notes,
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating timetable entry',
      error: error.message
    });
  }
});

// ============ GET ALL TIMETABLES (Admin) ============
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      semesterId,
      branchId,
      subjectId,
      dayOfWeek,
      status = 'active'
    } = req.query;

    const query = { status };
    if (semesterId) query.semesterId = semesterId;
    if (branchId) query.branchId = branchId;
    if (subjectId) query.subjectId = subjectId;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const skip = (page - 1) * limit;

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dayOfWeek: 1, startTime: 1 });

    const total = await Timetable.countDocuments(query);

    res.status(200).json({
      success: true,
      data: timetables,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetables'
    });
  }
});

// ============ GET TIMETABLE BY SEMESTER (Students/Teachers view) ============
router.get('/semester/:semesterId', protect, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { dayOfWeek } = req.query;

    const query = {
      semesterId,
      status: 'active'
    };

    // If student, filter by their branch
    if (req.user.role === 'student') {
      query.branchId = req.user.branch;
    }

    // If HOD, filter by their branch
    if (req.user.role === 'hod') {
      query.branchId = req.user.branch;
    }

    // If specific day requested
    if (dayOfWeek) {
      query.dayOfWeek = dayOfWeek;
    }

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({
        dayOfWeek: 1,
        startTime: 1
      });

    res.status(200).json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Get semester timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable'
    });
  }
});

// ============ GET TIMETABLE BY SUBJECT ============
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const timetables = await Timetable.find({
      subjectId,
      status: 'active'
    })
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Get subject timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject timetable'
    });
  }
});

// ============ GET MY TIMETABLE (Teacher/Student) ============
router.get('/my-schedule', protect, async (req, res) => {
  try {
    let query = { status: 'active' };

    if (req.user.role === 'teacher') {
      // Teachers see their assigned classes
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      // Students see their semester's classes
      query.semesterId = req.user.semester;
      query.branchId = req.user.branch;
    }

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({
        dayOfWeek: 1,
        startTime: 1
      });

    res.status(200).json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Get my schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedule'
    });
  }
});

// ============ GET DAY SCHEDULE (For Day View) ============
router.get('/day/:dayOfWeek', protect, async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { semesterId, branchId } = req.query;

    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day of week'
      });
    }

    const query = {
      dayOfWeek,
      status: 'active'
    };

    if (semesterId) query.semesterId = semesterId;
    if (branchId) query.branchId = branchId;

    // For students, auto-filter by their semester/branch
    if (req.user.role === 'student') {
      query.semesterId = req.user.semester;
      query.branchId = req.user.branch;
    }

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Get day schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching day schedule'
    });
  }
});

// ============ GET SINGLE TIMETABLE ============
router.get('/:id', protect, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable'
    });
  }
});

// ============ UPDATE TIMETABLE ============
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      teacherId,
      roomNo,
      dayOfWeek,
      startTime,
      endTime,
      lectureType,
      notes
    } = req.body;

    // Check permission to modify
    const canModify = await canModifyTimetable(id, req.user._id, req.user.role);
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this timetable entry'
      });
    }

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    // If updating critical fields, check for conflicts
    if (
      (teacherId && !teacherId.equals(timetable.teacherId)) ||
      roomNo !== timetable.roomNo ||
      dayOfWeek !== timetable.dayOfWeek ||
      startTime !== timetable.startTime ||
      endTime !== timetable.endTime
    ) {
      const conflictCheck = await checkConflicts(
        timetable.semesterId,
        timetable.branchId,
        dayOfWeek || timetable.dayOfWeek,
        startTime || timetable.startTime,
        endTime || timetable.endTime,
        teacherId || timetable.teacherId,
        roomNo || timetable.roomNo,
        id
      );

      if (conflictCheck.hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Scheduling conflict detected after update',
          conflicts: conflictCheck.conflicts
        });
      }
    }

    // Update fields
    if (teacherId) timetable.teacherId = teacherId;
    if (roomNo) timetable.roomNo = roomNo;
    if (dayOfWeek) timetable.dayOfWeek = dayOfWeek;
    if (startTime) timetable.startTime = startTime;
    if (endTime) timetable.endTime = endTime;
    if (lectureType) timetable.lectureType = lectureType;
    if (notes) timetable.notes = notes;

    timetable.updatedAt = Date.now();
    await timetable.save();

    res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating timetable entry',
      error: error.message
    });
  }
});

// ============ DELETE/CANCEL TIMETABLE ============
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission
    const canModify = await canModifyTimetable(id, req.user._id, req.user.role);
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this timetable entry'
      });
    }

    const timetable = await Timetable.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Timetable entry cancelled successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting timetable entry'
    });
  }
});

// ============ GRANT MODIFICATION PERMISSION ============
router.post('/:id/grant-permission', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId || !['hod', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId or role'
      });
    }

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    // Check if already has permission
    const alreadyHasPermission = timetable.canBeModifiedBy.some(
      perm => perm.userId.equals(userId)
    );

    if (alreadyHasPermission) {
      return res.status(400).json({
        success: false,
        message: 'User already has modification permission'
      });
    }

    timetable.canBeModifiedBy.push({
      userId,
      role,
      grantedBy: req.user._id,
      grantedAt: Date.now()
    });

    await timetable.save();

    res.status(200).json({
      success: true,
      message: 'Permission granted successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error granting permission'
    });
  }
});

// ============ REVOKE MODIFICATION PERMISSION ============
router.post('/:id/revoke-permission', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    timetable.canBeModifiedBy = timetable.canBeModifiedBy.filter(
      perm => !perm.userId.equals(userId)
    );

    await timetable.save();

    res.status(200).json({
      success: true,
      message: 'Permission revoked successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking permission'
    });
  }
});

module.exports = router;
