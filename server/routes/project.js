const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Project = require('../models/Project');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

const hasAssignedSubject = (user, subjectId) => {
  const assigned = Array.isArray(user.assignedSubjects) ? user.assignedSubjects : [];
  return assigned.some((id) => String(id) === String(subjectId));
};

const getCoordinatorScope = (user) => {
  const assignment = user?.coordinator;
  if (!assignment || assignment.status === 'expired') return null;
  return {
    branchId: assignment.branch,
    semesterIds: Array.isArray(assignment.semesters) ? assignment.semesters : []
  };
};

const getHodBranchScope = (user) => ([
  ...(Array.isArray(user?.branches) ? user.branches : []),
  user?.branch,
  user?.department
].filter(Boolean).map((id) => String(id)));

const canUserAccessSubject = (user, subject) => {
  if (!user || !subject) return false;

  const subjectBranchId = subject?.branchId?._id || subject?.branchId;
  const subjectSemesterId = subject?.semesterId?._id || subject?.semesterId;
  if (!subjectBranchId || !subjectSemesterId) return false;

  if (user.role === 'admin') return true;

  if (user.role === 'student') {
    return String(user.branch) === String(subjectBranchId)
      && String(user.semester) === String(subjectSemesterId);
  }

  if (user.role === 'teacher') {
    return hasAssignedSubject(user, subject._id || subject.id);
  }

  if (user.role === 'hod') {
    const branchScope = new Set(getHodBranchScope(user));
    return branchScope.has(String(subjectBranchId));
  }

  if (user.role === 'coordinator') {
    const scope = getCoordinatorScope(user);
    if (!scope || !scope.branchId) return false;
    const semesterSet = new Set(scope.semesterIds.map((id) => String(id)));
    return String(scope.branchId) === String(subjectBranchId)
      && semesterSet.has(String(subjectSemesterId));
  }

  return false;
};

const canUserManageSubject = (user, subject) => {
  if (!user || !subject) return false;

  if (user.role === 'admin') return true;
  if (user.role === 'teacher') return hasAssignedSubject(user, subject._id || subject.id);

  if (user.role === 'hod') {
    const branchScope = new Set(getHodBranchScope(user));
    return branchScope.has(String(subject.branchId));
  }

  if (user.role === 'coordinator') {
    const scope = getCoordinatorScope(user);
    if (!scope || !scope.branchId) return false;
    const semesterSet = new Set(scope.semesterIds.map((id) => String(id)));
    return String(scope.branchId) === String(subject.branchId)
      && semesterSet.has(String(subject.semesterId));
  }

  return false;
};

// CREATE PROJECT
router.post('/create', protect, authorize('admin', 'teacher', 'hod', 'coordinator'), async (req, res) => {
  try {
    const { title, description, category, subjectId, dueDate, teamSize, resources = [], status } = req.body;

    if (!title || !description || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description and subject are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const subject = await Subject.findById(subjectId).select('_id branchId semesterId');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (!canUserManageSubject(req.user, subject)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this subject' });
    }

    const project = await Project.create({
      title,
      description,
      category: category || 'Mini Project',
      subjectId: subject._id,
      branchId: subject.branchId,
      semesterId: subject.semesterId,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      dueDate: dueDate || null,
      teamSize: Number(teamSize || 1),
      resources: Array.isArray(resources) ? resources : [],
      status: status === 'draft' ? 'draft' : status === 'archived' ? 'archived' : 'active'
    });

    res.status(201).json({ success: true, message: 'Project created successfully', data: project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Error creating project' });
  }
});

// GET PROJECTS FOR SUBJECT
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const subject = await Subject.findById(subjectId).select('_id name code branchId semesterId');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (!canUserAccessSubject(req.user, subject)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view projects for this subject' });
    }

    const query = { subjectId };
    if (req.user.role === 'student') {
      query.status = 'active';
    } else if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code
      }
    });
  } catch (error) {
    console.error('Get subject projects error:', error);
    res.status(500).json({ success: false, message: 'Error fetching projects' });
  }
});

