const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
};

const getHodBranchIds = (user) => Array.from(new Set([
  normalizeId(user?.branch),
  normalizeId(user?.department),
  ...((user?.branches || []).map((branch) => normalizeId(branch)))
].filter(Boolean)));

// Helper: Check if user can modify timetable (Admin: all, HOD: own branch only)
const canModifyTimetable = async (timetableId, user) => {
  const timetable = await Timetable.findById(timetableId);
  if (!timetable) return false;
  const currentUserRole = user?.role;
  if (currentUserRole === 'admin') return true;
  if (currentUserRole === 'hod') {
    const timetableBranchId = normalizeId(timetable.branchId);
    const userBranchIds = new Set(getHodBranchIds(user));
    if (userBranchIds.has(timetableBranchId)) return true;
  }
  return false;
};


// Helper: Check for slot-based conflicts with detailed information
const checkSlotConflicts = async ({
  semesterId,
  branchId,
  dayOfWeek,
  slot,
  slotSpan,
  teacherId,
  roomId,
  excludeId = null
}) => {
  const query = {
    semesterId,
    branchId,
    dayOfWeek,
    status: 'active'
  };
  if (excludeId) query._id = { $ne: excludeId };
  const entries = await Timetable.find(query).populate('subjectId').populate('teacherId').populate('roomId').populate('branchId').populate('semesterId');
  
  // For labs, check all spanned slots
  const slotsToCheck = [];
  for (let i = 0; i < (slotSpan || 1); i++) slotsToCheck.push(slot + i);
  let hasConflict = false;
  let conflicts = [];
  
  for (const s of slotsToCheck) {
    for (const entry of entries) {
      // Check slot overlap
      const entrySlots = [];
      for (let j = 0; j < (entry.slotSpan || 1); j++) entrySlots.push(entry.slot + j);
      if (!entrySlots.includes(s)) continue;
      
      // Teacher conflict
      if (String(entry.teacherId._id) === String(teacherId)) {
        hasConflict = true;
        conflicts.push({
          type: 'teacher',
          message: `Teacher ${entry.teacherId.name} already assigned at slot ${s} (${entry.dayOfWeek}) for ${entry.subjectId.name}`,
          details: {
            teacher: entry.teacherId.name,
            subject: entry.subjectId.name,
            room: entry.roomId.roomNo,
            branch: entry.branchId.name,
            semester: entry.semesterId.name,
            slot: s,
            day: entry.dayOfWeek,
            addedBy: entry.addedBy?.name || 'Unknown'
          }
        });
      }
      
      // Room conflict
      if (String(entry.roomId._id) === String(roomId)) {
        hasConflict = true;
        conflicts.push({
          type: 'room',
          message: `Room ${entry.roomId.roomNo} already booked at slot ${s} (${entry.dayOfWeek}) by ${entry.teacherId.name} for ${entry.subjectId.name}`,
          details: {
            room: entry.roomId.roomNo,
            teacher: entry.teacherId.name,
            subject: entry.subjectId.name,
            branch: entry.branchId.name,
            semester: entry.semesterId.name,
            slot: s,
            day: entry.dayOfWeek,
            addedBy: entry.addedBy?.name || 'Unknown'
          }
        });
      }
    }
  }
  return { hasConflict, conflicts };
};

// ============ CREATE TIMETABLE ============

