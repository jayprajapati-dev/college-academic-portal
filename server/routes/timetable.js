const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const TimetableSettings = require('../models/TimetableSettings');
const Room = require('../models/Room');
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

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_SLOT_LIMIT = 24;

const toMinutes = (timeValue) => {
  const value = String(timeValue || '');
  if (!TIME_PATTERN.test(value)) return null;
  const [hour, minute] = value.split(':').map((item) => Number(item));
  return (hour * 60) + minute;
};

const normalizeDivision = (value, fallback = 'General') => {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 30);
};

const normalizeBreakWindows = (items, dayStartTime, dayEndTime) => {
  const dayStart = toMinutes(dayStartTime);
  const dayEnd = toMinutes(dayEndTime);

  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      startTime: String(item?.startTime || '').trim(),
      endTime: String(item?.endTime || '').trim(),
      label: String(item?.label || 'Break').trim() || 'Break'
    }))
    .filter((item) => TIME_PATTERN.test(item.startTime) && TIME_PATTERN.test(item.endTime))
    .filter((item) => {
      const start = toMinutes(item.startTime);
      const end = toMinutes(item.endTime);
      if (start === null || end === null || end <= start) return false;
      if (dayStart === null || dayEnd === null) return true;
      return start >= dayStart && end <= dayEnd;
    });

  const seen = new Set();
  return normalized.filter((item) => {
    const key = `${item.startTime}-${item.endTime}-${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getSlotTimeRange = ({ slot, slotSpan, dayStartTime, slotMinutes }) => {
  const startSlot = Number(slot);
  const span = Number(slotSpan);
  const dayStart = toMinutes(dayStartTime);
  const duration = Number(slotMinutes);
  if (!Number.isInteger(startSlot) || !Number.isInteger(span) || dayStart === null || !Number.isInteger(duration)) {
    return null;
  }
  const start = dayStart + ((startSlot - 1) * duration);
  const end = start + (span * duration);
  return { start, end };
};

const sanitizeSettingsPayload = (source = {}) => {
  const fallback = {
    dayStartTime: '10:30',
    dayEndTime: '18:00',
    slotMinutes: 60,
    maxSlot: 7,
    breakSlots: [],
    teacherMaxHoursPerDay: 6,
    breakWindows: [
      { startTime: '12:30', endTime: '13:00', label: 'Lunch Break' },
      { startTime: '16:00', endTime: '16:10', label: 'Short Break' }
    ]
  };

  const normalizedDayStart = TIME_PATTERN.test(String(source.dayStartTime || ''))
    ? String(source.dayStartTime)
    : fallback.dayStartTime;
  const normalizedDayEnd = TIME_PATTERN.test(String(source.dayEndTime || ''))
    ? String(source.dayEndTime)
    : fallback.dayEndTime;

  let slotMinutes = Number(source.slotMinutes);
  if (!Number.isInteger(slotMinutes) || slotMinutes < 10 || slotMinutes > 180) {
    slotMinutes = fallback.slotMinutes;
  }

  const startMinutes = toMinutes(normalizedDayStart) ?? (10 * 60 + 30);
  const endMinutes = toMinutes(normalizedDayEnd) ?? (18 * 60);
  const availableMinutes = Math.max(slotMinutes, endMinutes - startMinutes);
  const derivedMax = Math.max(1, Math.min(MAX_SLOT_LIMIT, Math.floor(availableMinutes / slotMinutes)));

  let maxSlot = Number(source.maxSlot);
  if (!Number.isInteger(maxSlot) || maxSlot < 1 || maxSlot > MAX_SLOT_LIMIT) {
    maxSlot = Math.min(fallback.maxSlot, derivedMax);
  }
  maxSlot = Math.min(maxSlot, derivedMax);

  const breakSlots = Array.from(new Set(
    (Array.isArray(source.breakSlots) ? source.breakSlots : [])
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0 && item <= maxSlot)
  )).sort((a, b) => a - b);

  const breakWindows = normalizeBreakWindows(source.breakWindows, normalizedDayStart, normalizedDayEnd);
  const finalBreakWindows = breakWindows.length
    ? breakWindows
    : normalizeBreakWindows(fallback.breakWindows, normalizedDayStart, normalizedDayEnd);

  let teacherMaxHoursPerDay = Number(source.teacherMaxHoursPerDay);
  if (!Number.isInteger(teacherMaxHoursPerDay) || teacherMaxHoursPerDay < 1 || teacherMaxHoursPerDay > 12) {
    teacherMaxHoursPerDay = fallback.teacherMaxHoursPerDay;
  }

  return {
    dayStartTime: normalizedDayStart,
    dayEndTime: normalizedDayEnd,
    slotMinutes,
    maxSlot,
    breakSlots: breakSlots.length ? breakSlots : fallback.breakSlots.filter((item) => item <= maxSlot),
    breakWindows: finalBreakWindows,
    teacherMaxHoursPerDay
  };
};

const getOrCreateSettings = async () => {
  const rawSettings = await TimetableSettings.collection.findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });
  if (!rawSettings) {
    const defaults = sanitizeSettingsPayload();
    await TimetableSettings.collection.insertOne({
      ...defaults,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return defaults;
  }

  const normalized = sanitizeSettingsPayload(rawSettings);
  const hasDrift = (
    String(rawSettings.dayStartTime || '') !== normalized.dayStartTime
    || String(rawSettings.dayEndTime || '') !== normalized.dayEndTime
    || Number(rawSettings.slotMinutes) !== normalized.slotMinutes
    || Number(rawSettings.maxSlot) !== normalized.maxSlot
    || JSON.stringify((rawSettings.breakSlots || []).map((item) => Number(item)).sort((a, b) => a - b)) !== JSON.stringify(normalized.breakSlots)
    || JSON.stringify((rawSettings.breakWindows || []).map((item) => ({
      startTime: String(item?.startTime || ''),
      endTime: String(item?.endTime || ''),
      label: String(item?.label || 'Break')
    }))) !== JSON.stringify(normalized.breakWindows)
    || Number(rawSettings.teacherMaxHoursPerDay) !== Number(normalized.teacherMaxHoursPerDay)
  );

  if (hasDrift) {
    await TimetableSettings.collection.updateOne(
      { _id: rawSettings._id },
      {
        $set: {
          ...normalized,
          updatedAt: new Date()
        }
      }
    );
  }

  return normalized;
};

const normalizeDuration = (value, lectureType) => {
  const normalizedType = String(lectureType || '').toLowerCase();
  if (normalizedType !== 'lab') return 1;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 4) return 2;
  return numeric;
};

const validateSlotRangeAgainstSettings = ({ slot, slotSpan, maxSlot, breakSlots, dayStartTime, slotMinutes, breakWindows, lectureType }) => {
  const startSlot = Number(slot);
  const span = Number(slotSpan);
  const normalizedLectureType = String(lectureType || '').toLowerCase();

  if (!Number.isInteger(startSlot) || startSlot < 1 || startSlot > maxSlot) {
    return `Invalid slot. Allowed values are 1 to ${maxSlot}.`;
  }

  if (!Number.isInteger(span) || span < 1 || span > 4) {
    return 'Invalid duration. Allowed values are 1 to 4 slots.';
  }

  if (startSlot + span - 1 > maxSlot) {
    return `Selected duration exceeds max slot ${maxSlot}.`;
  }

  const breakSet = new Set((breakSlots || []).map((item) => Number(item)));
  for (let offset = 0; offset < span; offset += 1) {
    const targetSlot = startSlot + offset;
    if (breakSet.has(targetSlot)) {
      return `Slot ${targetSlot} is configured as fixed break time.`;
    }
  }

  const slotRange = getSlotTimeRange({
    slot: startSlot,
    slotSpan: span,
    dayStartTime,
    slotMinutes
  });

  if (slotRange && Array.isArray(breakWindows) && breakWindows.length > 0) {
    let overlapMinutes = 0;
    for (const win of breakWindows) {
      const start = toMinutes(win?.startTime);
      const end = toMinutes(win?.endTime);
      if (start === null || end === null || end <= start) continue;
      const overlaps = slotRange.start < end && start < slotRange.end;
      if (overlaps) {
        if (normalizedLectureType !== 'lab') {
          return `Selected class overlaps break window ${win.startTime}-${win.endTime}.`;
        }
        const overlapStart = Math.max(slotRange.start, start);
        const overlapEnd = Math.min(slotRange.end, end);
        overlapMinutes += Math.max(0, overlapEnd - overlapStart);
      }
    }

    if (normalizedLectureType === 'lab') {
      const totalMinutes = slotRange.end - slotRange.start;
      const effectiveTeachingMinutes = totalMinutes - overlapMinutes;
      if (effectiveTeachingMinutes !== 120) {
        return 'Lab must include exactly 2 hours of teaching time (break overlap allowed).';
      }
    }
  }

  return null;
};

// Helper: Check if user can modify timetable directly (Admin, scoped HOD, granted user)
const canModifyTimetable = async (timetableId, user) => {
  const timetable = await Timetable.findById(timetableId);
  if (!timetable) return false;
  const currentUserRole = user?.role;
  const currentUserId = normalizeId(user?._id);

  if (currentUserRole === 'admin') return true;
  if (currentUserRole === 'hod') {
    const timetableBranchId = normalizeId(timetable.branchId);
    const userBranchIds = new Set(getHodBranchIds(user));
    if (userBranchIds.has(timetableBranchId)) return true;
  }

  return (timetable.canBeModifiedBy || []).some((perm) => normalizeId(perm.userId) === currentUserId);
};

const canReviewTimetableRequest = (timetable, user) => {
  const role = user?.role;
  if (role === 'admin') return true;
  if (role !== 'hod') return false;
  const hodBranchIds = new Set(getHodBranchIds(user));
  return hodBranchIds.has(normalizeId(timetable.branchId));
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

const checkTeacherDailyLoad = async ({ teacherId, dayOfWeek, slotSpan, slotMinutes, maxHoursPerDay, excludeId = null }) => {
  const teacher = normalizeId(teacherId);
  const day = String(dayOfWeek || '').trim();
  const span = Number(slotSpan);
  const perSlot = Number(slotMinutes);
  const maxHours = Number(maxHoursPerDay);

  if (!teacher || !day || !Number.isInteger(span) || !Number.isInteger(perSlot) || !Number.isInteger(maxHours)) {
    return null;
  }

  const query = { teacherId: teacher, dayOfWeek: day, status: 'active' };
  if (excludeId) query._id = { $ne: excludeId };

  const entries = await Timetable.find(query).select('slotSpan');
  const existingMinutes = entries.reduce((sum, item) => {
    const itemSpan = Number(item?.slotSpan);
    return sum + ((Number.isInteger(itemSpan) && itemSpan > 0 ? itemSpan : 1) * perSlot);
  }, 0);

  const requestedMinutes = span * perSlot;
  const limitMinutes = maxHours * 60;

  if (existingMinutes + requestedMinutes > limitMinutes) {
    const currentHours = (existingMinutes / 60).toFixed(1);
    const requestedHours = (requestedMinutes / 60).toFixed(1);
    return `Teacher daily limit exceeded on ${day}. Current load ${currentHours}h, requested ${requestedHours}h, max ${maxHours}h.`;
  }

  return null;
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
      lectureType,
      slotSpan,
      division
    } = req.body;

    if (!semesterId || !branchId || !subjectId || !teacherId || !roomId || !dayOfWeek || !slot || !lectureType) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const normalizedLectureType = String(lectureType).toLowerCase() === 'lab' ? 'Lab' : 'Theory';
    const normalizedSlot = Number(slot);
    const normalizedSlotSpan = normalizeDuration(slotSpan, normalizedLectureType);
    const normalizedDivision = normalizeDivision(division);

    const settings = await getOrCreateSettings();
    const slotValidationError = validateSlotRangeAgainstSettings({
      slot: normalizedSlot,
      slotSpan: normalizedSlotSpan,
      lectureType: normalizedLectureType,
      maxSlot: settings.maxSlot,
      breakSlots: settings.breakSlots,
      dayStartTime: settings.dayStartTime,
      slotMinutes: settings.slotMinutes,
      breakWindows: settings.breakWindows
    });
    if (slotValidationError) {
      return res.status(400).json({ success: false, message: slotValidationError });
    }

    const room = await Room.findOne({ _id: roomId, isActive: true });
    if (!room) {
      return res.status(400).json({ success: false, message: 'Selected room is not active or does not exist.' });
    }

    // Only Admin/HOD for their branch
    if (req.user.role === 'hod') {
      const hodBranchIds = getHodBranchIds(req.user);
      if (!hodBranchIds.includes(normalizeId(branchId))) {
        return res.status(403).json({ success: false, message: 'HOD can only create for their branch' });
      }
    }

    const finalSlotSpan = normalizedSlotSpan;

    // Conflict check
    const conflictCheck = await checkSlotConflicts({
      semesterId,
      branchId,
      dayOfWeek,
      slot: normalizedSlot,
      slotSpan: finalSlotSpan,
      teacherId,
      roomId
    });
    if (conflictCheck.hasConflict) {
      return res.status(400).json({ success: false, message: 'Conflict detected', conflicts: conflictCheck.conflicts });
    }

    const teacherLoadError = await checkTeacherDailyLoad({
      teacherId,
      dayOfWeek,
      slotSpan: finalSlotSpan,
      slotMinutes: settings.slotMinutes,
      maxHoursPerDay: settings.teacherMaxHoursPerDay
    });
    if (teacherLoadError) {
      return res.status(400).json({ success: false, message: teacherLoadError });
    }

    const timetable = await Timetable.create({
      semesterId,
      branchId,
      subjectId,
      teacherId,
      roomId,
      dayOfWeek,
      division: normalizedDivision,
      slot: normalizedSlot,
      lectureType: normalizedLectureType,
      slotSpan: finalSlotSpan,
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
    const { semesterId, branchId, dayOfWeek, status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'active';
    }
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

router.get('/settings', protect, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      success: true,
      data: {
        dayStartTime: settings.dayStartTime || '10:30',
        dayEndTime: settings.dayEndTime || '18:00',
        slotMinutes: settings.slotMinutes || 60,
        maxSlot: settings.maxSlot,
        breakSlots: settings.breakSlots || [],
        breakWindows: settings.breakWindows || [],
        teacherMaxHoursPerDay: Number(settings.teacherMaxHoursPerDay) || 6
      }
    });
  } catch (error) {
    console.error('Get timetable settings error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching timetable settings' });
  }
});

router.put('/settings', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      dayStartTime = '10:30',
      dayEndTime = '18:00',
      slotMinutes = 60,
      maxSlot,
      breakSlots,
      breakWindows,
      teacherMaxHoursPerDay = 6
    } = req.body;

    const normalizedDayStart = String(dayStartTime || '').trim();
    const normalizedDayEnd = String(dayEndTime || '').trim();
    const normalizedSlotMinutes = Number(slotMinutes);

    if (!TIME_PATTERN.test(normalizedDayStart) || !TIME_PATTERN.test(normalizedDayEnd)) {
      return res.status(400).json({ success: false, message: 'dayStartTime and dayEndTime must be in HH:MM format.' });
    }

    if (!Number.isInteger(normalizedSlotMinutes) || normalizedSlotMinutes < 10 || normalizedSlotMinutes > 180) {
      return res.status(400).json({ success: false, message: 'slotMinutes must be between 10 and 180.' });
    }

    const startMinutes = toMinutes(normalizedDayStart);
    const endMinutes = toMinutes(normalizedDayEnd);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return res.status(400).json({ success: false, message: 'dayEndTime must be greater than dayStartTime.' });
    }

    const rangeMinutes = endMinutes - startMinutes;
    const derivedMaxSlot = Math.floor(rangeMinutes / normalizedSlotMinutes);
    if (derivedMaxSlot < 1) {
      return res.status(400).json({ success: false, message: 'Configured range is too short for selected slotMinutes.' });
    }

    const cappedDerivedMaxSlot = Math.min(MAX_SLOT_LIMIT, derivedMaxSlot);
    let numericMaxSlot = cappedDerivedMaxSlot;
    if (maxSlot !== undefined && maxSlot !== null && String(maxSlot).trim() !== '') {
      const requestedMax = Number(maxSlot);
      if (!Number.isInteger(requestedMax) || requestedMax < 1 || requestedMax > cappedDerivedMaxSlot) {
        return res.status(400).json({ success: false, message: `maxSlot must be between 1 and ${cappedDerivedMaxSlot} for configured time range.` });
      }
      numericMaxSlot = requestedMax;
    }

    const normalizedBreakSlots = Array.from(new Set((Array.isArray(breakSlots) ? breakSlots : [])
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0 && item <= numericMaxSlot))).sort((a, b) => a - b);

    const normalizedBreakWindows = normalizeBreakWindows(breakWindows, normalizedDayStart, normalizedDayEnd);
    const normalizedTeacherMaxHours = Number(teacherMaxHoursPerDay);
    if (!Number.isInteger(normalizedTeacherMaxHours) || normalizedTeacherMaxHours < 1 || normalizedTeacherMaxHours > 12) {
      return res.status(400).json({ success: false, message: 'teacherMaxHoursPerDay must be between 1 and 12.' });
    }

    const nextSettings = {
      dayStartTime: normalizedDayStart,
      dayEndTime: normalizedDayEnd,
      slotMinutes: normalizedSlotMinutes,
      maxSlot: numericMaxSlot,
      breakSlots: normalizedBreakSlots,
      breakWindows: normalizedBreakWindows,
      teacherMaxHoursPerDay: normalizedTeacherMaxHours,
      updatedBy: req.user._id
    };

    const existing = await TimetableSettings.collection.findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });
    if (existing?._id) {
      await TimetableSettings.collection.updateOne(
        { _id: existing._id },
        { $set: { ...nextSettings, updatedAt: new Date() } }
      );
    } else {
      await TimetableSettings.collection.insertOne({
        ...nextSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return res.json({
      success: true,
      message: 'Timetable settings updated successfully',
      data: {
        dayStartTime: nextSettings.dayStartTime,
        dayEndTime: nextSettings.dayEndTime,
        slotMinutes: nextSettings.slotMinutes,
        maxSlot: nextSettings.maxSlot,
        breakSlots: nextSettings.breakSlots,
        breakWindows: nextSettings.breakWindows,
        teacherMaxHoursPerDay: nextSettings.teacherMaxHoursPerDay
      }
    });
  } catch (error) {
    console.error('Update timetable settings error:', error);
    return res.status(500).json({ success: false, message: 'Error updating timetable settings' });
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

// ============ CREATE CHANGE REQUEST (for users without direct control) ============
router.post('/:id/change-request', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { requestType, reason, proposed = {} } = req.body;

    if (!['modify', 'delete'].includes(requestType)) {
      return res.status(400).json({ success: false, message: 'requestType must be modify or delete' });
    }

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    if (await canModifyTimetable(id, req.user)) {
      return res.status(400).json({
        success: false,
        message: 'You already have direct control on this timetable. Use Modify/Delete directly.'
      });
    }

    const duplicatePending = (timetable.changeRequests || []).some(
      (item) => item.status === 'pending' && normalizeId(item.requesterId) === normalizeId(req.user._id)
    );

    if (duplicatePending) {
      return res.status(400).json({ success: false, message: 'You already have a pending request for this entry.' });
    }

    let normalizedProposal = {};
    if (requestType === 'modify') {
      const division = normalizeDivision(proposed.division || timetable.division || 'General');
      const roomId = proposed.roomId || timetable.roomId;
      const dayOfWeek = proposed.dayOfWeek || timetable.dayOfWeek;
      const slot = Number(proposed.slot || timetable.slot);
      const lectureType = String(proposed.lectureType || timetable.lectureType).toLowerCase() === 'lab' ? 'Lab' : 'Theory';
      const slotSpan = normalizeDuration(proposed.slotSpan || timetable.slotSpan, lectureType);

      if (!roomId || !dayOfWeek || !slot || !lectureType) {
        return res.status(400).json({ success: false, message: 'Incomplete proposed changes for modify request.' });
      }

      const settings = await getOrCreateSettings();
      const slotValidationError = validateSlotRangeAgainstSettings({
        slot,
        slotSpan,
        lectureType,
        maxSlot: settings.maxSlot,
        breakSlots: settings.breakSlots,
        dayStartTime: settings.dayStartTime,
        slotMinutes: settings.slotMinutes,
        breakWindows: settings.breakWindows
      });
      if (slotValidationError) {
        return res.status(400).json({ success: false, message: slotValidationError });
      }

      const room = await Room.findOne({ _id: roomId, isActive: true });
      if (!room) {
        return res.status(400).json({ success: false, message: 'Selected proposed room is inactive or not found.' });
      }

      const teacherLoadError = await checkTeacherDailyLoad({
        teacherId: timetable.teacherId,
        dayOfWeek,
        slotSpan,
        slotMinutes: settings.slotMinutes,
        maxHoursPerDay: settings.teacherMaxHoursPerDay,
        excludeId: timetable._id
      });
      if (teacherLoadError) {
        return res.status(400).json({ success: false, message: teacherLoadError });
      }

      normalizedProposal = { division, roomId, dayOfWeek, slot, lectureType, slotSpan };
    }

    timetable.changeRequests.push({
      requesterId: req.user._id,
      requestType,
      reason: String(reason || '').trim(),
      proposed: normalizedProposal,
      status: 'pending'
    });

    await timetable.save();

    return res.status(201).json({
      success: true,
      message: 'Change request submitted to Admin/HOD for approval.'
    });
  } catch (error) {
    console.error('Create timetable change request error:', error);
    return res.status(500).json({ success: false, message: 'Error creating change request' });
  }
});

// ============ LIST CHANGE REQUESTS ============
router.get('/change-requests/list', protect, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = {};
    if (['pending', 'approved', 'rejected'].includes(status)) {
      query['changeRequests.status'] = status;
    }

    const userRole = req.user.role;
    if (userRole === 'admin') {
      const entries = await Timetable.find(query)
        .populate('changeRequests.requesterId', 'name email role')
        .populate('changeRequests.reviewedBy', 'name role')
        .populate('changeRequests.proposed.roomId', 'roomNo type')
        .sort({ updatedAt: -1 });

      const items = [];
      entries.forEach((entry) => {
        (entry.changeRequests || []).forEach((request) => {
          if (status && status !== 'all' && request.status !== status) return;
          items.push({
            request,
            timetable: entry
          });
        });
      });

      return res.json({ success: true, data: items });
    }

    if (userRole === 'hod') {
      const hodBranchIds = getHodBranchIds(req.user);
      const entries = await Timetable.find({
        ...query,
        branchId: { $in: hodBranchIds }
      })
        .populate('changeRequests.requesterId', 'name email role')
        .populate('changeRequests.reviewedBy', 'name role')
        .populate('changeRequests.proposed.roomId', 'roomNo type')
        .sort({ updatedAt: -1 });

      const items = [];
      entries.forEach((entry) => {
        (entry.changeRequests || []).forEach((request) => {
          if (status && status !== 'all' && request.status !== status) return;
          items.push({
            request,
            timetable: entry
          });
        });
      });

      return res.json({ success: true, data: items });
    }

    const entries = await Timetable.find({
      ...query,
      'changeRequests.requesterId': req.user._id
    })
      .populate('changeRequests.requesterId', 'name email role')
      .populate('changeRequests.reviewedBy', 'name role')
      .populate('changeRequests.proposed.roomId', 'roomNo type')
      .sort({ updatedAt: -1 });

    const items = [];
    entries.forEach((entry) => {
      (entry.changeRequests || []).forEach((request) => {
        if (normalizeId(request.requesterId) !== normalizeId(req.user._id)) return;
        if (status && status !== 'all' && request.status !== status) return;
        items.push({
          request,
          timetable: entry
        });
      });
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('List timetable change requests error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching change requests' });
  }
});

// ============ REVIEW CHANGE REQUEST ============
router.put('/change-requests/:requestId/review', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, reviewNote = '' } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'decision must be approved or rejected' });
    }

    const timetable = await Timetable.findOne({ 'changeRequests._id': requestId });
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Change request not found' });
    }

    if (!canReviewTimetableRequest(timetable, req.user)) {
      return res.status(403).json({ success: false, message: 'No permission to review this request' });
    }

    const request = timetable.changeRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Change request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request is already reviewed' });
    }

    if (decision === 'approved') {
      if (request.requestType === 'delete') {
        timetable.status = 'archived';
      } else {
        const nextRoomId = request.proposed?.roomId || timetable.roomId;
        const nextDay = request.proposed?.dayOfWeek || timetable.dayOfWeek;
        const nextSlot = Number(request.proposed?.slot || timetable.slot);
        const nextDivision = normalizeDivision(request.proposed?.division || timetable.division || 'General');
        const nextLectureType = String(request.proposed?.lectureType || timetable.lectureType).toLowerCase() === 'lab' ? 'Lab' : 'Theory';
        const nextSlotSpan = normalizeDuration(request.proposed?.slotSpan || timetable.slotSpan, nextLectureType);

        const settings = await getOrCreateSettings();
        const slotValidationError = validateSlotRangeAgainstSettings({
          slot: nextSlot,
          slotSpan: nextSlotSpan,
          lectureType: nextLectureType,
          maxSlot: settings.maxSlot,
          breakSlots: settings.breakSlots,
          dayStartTime: settings.dayStartTime,
          slotMinutes: settings.slotMinutes,
          breakWindows: settings.breakWindows
        });
        if (slotValidationError) {
          return res.status(400).json({ success: false, message: slotValidationError });
        }

        const room = await Room.findOne({ _id: nextRoomId, isActive: true });
        if (!room) {
          return res.status(400).json({ success: false, message: 'Requested room is inactive or not available.' });
        }

        const conflictCheck = await checkSlotConflicts({
          semesterId: timetable.semesterId,
          branchId: timetable.branchId,
          dayOfWeek: nextDay,
          slot: nextSlot,
          slotSpan: nextSlotSpan,
          teacherId: timetable.teacherId,
          roomId: nextRoomId,
          excludeId: timetable._id
        });

        if (conflictCheck.hasConflict) {
          return res.status(400).json({
            success: false,
            message: 'Cannot approve request due to current timetable conflict',
            conflicts: conflictCheck.conflicts
          });
        }

        const teacherLoadError = await checkTeacherDailyLoad({
          teacherId: timetable.teacherId,
          dayOfWeek: nextDay,
          slotSpan: nextSlotSpan,
          slotMinutes: settings.slotMinutes,
          maxHoursPerDay: settings.teacherMaxHoursPerDay,
          excludeId: timetable._id
        });
        if (teacherLoadError) {
          return res.status(400).json({ success: false, message: teacherLoadError });
        }

        timetable.roomId = nextRoomId;
        timetable.dayOfWeek = nextDay;
        timetable.division = nextDivision;
        timetable.slot = nextSlot;
        timetable.lectureType = nextLectureType;
        timetable.slotSpan = nextSlotSpan;
      }
    }

    request.status = decision;
    request.reviewedBy = req.user._id;
    request.reviewNote = String(reviewNote || '').trim();
    request.reviewedAt = new Date();

    await timetable.save();

    return res.json({
      success: true,
      message: decision === 'approved'
        ? 'Request approved and timetable updated successfully.'
        : 'Request rejected successfully.'
    });
  } catch (error) {
    console.error('Review timetable change request error:', error);
    return res.status(500).json({ success: false, message: 'Error reviewing change request' });
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
router.put('/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const timetableId = req.params.id;
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) return res.status(404).json({ success: false, message: 'Not found' });
    if (!(await canModifyTimetable(timetableId, req.user))) {
      return res.status(403).json({ success: false, message: 'No permission' });
    }
    const { roomId, dayOfWeek, division, slot, lectureType, slotSpan, status } = req.body;
    const normalizedSlot = slot === undefined ? timetable.slot : Number(slot);
    const normalizedLectureType = lectureType
      ? (String(lectureType).toLowerCase() === 'lab' ? 'Lab' : 'Theory')
      : timetable.lectureType;
    const normalizedSlotSpan = normalizeDuration(slotSpan === undefined ? timetable.slotSpan : slotSpan, normalizedLectureType);

    const settings = await getOrCreateSettings();
    const slotValidationError = validateSlotRangeAgainstSettings({
      slot: normalizedSlot,
      slotSpan: normalizedSlotSpan,
      lectureType: normalizedLectureType,
      maxSlot: settings.maxSlot,
      breakSlots: settings.breakSlots,
      dayStartTime: settings.dayStartTime,
      slotMinutes: settings.slotMinutes,
      breakWindows: settings.breakWindows
    });
    if (slotValidationError) {
      return res.status(400).json({ success: false, message: slotValidationError });
    }

    if (roomId) {
      const room = await Room.findOne({ _id: roomId, isActive: true });
      if (!room) {
        return res.status(400).json({ success: false, message: 'Selected room is not active or does not exist.' });
      }
      timetable.roomId = roomId;
    }
    if (dayOfWeek) timetable.dayOfWeek = dayOfWeek;
    if (division !== undefined) timetable.division = normalizeDivision(division, timetable.division || 'General');
    timetable.slot = normalizedSlot;
    timetable.lectureType = normalizedLectureType;
    timetable.slotSpan = normalizedSlotSpan;
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

    const teacherLoadError = await checkTeacherDailyLoad({
      teacherId: timetable.teacherId,
      dayOfWeek: timetable.dayOfWeek,
      slotSpan: timetable.slotSpan,
      slotMinutes: settings.slotMinutes,
      maxHoursPerDay: settings.teacherMaxHoursPerDay,
      excludeId: timetable._id
    });
    if (teacherLoadError) {
      return res.status(400).json({ success: false, message: teacherLoadError });
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
router.delete('/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
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
