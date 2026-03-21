const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ExamSchedule = require('../models/ExamSchedule');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const EXAM_CATEGORIES = [
  'Custom',
  'Mid Exam',
  'Pa-1 Exam',
  'Pa-2 Exam',
  'GTU Exam',
  'Test Exam',
  'Practical Exam',
  'Internal Exam',
  'External Exam'
];

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }
  return null;
};

const normalizeIdList = (values) => {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map((value) => normalizeId(value)).filter(Boolean)));
};

const buildBranchScope = (user) => {
  const branchIds = [];
  if (user.branch) branchIds.push(user.branch);
  if (user.department) branchIds.push(user.department);
  if (Array.isArray(user.branches)) branchIds.push(...user.branches);
  if (user.coordinator?.branch) branchIds.push(user.coordinator.branch);
  return normalizeIdList(branchIds);
};

const getCoordinatorScope = (user) => {
  const assignment = user?.coordinator;
  if (!assignment || assignment.status === 'expired' || !assignment.branch) return null;
  return {
    branchId: normalizeId(assignment.branch),
    semesterIds: normalizeIdList(assignment.semesters)
  };
};

const getEffectiveRole = (user) => {
  if (user?.role === 'admin' || user?.adminAccess === true) return 'admin';
  return user?.role;
};

const parseExamTypePayload = ({ examCategory, customExamType, examType }) => {
  const category = EXAM_CATEGORIES.includes(examCategory) ? examCategory : null;

  if (category === 'Custom') {
    const custom = String(customExamType || examType || '').trim();
    if (!custom) {
      return { error: 'Custom exam type is required when category is Custom' };
    }
    return {
      examCategory: 'Custom',
      customExamType: custom,
      examType: custom
    };
  }

  if (category) {
    return {
      examCategory: category,
      customExamType: '',
      examType: category
    };
  }

  const fallbackType = String(examType || 'Internal Exam').trim() || 'Internal Exam';
  if (EXAM_CATEGORIES.includes(fallbackType) && fallbackType !== 'Custom') {
    return {
      examCategory: fallbackType,
      customExamType: '',
      examType: fallbackType
    };
  }

  return {
    examCategory: 'Custom',
    customExamType: fallbackType,
    examType: fallbackType
  };
};

const subjectMatchesOffering = (subject, branchId, semesterId) => {
  const directBranch = normalizeId(subject?.branchId);
  const directSemester = normalizeId(subject?.semesterId);
  if (directBranch === branchId && directSemester === semesterId) return true;

  const offerings = Array.isArray(subject?.offerings) ? subject.offerings : [];
  return offerings.some((off) => normalizeId(off?.branchId) === branchId && normalizeId(off?.semesterId) === semesterId);
};

const ensureScopeAccess = ({ user, branchId, semesterId }) => {
  const role = getEffectiveRole(user);
  if (role === 'admin') return { ok: true };

  if (role === 'hod') {
    const allowedBranches = buildBranchScope(user);
    if (!allowedBranches.includes(branchId)) {
      return { ok: false, error: 'You can only manage exams for your branch' };
    }
    return { ok: true };
  }

  if (role === 'coordinator') {
    const scope = getCoordinatorScope(user);
    if (!scope?.branchId) {
      return { ok: false, error: 'Coordinator scope is not configured' };
    }
    if (scope.branchId !== branchId) {
      return { ok: false, error: 'You can only manage exams for your assigned branch' };
    }
    if (scope.semesterIds.length > 0 && !scope.semesterIds.includes(semesterId)) {
      return { ok: false, error: 'You can only manage exams for your assigned semesters' };
    }
    return { ok: true };
  }

  return { ok: false, error: 'You are not authorized to manage exams' };
};

