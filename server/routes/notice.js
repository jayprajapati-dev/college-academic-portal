const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');

// Links-based attachments only (Google Drive, Dropbox, etc.)

// Helper function to get eligible users based on audience
const getEligibleUserIds = async (targetAudience, targetRoles, targetBranch, createdByRole, branchIds = [], semesterIds = []) => {
  try {
    let query = { status: 'active' };

    const roleList = Array.isArray(targetRoles) ? targetRoles.filter(Boolean) : [];
    const normalizedRoles = roleList.filter((role) => ['admin', 'hod', 'teacher', 'student', 'coordinator'].includes(role));
    const useRoleList = normalizedRoles.length > 0;

    if (useRoleList) {
      const orQueries = [];
      const branchScope = Array.isArray(branchIds) ? branchIds.filter(Boolean) : [];
      const semesterScope = Array.isArray(semesterIds) ? semesterIds.filter(Boolean) : [];

      if (normalizedRoles.includes('student')) {
        const studentQuery = { role: 'student' };
        if (branchScope.length) studentQuery.branch = { $in: branchScope };
        if (semesterScope.length) studentQuery.semester = { $in: semesterScope };
        orQueries.push(studentQuery);
      }

      if (normalizedRoles.includes('teacher')) {
        const teacherQuery = { role: 'teacher' };
        if (branchScope.length) {
          teacherQuery.$or = [
            { branch: { $in: branchScope } },
            { branches: { $in: branchScope } },
            { department: { $in: branchScope } }
          ];
        }
        orQueries.push(teacherQuery);
      }

      if (normalizedRoles.includes('hod')) {
        const hodQuery = { role: 'hod' };
        if (branchScope.length) {
          hodQuery.$or = [
            { branch: { $in: branchScope } },
            { branches: { $in: branchScope } },
            { department: { $in: branchScope } }
          ];
        }
        orQueries.push(hodQuery);
      }

      if (normalizedRoles.includes('coordinator')) {
        const coordinatorQuery = { role: 'coordinator' };
        if (branchScope.length) coordinatorQuery['coordinator.branch'] = { $in: branchScope };
        if (semesterScope.length) coordinatorQuery['coordinator.semesters'] = { $in: semesterScope };
        orQueries.push(coordinatorQuery);
      }

      if (normalizedRoles.includes('admin')) {
        orQueries.push({ role: 'admin' });
      }

      if (orQueries.length === 0) return [];

      const users = await User.find({ ...query, $or: orQueries }).select('_id');
      return users.map((u) => u._id);
    }

    if (targetAudience === 'Everyone') {
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    }

    if (targetAudience === 'Students') {
      query.role = 'student';
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Teachers') {
      query.role = 'teacher';
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Staff') {
      query.role = { $in: ['admin', 'hod', 'coordinator'] };
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Branch' && targetBranch) {
      query.branch = targetBranch;
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    }

    return [];
  } catch (error) {
    console.error('Error getting eligible users:', error);
    return [];
  }
};

