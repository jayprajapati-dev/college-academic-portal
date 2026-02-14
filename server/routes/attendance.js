const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const buildBranchScope = (user) => {
  const branchIds = [];
  if (user.branch) branchIds.push(user.branch);
  if (user.department) branchIds.push(user.department);
  if (Array.isArray(user.branches)) branchIds.push(...user.branches);
  return [...new Set(branchIds.map((id) => String(id)))].filter(Boolean);
};

const buildDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      dateKey: value,
      date: new Date(`${value}T00:00:00`)
    };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    dateKey: date.toISOString().slice(0, 10),
    date
  };
};

const buildSummary = (records) => {
  const summary = {
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    total: records.length
  };

  records.forEach((record) => {
    if (record.status === 'present') summary.presentCount += 1;
    if (record.status === 'absent') summary.absentCount += 1;
    if (record.status === 'late') summary.lateCount += 1;
  });

  return summary;
};

// GET students for attendance
router.get('/students', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { subjectId, branchId, semesterId } = req.query;
    const query = { role: 'student', status: { $ne: 'disabled' } };

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subject id' });
      }
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      if (req.user.role === 'teacher') {
        const assigned = req.user.assignedSubjects || [];
        const isAssigned = assigned.map((id) => String(id)).includes(String(subjectId));
        if (!isAssigned) {
          return res.status(403).json({ success: false, message: 'You can only mark attendance for your subjects' });
        }
      }

      if (req.user.role === 'hod') {
        const allowedBranches = buildBranchScope(req.user);
        if (!allowedBranches.includes(String(subject.branchId))) {
          return res.status(403).json({ success: false, message: 'You can only mark attendance for your branch' });
        }
      }

      query.branch = subject.branchId;
      query.semester = subject.semesterId;
    } else {
      if (branchId) query.branch = branchId;
      if (semesterId) query.semester = semesterId;

      if (req.user.role === 'hod') {
        const allowedBranches = buildBranchScope(req.user);
        if (query.branch && !allowedBranches.includes(String(query.branch))) {
          return res.status(403).json({ success: false, message: 'You can only access students in your branch' });
        }
        if (!query.branch) {
          query.branch = { $in: allowedBranches };
        }
      }

      if (req.user.role === 'teacher') {
        const allowedBranches = buildBranchScope(req.user);
        if (query.branch && !allowedBranches.includes(String(query.branch))) {
          return res.status(403).json({ success: false, message: 'You can only access students in your branch' });
        }
        if (!query.branch && allowedBranches.length > 0) {
          query.branch = { $in: allowedBranches };
        }
      }
    }

    const students = await User.find(query)
      .select('name email enrollmentNumber branch semester')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get attendance students error:', error);
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
});

// CREATE/UPDATE attendance session
router.post('/sessions', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { subjectId, date, session = 'Lecture', records = [] } = req.body;

    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const isAssigned = assigned.map((id) => String(id)).includes(String(subjectId));
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You can only mark attendance for your subjects' });
      }
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      if (!allowedBranches.includes(String(subject.branchId))) {
        return res.status(403).json({ success: false, message: 'You can only mark attendance for your branch' });
      }
    }

    const dateInfo = buildDateKey(date || new Date());
    if (!dateInfo) {
      return res.status(400).json({ success: false, message: 'Invalid attendance date' });
    }

    const normalizedRecords = Array.isArray(records)
      ? records.map((record) => ({
          studentId: record.studentId,
          status: record.status || 'present',
          note: record.note || ''
        }))
      : [];

    const summary = buildSummary(normalizedRecords);
    const query = { subjectId, dateKey: dateInfo.dateKey, session };
    const update = {
      subjectId,
      branchId: subject.branchId,
      semesterId: subject.semesterId,
      date: dateInfo.date,
      dateKey: dateInfo.dateKey,
      session,
      records: normalizedRecords,
      summary,
      markedBy: req.user._id,
      markedByRole: req.user.role
    };

    const attendance = await Attendance.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    });

    res.status(201).json({
      success: true,
      message: 'Attendance saved successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({ success: false, message: 'Error saving attendance' });
  }
});

// GET attendance sessions (admin/hod/teacher)
router.get('/sessions', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 10, subjectId, branchId, semesterId, dateKey, session } = req.query;
    const query = {};

    if (subjectId) query.subjectId = subjectId;
    if (branchId) query.branchId = branchId;
    if (semesterId) query.semesterId = semesterId;
    if (dateKey) query.dateKey = dateKey;
    if (session) query.session = session;

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const assignedIds = assigned.map((id) => String(id));
      query.subjectId = query.subjectId
        ? query.subjectId
        : { $in: assignedIds };
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      if (query.branchId && !allowedBranches.includes(String(query.branchId))) {
        return res.status(403).json({ success: false, message: 'You can only access attendance for your branch' });
      }
      if (!query.branchId) {
        query.branchId = { $in: allowedBranches };
      }
    }

    const sessions = await Attendance.find(query)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber')
      .populate('markedBy', 'name email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ date: -1, createdAt: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      count: sessions.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: sessions
    });
  } catch (error) {
    console.error('Get attendance sessions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance sessions' });
  }
});

