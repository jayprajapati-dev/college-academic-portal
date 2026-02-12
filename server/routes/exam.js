const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ExamSchedule = require('../models/ExamSchedule');
const ExamResult = require('../models/ExamResult');
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

const ensureSubjectAccess = async (subjectId, user) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return { error: 'Subject not found' };
  }

  if (user.role === 'teacher') {
    const assigned = user.assignedSubjects || [];
    const isAssigned = assigned.map((id) => String(id)).includes(String(subjectId));
    if (!isAssigned) {
      return { error: 'You can only manage exams for your assigned subjects' };
    }
  }

  if (user.role === 'hod') {
    const allowedBranches = buildBranchScope(user);
    if (!allowedBranches.includes(String(subject.branchId))) {
      return { error: 'You can only manage exams for your branch' };
    }
  }

  return { subject };
};

// GET students for results entry
router.get('/students', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { subjectId, branchId, semesterId } = req.query;
    const query = { role: 'student', status: { $ne: 'disabled' } };

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subject id' });
      }
      const access = await ensureSubjectAccess(subjectId, req.user);
      if (access.error) {
        return res.status(403).json({ success: false, message: access.error });
      }

      query.branch = access.subject.branchId;
      query.semester = access.subject.semesterId;
    } else {
      if (branchId) query.branch = branchId;
      if (semesterId) query.semester = semesterId;

      if (req.user.role === 'hod' || req.user.role === 'teacher') {
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

    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('Get exam students error:', error);
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
});

// CREATE exam schedule
router.post('/schedules', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { examName, examType, subjectId, date, startTime, endTime, venue, instructions, status } = req.body;

    if (!examName || !subjectId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const access = await ensureSubjectAccess(subjectId, req.user);
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const schedule = await ExamSchedule.create({
      examName,
      examType: examType || 'Internal',
      subjectId,
      branchId: access.subject.branchId,
      semesterId: access.subject.semesterId,
      date,
      startTime,
      endTime,
      venue,
      instructions,
      status: status === 'cancelled' ? 'cancelled' : status === 'completed' ? 'completed' : 'scheduled',
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    res.status(201).json({ success: true, message: 'Exam scheduled successfully', data: schedule });
  } catch (error) {
    console.error('Create exam schedule error:', error);
    res.status(500).json({ success: false, message: 'Error creating exam schedule' });
  }
});

// GET exam schedules
router.get('/schedules', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 10, subjectId, branchId, semesterId, status } = req.query;
    const query = {};

    if (subjectId) query.subjectId = subjectId;
    if (branchId) query.branchId = branchId;
    if (semesterId) query.semesterId = semesterId;
    if (status && status !== 'all') query.status = status;

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const assignedIds = assigned.map((id) => String(id));
      query.subjectId = query.subjectId ? query.subjectId : { $in: assignedIds };
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      if (query.branchId && !allowedBranches.includes(String(query.branchId))) {
        return res.status(403).json({ success: false, message: 'You can only access schedules for your branch' });
      }
      if (!query.branchId) {
        query.branchId = { $in: allowedBranches };
      }
    }

    const schedules = await ExamSchedule.find(query)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber')
      .populate('createdBy', 'name email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ date: 1, startTime: 1 });

    const total = await ExamSchedule.countDocuments(query);

    res.json({
      success: true,
      count: schedules.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: schedules
    });
  } catch (error) {
    console.error('Get exam schedules error:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam schedules' });
  }
});

// UPDATE exam schedule
router.put('/schedules/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }

    const schedule = await ExamSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    const access = await ensureSubjectAccess(schedule.subjectId, req.user);
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const updated = await ExamSchedule.findByIdAndUpdate(
      id,
      {
        examName: req.body.examName ?? schedule.examName,
        examType: req.body.examType ?? schedule.examType,
        date: req.body.date ?? schedule.date,
        startTime: req.body.startTime ?? schedule.startTime,
        endTime: req.body.endTime ?? schedule.endTime,
        venue: req.body.venue ?? schedule.venue,
        instructions: req.body.instructions ?? schedule.instructions,
        status: req.body.status ?? schedule.status
      },
      { new: true }
    );

    res.json({ success: true, message: 'Exam schedule updated', data: updated });
  } catch (error) {
    console.error('Update exam schedule error:', error);
    res.status(500).json({ success: false, message: 'Error updating exam schedule' });
  }
});

// DELETE exam schedule
router.delete('/schedules/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }

    const schedule = await ExamSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    const access = await ensureSubjectAccess(schedule.subjectId, req.user);
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    await ExamSchedule.findByIdAndDelete(id);
    await ExamResult.deleteMany({ examId: id });

    res.json({ success: true, message: 'Exam schedule deleted' });
  } catch (error) {
    console.error('Delete exam schedule error:', error);
    res.status(500).json({ success: false, message: 'Error deleting exam schedule' });
  }
});

// SAVE results (bulk)
router.post('/results/bulk', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { examId, subjectId, results = [] } = req.body;

    if (!examId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Exam and subject are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid exam or subject id' });
    }

    const schedule = await ExamSchedule.findById(examId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    const access = await ensureSubjectAccess(subjectId, req.user);
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const payload = results.map((item) => ({
      examId,
      subjectId,
      studentId: item.studentId,
      marksObtained: item.marksObtained,
      totalMarks: item.totalMarks,
      grade: item.grade,
      status: item.status || 'pass',
      remarks: item.remarks,
      recordedBy: req.user._id,
      recordedByRole: req.user.role
    }));

    const operations = payload.map((item) => ({
      updateOne: {
        filter: { examId, studentId: item.studentId },
        update: item,
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await ExamResult.bulkWrite(operations);
    }

    res.json({ success: true, message: 'Results saved successfully' });
  } catch (error) {
    console.error('Save exam results error:', error);
    res.status(500).json({ success: false, message: 'Error saving exam results' });
  }
});

// GET results (admin/hod/teacher)
router.get('/results', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { examId, subjectId, studentId } = req.query;
    const query = {};

    if (examId) query.examId = examId;
    if (subjectId) query.subjectId = subjectId;
    if (studentId) query.studentId = studentId;

    if (req.user.role === 'teacher') {
      const assigned = req.user.assignedSubjects || [];
      const assignedIds = assigned.map((id) => String(id));
      query.subjectId = query.subjectId ? query.subjectId : { $in: assignedIds };
    }

    if (req.user.role === 'hod') {
      const allowedBranches = buildBranchScope(req.user);
      const subjectQuery = { branchId: { $in: allowedBranches } };
      if (subjectId) subjectQuery._id = subjectId;
      const subjects = await Subject.find(subjectQuery).select('_id');
      const subjectIds = subjects.map((subject) => subject._id);
      query.subjectId = { $in: subjectIds };
    }

    const results = await ExamResult.find(query)
      .populate('examId', 'examName examType date')
      .populate('subjectId', 'name code')
      .populate('studentId', 'name email enrollmentNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam results' });
  }
});

// STUDENT: exam schedules
router.get('/student/schedules', protect, authorize('student'), async (req, res) => {
  try {
    const query = {
      branchId: req.user.branch,
      semesterId: req.user.semester,
      status: 'scheduled'
    };

    const schedules = await ExamSchedule.find(query)
      .populate('subjectId', 'name code')
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    console.error('Student exam schedules error:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam schedules' });
  }
});

// STUDENT: exam results
router.get('/student/results', protect, authorize('student'), async (req, res) => {
  try {
    const results = await ExamResult.find({ studentId: req.user._id })
      .populate('examId', 'examName examType date')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Student exam results error:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam results' });
  }
});

module.exports = router;