// Helper function to send notifications
const notifyNoticeRecipients = async (notice, recipientIds) => {
  try {
    const notifications = recipientIds.map(userId => ({
      userId,
      type: 'Notice',
      title: notice.title,
      message: notice.content.substring(0, 100),
      relatedId: notice._id,
      relatedType: 'Notice',
      isNotice: true,
      actionUrl: '/notices'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error sending notice notifications:', error);
  }
};

const logActivity = async (payload) => {
  try {
    await ActivityLog.create(payload);
  } catch (error) {
    console.error('Notice activity log error:', error);
  }
};


// CREATE NOTICE
router.post('/create', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience, targetRoles, attachments, status } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Validate audience and permissions
    let targetBranch = null;
    let branchIds = [];
    let semesterIds = [];
    const normalizedRoles = Array.isArray(targetRoles) ? targetRoles.filter((role) => ['admin', 'hod', 'teacher', 'student', 'coordinator'].includes(role)) : [];
    const shouldSendAll = targetAudience === 'Everyone' || normalizedRoles.length >= 3;

    if (!shouldSendAll && normalizedRoles.length === 0 && targetAudience === 'Selected') {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one recipient group'
      });
    }

    if (req.user.role === 'hod') {
      branchIds = [req.user.branch, ...(req.user.branches || []), req.user.department].filter(Boolean);
    }

    if (req.user.role === 'teacher') {
      const assigned = Array.isArray(req.user.assignedSubjects) ? req.user.assignedSubjects : [];
      if (assigned.length > 0) {
        const subjectDocs = await Subject.find({ _id: { $in: assigned } }).select('branchId semesterId');
        branchIds = Array.from(new Set(subjectDocs.map((s) => s.branchId).filter(Boolean)));
        semesterIds = Array.from(new Set(subjectDocs.map((s) => s.semesterId).filter(Boolean)));
      }
    }
    if (req.user.role === 'coordinator') {
      branchIds = [req.user.coordinator?.branch].filter(Boolean);
      semesterIds = Array.isArray(req.user.coordinator?.semesters) ? req.user.coordinator.semesters : [];
    }
    if (targetAudience === 'Branch') {
      if (req.user.role !== 'hod' && req.user.role !== 'coordinator') {
        return res.status(403).json({
          success: false,
          message: 'Only HODs or coordinators can send branch-specific notices'
        });
      }
      targetBranch = req.user.role === 'coordinator' ? req.user.coordinator?.branch : req.user.branch;
    } else if ((req.user.role === 'hod' || req.user.role === 'coordinator') && (targetAudience === 'Everyone' || shouldSendAll)) {
      // HOD/Coordinator sending to everyone defaults to their branch
      targetBranch = req.user.role === 'coordinator' ? req.user.coordinator?.branch : req.user.branch;
    }

    // Process attachments (links only - validate URL format)
    const noticeAttachments = attachments ? attachments.map(att => ({
      name: att.name || 'Attachment',
      url: att.url
    })) : [];

    const noticeStatus = status === 'draft' ? 'draft' : 'published';

    // Create notice
    const notice = await Notice.create({
      title,
      content,
      priority: priority || 'Normal',
      targetAudience: shouldSendAll ? 'Everyone' : targetAudience || 'Selected',
      targetRoles: normalizedRoles,
      targetBranch,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      attachments: noticeAttachments,
      status: noticeStatus
    });

    let eligibleUserIds = [];
    if (noticeStatus === 'published') {
      // Get eligible users and create recipient records
      eligibleUserIds = await getEligibleUserIds(targetAudience, normalizedRoles, targetBranch, req.user.role, branchIds, semesterIds);

      if (eligibleUserIds.length > 0) {
        notice.recipients = eligibleUserIds.map(userId => ({
          userId,
          notifiedAt: Date.now(),
          isRead: false
        }));
        await notice.save();

        // Send notifications
        await notifyNoticeRecipients(notice, eligibleUserIds);
      }
    }

    res.status(201).json({
      success: true,
      message: noticeStatus === 'draft' ? 'Notice saved as draft' : 'Notice published successfully',
      data: {
        ...notice.toObject(),
        recipientCount: eligibleUserIds.length
      }
    });

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: noticeStatus === 'draft' ? 'notice_draft_saved' : 'notice_published',
      targetType: 'Notice',
      targetId: notice._id,
      targetLabel: notice.title,
      scope: {
        branchId: notice.targetBranch || null,
        semesterIds
      }
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating notice'
    });
  }
});


// GET NOTICES FOR BOARD (All published notices user can see)
router.get('/board', protect, async (req, res) => {
  try {
    const { page = 1, limit = 15, priority, sortBy = 'newest' } = req.query;

    const query = {
      status: 'published',
      'recipients.userId': req.user._id
    };

    if (priority) {
      query.priority = priority;
    }

    // Determine sort order
    let sortObj = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sortBy === 'priority') {
      sortObj = { priority: -1, createdAt: -1 };
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortObj);

    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notices.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: notices
    });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notices'
    });
  }
});

// GET ADMIN/HOD NOTICES (For management dashboard)
router.get('/admin', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = {};

    // HOD sees notices from their branch users only
    if (req.user.role === 'hod') {
      const usersInBranch = await User.find({ branch: req.user.branch }).select('_id');
      const userIds = usersInBranch.map(u => u._id);
      query = { createdBy: { $in: userIds } };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notices.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: notices
    });
  } catch (error) {
    console.error('Get admin notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notices'
    });
  }
});

// GET TEACHER NOTICES (Own notices only)
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { createdBy: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notices.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: notices
    });
  } catch (error) {
    console.error('Get teacher notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notices'
    });
  }
});

// GET COORDINATOR NOTICES (Own notices only)
router.get('/coordinator', protect, authorize('coordinator'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { createdBy: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notices.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: notices
    });
  } catch (error) {
    console.error('Get coordinator notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notices'
    });
  }
});