// GET attendance session by ID
router.get('/sessions/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance id' });
    }

    const session = await Attendance.findById(id)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber')
      .populate('records.studentId', 'name email enrollmentNumber');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const assignedIds = assigned.map((value) => String(value));
      if (!assignedIds.includes(String(session.subjectId?._id))) {
        return res.status(403).json({ success: false, message: 'You can only access your subject attendance' });
      }
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      if (!allowedBranches.includes(String(session.branchId))) {
        return res.status(403).json({ success: false, message: 'You can only access attendance for your branch' });
      }
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Get attendance session error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance session' });
  }
});

// UPDATE attendance session
router.put('/sessions/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance id' });
    }

    const session = await Attendance.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const assignedIds = assigned.map((value) => String(value));
      if (!assignedIds.includes(String(session.subjectId))) {
        return res.status(403).json({ success: false, message: 'You can only update your subject attendance' });
      }
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      if (!allowedBranches.includes(String(session.branchId))) {
        return res.status(403).json({ success: false, message: 'You can only update attendance for your branch' });
      }
    }

    const normalizedRecords = Array.isArray(req.body.records)
      ? req.body.records.map((record) => ({
          studentId: record.studentId,
          status: record.status || 'present',
          note: record.note || ''
        }))
      : session.records;

    const summary = buildSummary(normalizedRecords);

    session.records = normalizedRecords;
    session.summary = summary;
    session.markedBy = req.user._id;
    session.markedByRole = req.user.role;
    await session.save();

    res.json({ success: true, message: 'Attendance updated successfully', data: session });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Error updating attendance' });
  }
});

// DELETE attendance session
router.delete('/sessions/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance id' });
    }

    const session = await Attendance.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const assignedIds = assigned.map((value) => String(value));
      if (!assignedIds.includes(String(session.subjectId))) {
        return res.status(403).json({ success: false, message: 'You can only delete your subject attendance' });
      }
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      if (!allowedBranches.includes(String(session.branchId))) {
        return res.status(403).json({ success: false, message: 'You can only delete attendance for your branch' });
      }
    }

    await Attendance.findByIdAndDelete(id);

    res.json({ success: true, message: 'Attendance session deleted' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, message: 'Error deleting attendance' });
  }
});

// STUDENT: Attendance summary
router.get('/student/summary', protect, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    const sessions = await Attendance.find({ 'records.studentId': studentId })
      .populate('subjectId', 'name code')
      .sort({ date: -1 });

    const summaryBySubject = {};
    let totalSessions = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    sessions.forEach((session) => {
      const subjectKey = String(session.subjectId?._id || session.subjectId);
      if (!summaryBySubject[subjectKey]) {
        summaryBySubject[subjectKey] = {
          subjectId: session.subjectId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }

      const record = session.records.find((item) => String(item.studentId) === String(studentId));
      if (!record) return;

      summaryBySubject[subjectKey].total += 1;
      totalSessions += 1;

      if (record.status === 'present') {
        summaryBySubject[subjectKey].present += 1;
        totalPresent += 1;
      }
      if (record.status === 'absent') {
        summaryBySubject[subjectKey].absent += 1;
        totalAbsent += 1;
      }
      if (record.status === 'late') {
        summaryBySubject[subjectKey].late += 1;
        totalLate += 1;
      }
    });

    const subjects = Object.values(summaryBySubject).map((item) => {
      const percentage = item.total ? Math.round((item.present / item.total) * 100) : 0;
      return { ...item, percentage, lowAttendance: percentage < 75 };
    });

    const overallPercentage = totalSessions ? Math.round((totalPresent / totalSessions) * 100) : 0;

    res.json({
      success: true,
      summary: {
        total: totalSessions,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        percentage: overallPercentage
      },
      subjects
    });
  } catch (error) {
    console.error('Student attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance summary' });
  }
});

// STUDENT: Attendance history by subject
router.get('/student/subject/:subjectId', protect, authorize('student'), async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const sessions = await Attendance.find({
      subjectId,
      'records.studentId': req.user._id
    })
      .populate('subjectId', 'name code')
      .sort({ date: -1 });

    const data = sessions.map((session) => {
      const record = session.records.find((item) => String(item.studentId) === String(req.user._id));
      return {
        id: session._id,
        date: session.date,
        dateKey: session.dateKey,
        session: session.session,
        status: record?.status || 'absent'
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Student attendance subject error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance history' });
  }
});

module.exports = router;