// GET ALL PROJECTS (STAFF)
router.get('/all', protect, authorize('admin', 'teacher', 'hod', 'coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', category, semesterId, subjectId } = req.query;
    const query = {};

    if (status !== 'all') query.status = status;
    if (category) query.category = category;
    if (semesterId && mongoose.Types.ObjectId.isValid(semesterId)) query.semesterId = semesterId;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) query.subjectId = subjectId;

    if (req.user.role === 'teacher') {
      const assigned = Array.isArray(req.user.assignedSubjects) ? req.user.assignedSubjects : [];
      const assignedIds = assigned.map((id) => String(id));
      if (assignedIds.length === 0) {
        return res.json({ success: true, data: [], total: 0, pages: 0, currentPage: Number(page) });
      }
      if (query.subjectId && !assignedIds.includes(String(query.subjectId))) {
        return res.status(403).json({ success: false, message: 'Not authorized for this subject' });
      }
      if (!query.subjectId) query.subjectId = { $in: assignedIds };
    }

    if (req.user.role === 'hod') {
      const allowedBranches = getHodBranchScope(req.user);
      if (allowedBranches.length === 0) {
        return res.json({ success: true, data: [], total: 0, pages: 0, currentPage: Number(page) });
      }
      query.branchId = { $in: allowedBranches };
    }

    if (req.user.role === 'coordinator') {
      const scope = getCoordinatorScope(req.user);
      if (!scope || !scope.branchId) {
        return res.json({ success: true, data: [], total: 0, pages: 0, currentPage: Number(page) });
      }
      query.branchId = scope.branchId;
      if (Array.isArray(scope.semesterIds) && scope.semesterIds.length > 0) {
        query.semesterId = { $in: scope.semesterIds };
      }
    }

    const projects = await Project.find(query)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ success: false, message: 'Error fetching projects' });
  }
});

// GET SINGLE PROJECT
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }

    const project = await Project.findById(id)
      .populate('subjectId', 'name code branchId semesterId')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!canUserAccessSubject(req.user, project.subjectId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this project' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project detail error:', error);
    res.status(500).json({ success: false, message: 'Error fetching project' });
  }
});

// UPDATE PROJECT
router.put('/:id', protect, authorize('admin', 'teacher', 'hod', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }

    let project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let subject = await Subject.findById(project.subjectId).select('_id branchId semesterId');

    const isAdmin = req.user.role === 'admin';
    const isOwner = String(project.createdBy) === String(req.user._id);
    const canManage = canUserManageSubject(req.user, subject);

    if (!isAdmin && !isOwner && !canManage) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    if (req.body.subjectId && String(req.body.subjectId) !== String(project.subjectId)) {
      if (!mongoose.Types.ObjectId.isValid(req.body.subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subject id' });
      }

      const nextSubject = await Subject.findById(req.body.subjectId).select('_id branchId semesterId');
      if (!nextSubject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      if (!canUserManageSubject(req.user, nextSubject)) {
        return res.status(403).json({ success: false, message: 'Not authorized for target subject' });
      }

      project.subjectId = nextSubject._id;
      project.branchId = nextSubject.branchId;
      project.semesterId = nextSubject.semesterId;
      subject = nextSubject;
    }

    project.title = req.body.title ?? project.title;
    project.description = req.body.description ?? project.description;
    project.category = req.body.category ?? project.category;
    project.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : project.dueDate;
    project.teamSize = req.body.teamSize !== undefined ? Number(req.body.teamSize) : project.teamSize;
    project.resources = Array.isArray(req.body.resources) ? req.body.resources : project.resources;
    if (req.body.status && ['draft', 'active', 'archived'].includes(req.body.status)) {
      project.status = req.body.status;
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber academicYear')
      .populate('createdBy', 'name email role');

    res.json({ success: true, message: 'Project updated successfully', data: updated });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Error updating project' });
  }
});

// DELETE PROJECT
router.delete('/:id', protect, authorize('admin', 'teacher', 'hod', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const subject = await Subject.findById(project.subjectId).select('_id branchId semesterId');

    const isAdmin = req.user.role === 'admin';
    const isOwner = String(project.createdBy) === String(req.user._id);
    const canManage = canUserManageSubject(req.user, subject);

    if (!isAdmin && !isOwner && !canManage) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndDelete(id);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Error deleting project' });
  }
});

module.exports = router;