const ensureSubjectAccess = async ({ subjectId, user, branchId, semesterId }) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return { error: 'Subject not found' };
  }

  const role = getEffectiveRole(user);

  if (role === 'teacher') {
    const assignedIds = normalizeIdList(user.assignedSubjects || []);
    const isAssigned = assignedIds.includes(String(subjectId));
    if (!isAssigned) {
      return { error: 'You can only manage exams for your assigned subjects' };
    }
  }

  if (branchId && semesterId && !subjectMatchesOffering(subject, branchId, semesterId)) {
    return { error: 'Subject does not belong to the selected branch and semester' };
  }

  if (branchId && semesterId && role !== 'teacher') {
    const scopeCheck = ensureScopeAccess({ user, branchId, semesterId });
    if (!scopeCheck.ok) {
      return { error: scopeCheck.error };
    }
  }

  return { subject };
};

const buildScheduleDoc = ({ body, subject, user, examTypeData, examName }) => ({
  examName,
  examType: examTypeData.examType,
  examCategory: examTypeData.examCategory,
  customExamType: examTypeData.customExamType,
  subjectId: subject._id,
  branchId: body.branchId,
  semesterId: body.semesterId,
  date: body.date,
  startTime: body.startTime,
  endTime: body.endTime,
  venue: body.venue,
  instructions: body.instructions,
  status: body.status === 'cancelled' ? 'cancelled' : body.status === 'completed' ? 'completed' : 'scheduled',
  createdBy: user._id,
  createdByRole: user.role
});

