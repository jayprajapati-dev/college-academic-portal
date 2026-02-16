const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');

// Links-based attachments only (Google Drive, Dropbox, etc.)

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

const canCoordinatorManageSubject = (user, subject) => {
  if (user?.role !== 'coordinator') return false;
  const scope = getCoordinatorScope(user);
  if (!scope || !scope.branchId) return false;
  const subjectBranchId = subject?.branchId?._id || subject?.branchId;
  const subjectSemesterId = subject?.semesterId?._id || subject?.semesterId;
  if (!subjectBranchId || !subjectSemesterId) return false;

  const semesterSet = new Set(scope.semesterIds.map((id) => String(id)));
  return String(scope.branchId) === String(subjectBranchId)
    && semesterSet.has(String(subjectSemesterId));
};

const getSubjectStudents = async (subject) => {
  const branchId = subject?.branchId?._id || subject?.branchId;
  const semesterId = subject?.semesterId?._id || subject?.semesterId;
  if (!branchId || !semesterId) return [];
  return User.find({
    role: 'student',
    status: 'active',
    branch: branchId,
    semester: semesterId
  }).select('_id name email enrollmentNumber');
};

const getSubjectTeacherIds = async (subjectId) => {
  const teachers = await User.find({
    role: { $in: ['teacher', 'hod'] },
    status: 'active',
    assignedSubjects: subjectId
  }).select('_id');
  return teachers.map((t) => t._id);
};

const buildRecipientsFromSubject = async (subject) => {
  const students = await getSubjectStudents(subject);
  return students.map((student) => ({
    studentId: student._id,
    status: 'pending'
  }));
};

