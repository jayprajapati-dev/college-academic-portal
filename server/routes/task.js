const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Links-based attachments only (Google Drive, Dropbox, etc.)

// Helper function to send notifications to task recipients
const notifyTaskRecipients = async (task, action = 'created') => {
  try {
    // Find all students in this subject
    const subject = await Subject.findById(task.subjectId);
    if (!subject || !subject.assignedStudents) return;

    const students = subject.assignedStudents || [];
    
    const notifications = students.map(studentId => ({
      userId: studentId,
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

// CREATE TASK (Admin, HOD, Teacher)
router.post('/create', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { title, description, category, subjectId, dueDate, attachments } = req.body;

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

    // Authorization check
    if (req.user.role === 'teacher') {
      // Teacher can only create tasks for their assigned subjects
      const isAssigned = req.user.assignedSubjects && req.user.assignedSubjects.includes(subjectId);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You can only create tasks for your assigned subjects'
        });
      }
    } else if (req.user.role === 'hod') {
      // HOD can only create for subjects in their branch
      const isInBranch = subject.branchId.equals(req.user.branch);
      if (!isInBranch) {
        return res.status(403).json({
          success: false,
          message: 'You can only create tasks for subjects in your branch'
        });
      }
    }

    // Process attachments (links only - validate URL format)
    const taskAttachments = attachments ? attachments.map(att => ({
      name: att.name || 'Attachment',
      url: att.url
    })) : [];

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
      status: 'active'
    });

    // Send notifications to students
    await notifyTaskRecipients(task, 'created');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
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
      const tasksWithStatus = tasks.map(task => {
        const recipient = task.recipients && task.recipients.find(r => r.studentId?.equals(req.user._id));
        return {
          ...task.toObject(),
          status: recipient?.status || 'pending'
        };
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
    const { page = 1, limit = 10, category, semesterId } = req.query;

    const query = {
      branchId: req.user.branch,
      status: 'active'
    };

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


router.get('/all', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, branchId, semesterId } = req.query;

    const query = { status: 'active' };

    if (category) query.category = category;
    if (branchId) query.branchId = branchId;
    if (semesterId) query.semesterId = semesterId;

    // For HOD, only show tasks from their branch
    if (req.user.role === 'hod') {
      query.branchId = req.user.branch;
    }

    // For teacher, only show their own tasks
    if (req.user.role === 'teacher') {
      query.createdBy = req.user._id;
    }

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

// UPDATE TASK
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, category, dueDate, attachments } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && !task.createdBy.equals(req.user._id)) {
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

    task.updatedAt = Date.now();
    await task.save();

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
    if (req.user.role !== 'admin' && !task.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    task.status = 'deleted';
    await task.save();

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