router.get('/meta', protect, authorize('admin', 'hod', 'coordinator'), async (req, res) => {
  try {
    const role = getEffectiveRole(req.user);

    const query = { isActive: true };
    if (role === 'hod') {
      const branchIds = buildBranchScope(req.user);
      query.$or = [
        { branchId: { $in: branchIds } },
        { 'offerings.branchId': { $in: branchIds } }
      ];
    }
    if (role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope) {
        return res.json({ success: true, data: { subjects: [], branchIds: [], semesterIds: [] } });
      }

      const semesterFilter = scope.semesterIds.length > 0
        ? [{ semesterId: { $in: scope.semesterIds } }, { 'offerings.semesterId': { $in: scope.semesterIds } }]
        : [{}];

      query.$or = semesterFilter.flatMap((semesterEntry) => ([
        { branchId: scope.branchId, ...semesterEntry },
        { offerings: { $elemMatch: { branchId: scope.branchId, ...(semesterEntry.semesterId ? { semesterId: { $in: scope.semesterIds.map((s) => new mongoose.Types.ObjectId(s)) } } : {}) } } }
      ]));
    }

    const subjects = await Subject.find(query)
      .select('_id name code branchId semesterId offerings isActive')
      .populate('branchId', 'name code')
      .populate('semesterId', 'name semesterNumber academicYear')
      .populate('offerings.branchId', 'name code')
      .populate('offerings.semesterId', 'name semesterNumber academicYear')
      .sort({ code: 1, name: 1 });

    const normalized = [];
    subjects.forEach((subject) => {
      const directBranch = normalizeId(subject.branchId);
      const directSemester = normalizeId(subject.semesterId);
      if (directBranch && directSemester) {
        normalized.push({
          subjectId: String(subject._id),
          subjectName: subject.name,
          subjectCode: subject.code,
          branchId: directBranch,
          branchName: subject.branchId?.name || 'Branch',
          semesterId: directSemester,
          semesterName: subject.semesterId?.name || `Semester ${subject.semesterId?.semesterNumber || ''}`.trim()
        });
      }

      const offerings = Array.isArray(subject.offerings) ? subject.offerings : [];
      offerings.forEach((offering) => {
        const offBranch = normalizeId(offering.branchId);
        const offSemester = normalizeId(offering.semesterId);
        if (!offBranch || !offSemester) return;
        normalized.push({
          subjectId: String(subject._id),
          subjectName: subject.name,
          subjectCode: subject.code,
          branchId: offBranch,
          branchName: offering.branchId?.name || 'Branch',
          semesterId: offSemester,
          semesterName: offering.semesterId?.name || `Semester ${offering.semesterId?.semesterNumber || ''}`.trim()
        });
      });
    });

    const seen = new Set();
    const entries = normalized.filter((row) => {
      const key = `${row.subjectId}:${row.branchId}:${row.semesterId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({
      success: true,
      data: {
        examCategories: EXAM_CATEGORIES,
        entries
      }
    });
  } catch (error) {
    console.error('Exam meta error:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam metadata' });
  }
});

router.get('/students', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { subjectId, branchId, semesterId } = req.query;
    const query = { role: 'student', status: { $ne: 'disabled' } };

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subject id' });
      }

      const access = await ensureSubjectAccess({
        subjectId,
        user: req.user
      });
      if (access.error) {
        return res.status(403).json({ success: false, message: access.error });
      }

      query.branch = access.subject.branchId;
      query.semester = access.subject.semesterId;
    } else {
      if (branchId) query.branch = branchId;
      if (semesterId) query.semester = semesterId;

      if (req.user.role === 'hod' || req.user.role === 'teacher' || req.user.role === 'coordinator') {
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

router.post('/schedules', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const {
      examName,
      examType,
      examCategory,
      customExamType,
      subjectId,
      branchId,
      semesterId,
      date,
      startTime,
      endTime,
      venue,
      instructions,
      status
    } = req.body;

    if (!subjectId || !branchId || !semesterId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(branchId) || !mongoose.Types.ObjectId.isValid(semesterId)) {
      return res.status(400).json({ success: false, message: 'Invalid subject, branch or semester id' });
    }

    const examTypeData = parseExamTypePayload({ examCategory, customExamType, examType });
    if (examTypeData.error) {
      return res.status(400).json({ success: false, message: examTypeData.error });
    }

    const access = await ensureSubjectAccess({
      subjectId,
      user: req.user,
      branchId: String(branchId),
      semesterId: String(semesterId)
    });
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const finalExamName = String(examName || `${examTypeData.examType} - ${access.subject.code || access.subject.name}`).trim();
    if (!finalExamName) {
      return res.status(400).json({ success: false, message: 'Exam name is required' });
    }

    const schedule = await ExamSchedule.create(buildScheduleDoc({
      body: { branchId, semesterId, date, startTime, endTime, venue, instructions, status },
      subject: access.subject,
      user: req.user,
      examTypeData,
      examName: finalExamName
    }));

    res.status(201).json({ success: true, message: 'Exam scheduled successfully', data: schedule });
  } catch (error) {
    console.error('Create exam schedule error:', error);
    res.status(500).json({ success: false, message: 'Error creating exam schedule' });
  }
});

router.post('/schedules/bulk', protect, authorize('admin', 'hod', 'coordinator'), async (req, res) => {
  try {
    const {
      branchId,
      semesterId,
      date,
      startTime,
      endTime,
      venue,
      instructions,
      status,
      examType,
      examCategory,
      customExamType,
      items
    } = req.body;

    if (!branchId || !semesterId || !date || !startTime || !endTime || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide branch, semester, schedule details and at least one subject' });
    }

    if (!mongoose.Types.ObjectId.isValid(branchId) || !mongoose.Types.ObjectId.isValid(semesterId)) {
      return res.status(400).json({ success: false, message: 'Invalid branch or semester id' });
    }

    const scopeCheck = ensureScopeAccess({ user: req.user, branchId: String(branchId), semesterId: String(semesterId) });
    if (!scopeCheck.ok) {
      return res.status(403).json({ success: false, message: scopeCheck.error });
    }

    const examTypeData = parseExamTypePayload({ examCategory, customExamType, examType });
    if (examTypeData.error) {
      return res.status(400).json({ success: false, message: examTypeData.error });
    }

    const payloadItems = items
      .map((item) => ({ subjectId: item?.subjectId, examName: item?.examName }))
      .filter((item) => item.subjectId && mongoose.Types.ObjectId.isValid(item.subjectId));

    if (payloadItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid subjects selected' });
    }

    const createdDocs = [];

    for (const item of payloadItems) {
      const access = await ensureSubjectAccess({
        subjectId: item.subjectId,
        user: req.user,
        branchId: String(branchId),
        semesterId: String(semesterId)
      });

      if (access.error) {
        return res.status(403).json({ success: false, message: access.error });
      }

      const autoName = `${examTypeData.examType} - ${access.subject.code || access.subject.name}`;
      const finalExamName = String(item.examName || autoName).trim();
      if (!finalExamName) {
        return res.status(400).json({ success: false, message: 'Exam name is required for all selected subjects' });
      }

      createdDocs.push(buildScheduleDoc({
        body: { branchId, semesterId, date, startTime, endTime, venue, instructions, status },
        subject: access.subject,
        user: req.user,
        examTypeData,
        examName: finalExamName
      }));
    }

    const created = await ExamSchedule.insertMany(createdDocs);

    res.status(201).json({
      success: true,
      message: `${created.length} exam schedules created successfully`,
      count: created.length,
      data: created
    });
  } catch (error) {
    console.error('Bulk create exam schedules error:', error);
    res.status(500).json({ success: false, message: 'Error creating exam schedules' });
  }
});

router.get('/schedules', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 10, subjectId, branchId, semesterId, status } = req.query;
    const query = {};

    if (subjectId) query.subjectId = subjectId;
    if (branchId) query.branchId = branchId;
    if (semesterId) query.semesterId = semesterId;
    if (status && status !== 'all') query.status = status;

    if (req.user.role === 'teacher') {
      const assignedIds = normalizeIdList(req.user.assignedSubjects || []);
      if (assignedIds.length === 0) {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          pages: 1,
          currentPage: Number(page),
          data: []
        });
      }
      if (query.subjectId && !assignedIds.includes(String(query.subjectId))) {
        return res.status(403).json({ success: false, message: 'You can only access schedules for your assigned subjects' });
      }
      query.subjectId = query.subjectId || { $in: assignedIds };
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

    if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope) {
        return res.json({ success: true, count: 0, total: 0, pages: 1, currentPage: Number(page), data: [] });
      }

      if (query.branchId && String(query.branchId) !== scope.branchId) {
        return res.status(403).json({ success: false, message: 'You can only access schedules for your assigned branch' });
      }

      query.branchId = scope.branchId;

      if (scope.semesterIds.length > 0) {
        if (query.semesterId && !scope.semesterIds.includes(String(query.semesterId))) {
          return res.status(403).json({ success: false, message: 'You can only access schedules for your assigned semesters' });
        }
        if (!query.semesterId) {
          query.semesterId = { $in: scope.semesterIds };
        }
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

router.put('/schedules/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }

    const schedule = await ExamSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    const access = await ensureSubjectAccess({
      subjectId: schedule.subjectId,
      user: req.user,
      branchId: String(schedule.branchId),
      semesterId: String(schedule.semesterId)
    });
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const examTypeData = parseExamTypePayload({
      examCategory: req.body.examCategory ?? schedule.examCategory,
      customExamType: req.body.customExamType ?? schedule.customExamType,
      examType: req.body.examType ?? schedule.examType
    });

    if (examTypeData.error) {
      return res.status(400).json({ success: false, message: examTypeData.error });
    }

    const updated = await ExamSchedule.findByIdAndUpdate(
      id,
      {
        examName: req.body.examName ?? schedule.examName,
        examType: examTypeData.examType,
        examCategory: examTypeData.examCategory,
        customExamType: examTypeData.customExamType,
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

router.delete('/schedules/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }

    const schedule = await ExamSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    const access = await ensureSubjectAccess({
      subjectId: schedule.subjectId,
      user: req.user,
      branchId: String(schedule.branchId),
      semesterId: String(schedule.semesterId)
    });
    if (access.error) {
      return res.status(403).json({ success: false, message: access.error });
    }

    await ExamSchedule.findByIdAndDelete(id);

    res.json({ success: true, message: 'Exam schedule deleted' });
  } catch (error) {
    console.error('Delete exam schedule error:', error);
    res.status(500).json({ success: false, message: 'Error deleting exam schedule' });
  }
});

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

module.exports = router;