const notifyTaskRecipients = async (task) => {
  try {
    const subject = await Subject.findById(task.subjectId).select('name');
    if (!subject) return;

    const students = await getSubjectStudents(task);
    const notifications = students.map((student) => ({
      userId: student._id,
      type: task.category,
      title: `New ${task.category} in ${subject.name}`,
      message: task.title,
      relatedId: task._id,
      relatedType: 'Task',
      subjectId: task.subjectId,
      isNotice: false,
      actionUrl: `/subjects/${task.subjectId}/tasks`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error sending task notifications:', error);
  }
};

const notifyTaskTeachers = async (task, title, message) => {
  try {
    const teacherIds = await getSubjectTeacherIds(task.subjectId);
    const uniqueIds = new Set(teacherIds.map((id) => String(id)));
    if (task.createdBy) {
      uniqueIds.add(String(task.createdBy));
    }

    const notifications = Array.from(uniqueIds).map((teacherId) => ({
      userId: teacherId,
      type: task.category,
      title,
      message,
      relatedId: task._id,
      relatedType: 'Task',
      subjectId: task.subjectId,
      isNotice: false,
      actionUrl: `/teacher/tasks/${task._id}/submissions`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error sending teacher task notifications:', error);
  }
};

const logActivity = async (payload) => {
  try {
    await ActivityLog.create(payload);
  } catch (error) {
    console.error('Task activity log error:', error);
  }
};

// CREATE TASK (Teacher or HOD assigned to subject)
router.post('/create', protect, authorize('hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { title, description, category, subjectId, dueDate, attachments, status } = req.body;

    // Validation
    if (!title || !description || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and subject are required'
      });
    }

    // Get subject details
    const subject = await Subject.findById(subjectId).populate('branchId semesterId');
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Authorization check: only subject teachers can create
    if (!hasAssignedSubject(req.user, subjectId) && !canCoordinatorManageSubject(req.user, subject)) {
      return res.status(403).json({
        success: false,
        message: 'You can only create tasks for your assigned subjects or coordinator scope'
      });
    }

    // Process attachments (links only - validate URL format)
    const taskAttachments = attachments ? attachments.map(att => ({
      name: att.name || 'Attachment',
      url: att.url
    })) : [];

    const taskStatus = status === 'draft' ? 'draft' : 'active';

    const recipients = taskStatus === 'active' ? await buildRecipientsFromSubject(subject) : [];

    // Create task
    const task = await Task.create({
      title,
      description,
      category: category || 'Task',
      subjectId,
      branchId: subject.branchId,
      semesterId: subject.semesterId,
      dueDate: dueDate || null,
      attachments: taskAttachments,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      status: taskStatus,
      recipients
    });

    if (taskStatus === 'active') {
      // Send notifications to students
      await notifyTaskRecipients(task, 'created');
    }

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: taskStatus === 'draft' ? 'task_draft_saved' : 'task_created',
      targetType: 'Task',
      targetId: task._id,
      targetLabel: task.title,
      scope: {
        branchId: task.branchId || null,
        semesterIds: task.semesterId ? [task.semesterId] : []
      }
    });

    res.status(201).json({
      success: true,
      message: taskStatus === 'draft' ? 'Task saved as draft' : 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
});

// GET TASKS FOR A SUBJECT (Student View)
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { page = 1, limit = 10, category, status } = req.query;

    const query = {
      subjectId,
      status: 'active'
    };

    if (category) {
      query.category = category;
    }

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email role')
      .populate('subjectId', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);
    const subject = await Subject.findById(subjectId).select('name code');

    // If student, get their status on each task
    if (req.user.role === 'student') {
      const normalizedStatus = status ? String(status).toLowerCase() : '';
      const tasksWithStatus = tasks.map(task => {
        const recipient = task.recipients && task.recipients.find(r => r.studentId?.equals(req.user._id));
        return {
          ...task.toObject(),
          status: recipient?.status || 'pending'
        };
      }).filter((task) => {
        if (!normalizedStatus) return true;
        return String(task.status).toLowerCase() === normalizedStatus;
      });
      return res.status(200).json({
        success: true,
        count: tasksWithStatus.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        subject,
        data: tasksWithStatus
      });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      subject,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});

// GET TASKS FOR HOD (HOD Dashboard)
router.get('/hod', protect, authorize('hod'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, semesterId, status } = req.query;

    const query = {
      branchId: req.user.branch
    };

    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'draft'] };
    }

    if (category) query.category = category;
    if (semesterId) query.semesterId = semesterId;

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email role')
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: tasks
    });
  } catch (error) {
    console.error('Get HOD tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});


router.get('/all', protect, authorize('hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, branchId, semesterId, status } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'draft'] };
    }

    if (category) query.category = category;
    if (branchId) query.branchId = branchId;
    if (semesterId) query.semesterId = semesterId;

    // Only show tasks created by the current subject teacher
    query.createdBy = req.user._id;

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email role')
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: tasks
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});

// GET SINGLE TASK
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('subjectId', 'name code description')
      .populate('branchId', 'name code')
      .populate('semesterId', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (req.user.role === 'student') {
      const recipient = task.recipients?.find((r) => r.studentId?.equals(req.user._id));
      return res.status(200).json({
        success: true,
        data: {
          ...task.toObject(),
          studentStatus: recipient?.status || 'pending',
          submittedAt: recipient?.submittedAt || null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
});

// GET TASK SUBMISSIONS (Teacher/HOD)
router.get('/:id/submissions', protect, authorize('teacher', 'hod', 'coordinator'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('subjectId', 'name code')
      .populate('branchId', 'name code')
      .populate('semesterId', 'semesterNumber');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const isOwner = task.createdBy.equals(req.user._id);
    const isSubjectTeacher = hasAssignedSubject(req.user, task.subjectId);
    if (!isOwner && !isSubjectTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions'
      });
    }

    const branchId = task.branchId?._id || task.branchId;
    const semesterId = task.semesterId?._id || task.semesterId;
    const students = await User.find({
      role: 'student',
      status: 'active',
      branch: branchId,
      semester: semesterId
    }).select('_id name email enrollmentNumber');

    const recipientMap = new Map(
      (task.recipients || []).map((recipient) => [String(recipient.studentId), recipient])
    );

    const submissions = students.map((student) => {
      const recipient = recipientMap.get(String(student._id));
      return {
        student,
        status: recipient?.status || 'pending',
        submittedAt: recipient?.submittedAt || null
      };
    });

    const counts = submissions.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        task,
        submissions,
        counts
      }
    });
  } catch (error) {
    console.error('Get task submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
});