// UPDATE NOTICE (edit or publish draft)
router.put('/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience, targetRoles, attachments, status } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (!notice.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      if (req.user.role !== 'hod') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this notice'
        });
      }

      const creator = await User.findById(notice.createdBy).select('branch');
      const sameBranch = creator?.branch?.equals(req.user.branch) || notice.targetBranch?.equals(req.user.branch);
      if (!sameBranch) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this notice'
        });
      }
    }

    let targetBranch = notice.targetBranch || null;
    let branchIds = [];
    let semesterIds = [];
    const normalizedRoles = Array.isArray(targetRoles) ? targetRoles.filter((role) => ['admin', 'hod', 'teacher', 'student', 'coordinator'].includes(role)) : [];
    const shouldSendAll = targetAudience === 'Everyone' || normalizedRoles.length >= 3;

    if (req.user.role === 'hod') {
      branchIds = [req.user.branch, ...(req.user.branches || []), req.user.department].filter(Boolean);
    }

    if (req.user.role === 'teacher') {
      const assigned = Array.isArray(req.user.assignedSubjects) ? req.user.assignedSubjects : [];
      if (assigned.length > 0) {
        const subjectDocs = await Subject.find({ _id: { $in: assigned } }).select('branchId semesterId');
        branchIds = Array.from(new Set(subjectDocs.map((s) => s.branchId).filter(Boolean)));
        semesterIds = Array.from(new Set(subjectDocs.map((s) => s.semesterId).filter(Boolean)));
      }
    }
    if (req.user.role === 'coordinator') {
      branchIds = [req.user.coordinator?.branch].filter(Boolean);
      semesterIds = Array.isArray(req.user.coordinator?.semesters) ? req.user.coordinator.semesters : [];
    }
    if (targetAudience === 'Branch') {
      if (req.user.role !== 'hod' && req.user.role !== 'coordinator') {
        return res.status(403).json({
          success: false,
          message: 'Only HODs or coordinators can send branch-specific notices'
        });
      }
      targetBranch = req.user.role === 'coordinator' ? req.user.coordinator?.branch : req.user.branch;
    } else if ((req.user.role === 'hod' || req.user.role === 'coordinator') && (targetAudience === 'Everyone' || shouldSendAll)) {
      targetBranch = req.user.role === 'coordinator' ? req.user.coordinator?.branch : req.user.branch;
    }

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (priority) notice.priority = priority;
    if (targetAudience || normalizedRoles.length > 0) {
      notice.targetAudience = shouldSendAll ? 'Everyone' : targetAudience || 'Selected';
    }
    if (normalizedRoles.length > 0) {
      notice.targetRoles = normalizedRoles;
    }
    notice.targetBranch = targetBranch;
    if (attachments) {
      notice.attachments = attachments.map(att => ({
        name: att.name || 'Attachment',
        url: att.url
      }));
    }

    const nextStatus = status === 'published' ? 'published' : status === 'draft' ? 'draft' : notice.status;
    const publishedNow = notice.status === 'draft' && nextStatus === 'published';

    if (notice.status === 'draft' && nextStatus === 'published') {
      const rolesForSend = Array.isArray(notice.targetRoles) ? notice.targetRoles : [];
      const eligibleUserIds = await getEligibleUserIds(notice.targetAudience, rolesForSend, notice.targetBranch, req.user.role, branchIds, semesterIds);
      notice.recipients = eligibleUserIds.map(userId => ({
        userId,
        notifiedAt: Date.now(),
        isRead: false
      }));
      await notifyNoticeRecipients(notice, eligibleUserIds);
    }

    notice.status = nextStatus;
    await notice.save();

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: publishedNow ? 'notice_published' : 'notice_updated',
      targetType: 'Notice',
      targetId: notice._id,
      targetLabel: notice.title,
      scope: {
        branchId: notice.targetBranch || null,
        semesterIds
      }
    });

    res.status(200).json({
      success: true,
      message: nextStatus === 'published' ? 'Notice published successfully' : 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notice'
    });
  }
});


// GET SINGLE NOTICE
router.get('/:id', protect, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('targetBranch', 'name code');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Check if user can view this notice
    const canView = notice.recipients.some(r => r.userId?.equals(req.user._id)) ||
                    notice.createdBy._id.equals(req.user._id) ||
                    req.user.role === 'admin';

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this notice'
      });
    }

    // Mark as read if user is recipient
    const recipient = notice.recipients.find(r => r.userId?.equals(req.user._id));
    if (recipient && !recipient.isRead) {
      recipient.isRead = true;
      recipient.readAt = Date.now();
      await notice.save();
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notice'
    });
  }
});

// DELETE NOTICE
router.delete('/:id', protect, authorize('admin', 'hod', 'teacher', 'coordinator'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Authorization check
    if (!notice.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      if (req.user.role !== 'hod') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this notice'
        });
      }

      const creator = await User.findById(notice.createdBy).select('branch');
      const sameBranch = creator?.branch?.equals(req.user.branch) || notice.targetBranch?.equals(req.user.branch);
      if (!sameBranch) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this notice'
        });
      }
    }

    // No files to delete - links only system
    notice.status = 'archived';
    await notice.save();

    await logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'notice_deleted',
      targetType: 'Notice',
      targetId: notice._id,
      targetLabel: notice.title,
      scope: {
        branchId: notice.targetBranch || null,
        semesterIds: []
      }
    });

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notice'
    });
  }
});


module.exports = router;
