const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { protect, authorize } = require('../middleware/auth');

// Links-based attachments only (Google Drive, Dropbox, etc.)

// Helper function to get eligible users based on audience
const getEligibleUserIds = async (targetAudience, targetBranch, createdByRole, createdById) => {
  try {
    let query = { status: 'active' };

    if (targetAudience === 'Everyone') {
      // All active users
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Students') {
      query.role = 'student';
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Teachers') {
      query.role = 'teacher';
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Staff') {
      query.role = { $in: ['admin', 'hod'] };
      const users = await User.find(query).select('_id');
      return users.map(u => u._id);
    } else if (targetAudience === 'Branch' && targetBranch) {
      // All users in a specific branch
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


// CREATE NOTICE
router.post('/create', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience, attachments, status } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Validate audience and permissions
    let targetBranch = null;
    if (targetAudience === 'Branch') {
      if (req.user.role !== 'hod') {
        return res.status(403).json({
          success: false,
          message: 'Only HODs can send branch-specific notices'
        });
      }
      targetBranch = req.user.branch;
    } else if (req.user.role === 'hod' && targetAudience === 'Everyone') {
      // HOD sending to everyone defaults to their branch
      targetBranch = req.user.branch;
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
      targetAudience,
      targetBranch,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      attachments: noticeAttachments,
      status: noticeStatus
    });

    let eligibleUserIds = [];
    if (noticeStatus === 'published') {
      // Get eligible users and create recipient records
      eligibleUserIds = await getEligibleUserIds(targetAudience, targetBranch, req.user.role, req.user._id);

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

// GET ADMIN NOTICES (For management dashboard)
router.get('/admin', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { createdBy: req.user._id };

    // If HOD, also show notices from other teachers in their branch
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

// UPDATE NOTICE (edit or publish draft)
router.put('/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience, attachments, status } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (!notice.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notice'
      });
    }

    let targetBranch = notice.targetBranch || null;
    if (targetAudience === 'Branch') {
      if (req.user.role !== 'hod') {
        return res.status(403).json({
          success: false,
          message: 'Only HODs can send branch-specific notices'
        });
      }
      targetBranch = req.user.branch;
    } else if (req.user.role === 'hod' && targetAudience === 'Everyone') {
      targetBranch = req.user.branch;
    }

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (priority) notice.priority = priority;
    if (targetAudience) notice.targetAudience = targetAudience;
    notice.targetBranch = targetBranch;
    if (attachments) {
      notice.attachments = attachments.map(att => ({
        name: att.name || 'Attachment',
        url: att.url
      }));
    }

    const nextStatus = status === 'published' ? 'published' : status === 'draft' ? 'draft' : notice.status;

    if (notice.status === 'draft' && nextStatus === 'published') {
      const eligibleUserIds = await getEligibleUserIds(notice.targetAudience, notice.targetBranch, req.user.role, req.user._id);
      notice.recipients = eligibleUserIds.map(userId => ({
        userId,
        notifiedAt: Date.now(),
        isRead: false
      }));
      await notifyNoticeRecipients(notice, eligibleUserIds);
    }

    notice.status = nextStatus;
    await notice.save();

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
router.delete('/:id', protect, authorize('admin', 'hod', 'teacher'), async (req, res) => {
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
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notice'
      });
    }

    // No files to delete - links only system
    notice.status = 'archived';
    await notice.save();

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