// ============ CREATE TIMETABLE (slot-based) ============
router.post('/create', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      semesterId,
      branchId,
      subjectId,
      teacherId,
      roomId,
      dayOfWeek,
      slot,
      lectureType
    } = req.body;

    if (!semesterId || !branchId || !subjectId || !teacherId || !roomId || !dayOfWeek || !slot || !lectureType) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    // Only Admin/HOD for their branch
    if (req.user.role === 'hod') {
      const hodBranchIds = getHodBranchIds(req.user);
      if (!hodBranchIds.includes(normalizeId(branchId))) {
        return res.status(403).json({ success: false, message: 'HOD can only create for their branch' });
      }
    }

    // Lab = 2 slots, Theory = 1 slot
    const slotSpan = lectureType === 'Lab' ? 2 : 1;

    // Conflict check
    const conflictCheck = await checkSlotConflicts({
      semesterId,
      branchId,
      dayOfWeek,
      slot,
      slotSpan,
      teacherId,
      roomId
    });
    if (conflictCheck.hasConflict) {
      return res.status(400).json({ success: false, message: 'Conflict detected', conflicts: conflictCheck.conflicts });
    }

    // Prevent lab splitting
    if (lectureType === 'Lab') {
      // Check if next slot is available (no overflow)
      if (slot >= 7) {
        return res.status(400).json({ success: false, message: 'Lab cannot be placed at last slot' });
      }
    }

    const timetable = await Timetable.create({
      semesterId,
      branchId,
      subjectId,
      teacherId,
      roomId,
      dayOfWeek,
      slot,
      lectureType,
      slotSpan,
      status: 'active'
    });
    res.status(201).json({ success: true, data: timetable });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ success: false, message: 'Error creating timetable entry', error: error.message });
  }
});

// ============ GET ALL TIMETABLES (Admin) ============
router.get('/all', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { semesterId, branchId, dayOfWeek } = req.query;
    const query = { status: 'active' };
    if (semesterId) query.semesterId = semesterId;
    if (branchId) query.branchId = branchId;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    // HOD: restrict to own branches
    if (req.user.role === 'hod') {
      query.branchId = { $in: getHodBranchIds(req.user) };
    }
    const timetables = await Timetable.find(query).sort({ dayOfWeek: 1, slot: 1 });
    res.status(200).json({ success: true, data: timetables });
  } catch (error) {
    console.error('Get all timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetables'
    });
  }
});

// ============ GET TIMETABLE BY SEMESTER (Students/Teachers view) ============

// ============ GET TIMETABLE BY SEMESTER (All roles, view only) ============
router.get('/semester/:semesterId', protect, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { branchId, dayOfWeek } = req.query;
    const query = { semesterId, status: 'active' };
    if (branchId) query.branchId = branchId;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    // Students: restrict to own branch
    if (req.user.role === 'student') query.branchId = req.user.branch;
    const timetables = await Timetable.find(query).sort({ dayOfWeek: 1, slot: 1 });
    res.status(200).json({ success: true, data: timetables });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching timetable' });
  }
});

// ============ GET TIMETABLE BY SUBJECT ============
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const query = {
      subjectId,
      status: 'active'
    };

    if (req.user.role === 'student') {
      query.branchId = req.user.branch;
      query.semesterId = req.user.semester;
    }

    if (req.user.role === 'hod') {
      query.branchId = { $in: getHodBranchIds(req.user) };
    }

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ dayOfWeek: 1, slot: 1 });

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
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      query.semesterId = req.user.semester;
      query.branchId = req.user.branch;
    } else if (req.user.role === 'hod') {
      const hodBranchIds = getHodBranchIds(req.user);
      if (hodBranchIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
      query.branchId = { $in: hodBranchIds };
    }

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ dayOfWeek: 1, slot: 1 });

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

    if (req.user.role === 'student') {
      query.semesterId = req.user.semester;
      query.branchId = req.user.branch;
    } else if (req.user.role === 'hod') {
      const hodBranchIds = getHodBranchIds(req.user);
      if (branchId) {
        if (!hodBranchIds.includes(normalizeId(branchId))) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this branch timetable'
          });
        }
      } else {
        query.branchId = { $in: hodBranchIds };
      }
    }

    const timetables = await Timetable.find(query)
      .populate('semesterId', 'name code')
      .populate('branchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ dayOfWeek: 1, slot: 1 });

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

    if (req.user.role === 'hod') {
      const hodBranchIds = getHodBranchIds(req.user);
      if (!hodBranchIds.includes(normalizeId(timetable.branchId))) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this timetable entry'
        });
      }
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