// STUDENT SUBMIT TASK
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || task.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Active task not found'
      });
    }

    const branchId = task.branchId?._id || task.branchId;
    const semesterId = task.semesterId?._id || task.semesterId;
    const isEligible = String(req.user.branch) === String(branchId)
      && String(req.user.semester) === String(semesterId);
    if (!isEligible) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this task'
      });
    }

    const existing = task.recipients?.find((recipient) => recipient.studentId?.equals(req.user._id));
    if (existing) {
      existing.status = 'submitted';
      existing.submittedAt = Date.now();
    } else {
      task.recipients = [...(task.recipients || []), {
        studentId: req.user._id,
        status: 'submitted',
        submittedAt: Date.now()
      }];
    }

    await task.save();

    await notifyTaskTeachers(
      task,
      'New submission received',
      `${req.user.name} submitted ${task.title}`
    );

    res.status(200).json({
      success: true,
      message: 'Submission recorded'
    });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting task'
    });
  }
});

// UPDATE STUDENT STATUS (Teacher/HOD)
router.put('/:taskId/recipients/:studentId/status', protect, authorize('teacher', 'hod', 'coordinator'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'in-progress', 'submitted', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const isOwner = task.createdBy.equals(req.user._id);
    const isSubjectTeacher = hasAssignedSubject(req.user, task.subjectId);
    if (!isOwner && !isSubjectTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update submissions'
      });
    }

    const recipient = (task.recipients || []).find((r) => String(r.studentId) === String(req.params.studentId));
    if (recipient) {
      recipient.status = status;
    } else {
      task.recipients = [...(task.recipients || []), {
        studentId: req.params.studentId,
        status
      }];
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Submission status updated'
    });
  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating submission'
    });
  }
});

// UPDATE TASK
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, category, dueDate, attachments, status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot manage tasks'
      });
    }

    const isOwner = task.createdBy.equals(req.user._id);
    const isSubjectTeacher = hasAssignedSubject(req.user, task.subjectId);
    if (!isOwner && !isSubjectTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (category) task.category = category;
    if (dueDate) task.dueDate = dueDate;

    // Links-based attachments only
    if (attachments && Array.isArray(attachments)) {
      task.attachments = attachments.map(att => ({
        name: att.name || 'Attachment',
        url: att.url
      }));
    }

    const nextStatus = status === 'active' ? 'active' : status === 'draft' ? 'draft' : task.status;
    const publishedNow = task.status === 'draft' && nextStatus === 'active';

    if (task.status === 'draft' && nextStatus === 'active') {
      if (!task.recipients || task.recipients.length === 0) {
        task.recipients = await buildRecipientsFromSubject(task);
      }
      await notifyTaskRecipients(task);
    }

    task.status = nextStatus;

    task.updatedAt = Date.now();
    await task.save();

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: publishedNow ? 'task_published' : 'task_updated',
      targetType: 'Task',
      targetId: task._id,
      targetLabel: task.title,
      scope: {
        branchId: task.branchId || null,
        semesterIds: task.semesterId ? [task.semesterId] : []
      }
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
});

// DELETE TASK
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot manage tasks'
      });
    }

    const isOwner = task.createdBy.equals(req.user._id);
    const isSubjectTeacher = hasAssignedSubject(req.user, task.subjectId);
    if (!isOwner && !isSubjectTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    task.status = 'deleted';
    await task.save();

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'task_deleted',
      targetType: 'Task',
      targetId: task._id,
      targetLabel: task.title,
      scope: {
        branchId: task.branchId || null,
        semesterIds: task.semesterId ? [task.semesterId] : []
      }
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
});

module.exports = router;
