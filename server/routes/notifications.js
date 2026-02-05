const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Get all notifications for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return mock notifications based on user role
    // In production, fetch from database
    let notifications = [];

    if (user.role === 'student') {
      notifications = [
        {
          id: '1',
          title: 'New Assignment Posted',
          message: 'Data Structures assignment has been posted by your instructor',
          time: 'Just now',
          link: '/student/dashboard',
          type: 'assignment'
        },
        {
          id: '2',
          title: 'Study Material Available',
          message: 'Lecture notes for Chapter 5 are now available',
          time: '2 hours ago',
          link: '/student/materials',
          type: 'material'
        },
        {
          id: '3',
          title: 'Class Notice',
          message: 'Tomorrow\'s class is rescheduled to 2 PM',
          time: '5 hours ago',
          link: '/student/dashboard',
          type: 'notice'
        }
      ];
    } else if (user.role === 'teacher') {
      notifications = [
        {
          id: '1',
          title: 'New Student Submission',
          message: '5 students submitted their assignment',
          time: 'Just now',
          link: '/teacher/dashboard',
          type: 'submission'
        }
      ];
    } else if (user.role === 'hod') {
      notifications = [
        {
          id: '1',
          title: 'Department Notice',
          message: 'New academic policies updated',
          time: 'Just now',
          link: '/hod/dashboard',
          type: 'notice'
        }
      ];
    } else if (user.role === 'admin') {
      notifications = [
        {
          id: '1',
          title: 'System Update',
          message: 'Database backup completed successfully',
          time: 'Just now',
          link: '/admin/dashboard',
          type: 'system'
        }
      ];
    }

    return res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Mark notification as read (optional enhancement)
router.put('/:notificationId/read', protect, async (req, res) => {
  try {
    // In production, update notification read status in database
    return res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// Delete notification (optional enhancement)
router.delete('/:notificationId', protect, async (req, res) => {
  try {
    // In production, delete notification from database
    return res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

module.exports = router;