// ============ UPDATE TIMETABLE ============
router.put('/:id', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const timetableId = req.params.id;
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) return res.status(404).json({ success: false, message: 'Not found' });
    if (!(await canModifyTimetable(timetableId, req.user))) {
      return res.status(403).json({ success: false, message: 'No permission' });
    }
    const { roomId, dayOfWeek, slot, lectureType, status } = req.body;
    if (roomId) timetable.roomId = roomId;
    if (dayOfWeek) timetable.dayOfWeek = dayOfWeek;
    if (slot) timetable.slot = slot;
    if (lectureType) {
      timetable.lectureType = lectureType;
      timetable.slotSpan = lectureType === 'Lab' ? 2 : 1;
    }
    if (status) timetable.status = status;
    // Conflict check
    const conflictCheck = await checkSlotConflicts({
      semesterId: timetable.semesterId,
      branchId: timetable.branchId,
      dayOfWeek: timetable.dayOfWeek,
      slot: timetable.slot,
      slotSpan: timetable.slotSpan,
      teacherId: timetable.teacherId,
      roomId: timetable.roomId,
      excludeId: timetable._id
    });
    if (conflictCheck.hasConflict) {
      return res.status(400).json({ success: false, message: 'Conflict detected', conflicts: conflictCheck.conflicts });
    }
    // Prevent lab splitting
    if (timetable.lectureType === 'Lab' && timetable.slot >= 7) {
      return res.status(400).json({ success: false, message: 'Lab cannot be placed at last slot' });
    }
    await timetable.save();
    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating timetable' });
  }
});

// ============ DELETE/CANCEL TIMETABLE ============

// ============ DELETE TIMETABLE ============
// Soft delete timetable (status = 'archived')
router.delete('/:id', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const timetableId = req.params.id;
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      console.error(`[DELETE /api/timetable/${timetableId}] Not found`);
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const canModify = await canModifyTimetable(timetableId, req.user);
    if (!canModify) {
      console.error(`[DELETE /api/timetable/${timetableId}] No permission for user ${req.user?._id}`);
      return res.status(403).json({ success: false, message: 'No permission' });
    }
    timetable.status = 'archived';
    // Log references for debugging
    console.log('[Timetable Delete] References:', {
      semesterId: timetable.semesterId,
      branchId: timetable.branchId,
      subjectId: timetable.subjectId,
      teacherId: timetable.teacherId,
      roomId: timetable.roomId
    });
    try {
      await timetable.save({ validateBeforeSave: false });
      res.json({ success: true, message: 'Timetable soft deleted (status=archived)' });
    } catch (saveError) {
      console.error('[Timetable Delete] Soft delete failed, attempting hard delete:', saveError);
      await Timetable.deleteOne({ _id: timetableId });
      res.json({ success: true, message: 'Timetable forcibly deleted due to reference error' });
    }
  } catch (error) {
    console.error(`[DELETE /api/timetable/${req.params.id}] Error:`, error);
    // Return full error for debugging
    res.status(500).json({ success: false, message: 'Error deleting timetable', error: error.message, stack: error.stack });
  }
});

// ============ TOGGLE TIMETABLE STATUS (On/Off/Archive) ============
const updateTimetableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'cancelled', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const canModify = await canModifyTimetable(id, req.user, req.user.adminAccess);
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update status for this timetable entry'
      });
    }

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    if (status === 'active') {
      const conflictCheck = await checkConflicts(
        timetable.semesterId,
        timetable.branchId,
        timetable.dayOfWeek,
        timetable.startTime,
        timetable.endTime,
        timetable.teacherId,
        timetable.roomNo,
        timetable._id
      );

      if (conflictCheck.hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Cannot turn ON due to scheduling conflict',
          conflicts: conflictCheck.conflicts
        });
      }
    }

    timetable.status = status;
    timetable.updatedAt = Date.now();
    await timetable.save();

    return res.status(200).json({
      success: true,
      message: `Timetable status updated to ${status}`,
      data: timetable
    });
  } catch (error) {
    console.error('Toggle timetable status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating timetable status',
      error: error.message
    });
  }
};

router.patch('/:id/status', protect, updateTimetableStatus);
router.put('/:id/status', protect, updateTimetableStatus);
router.post('/:id/status', protect, updateTimetableStatus);

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
