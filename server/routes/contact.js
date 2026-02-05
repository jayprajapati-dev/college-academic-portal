const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Submit a contact message (requires authentication)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and message are required' 
      });
    }

    const contactMessage = await ContactMessage.create({
      userId: req.user._id,
      subject,
      message
    });

    // Populate user details
    await contactMessage.populate('userId', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Message submitted successfully',
      data: contactMessage
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit message' 
    });
  }
});

// @route   GET /api/contact/my-messages
// @desc    Get current user's contact messages
// @access  Private
router.get('/my-messages', protect, async (req, res) => {
  try {
    const messages = await ContactMessage.find({ userId: req.user._id })
      .populate('userId', 'name email role')
      .populate('reply.repliedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages' 
    });
  }
});

// @route   GET /api/contact/all
// @desc    Get all contact messages (admin only)
// @access  Private/Admin
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const { status } = req.query;
    const query = status ? { status } : {};

    const messages = await ContactMessage.find(query)
      .populate('userId', 'name email role')
      .populate('reply.repliedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages' 
    });
  }
});

// @route   POST /api/contact/:id/reply
// @desc    Reply to a contact message (admin only)
// @access  Private/Admin
router.post('/:id/reply', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reply message is required' 
      });
    }

    const contactMessage = await ContactMessage.findById(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }

    contactMessage.status = 'replied';
    contactMessage.reply = {
      message: replyMessage,
      repliedBy: req.user._id,
      repliedAt: new Date()
    };

    await contactMessage.save();

    // Populate for response
    await contactMessage.populate([
      { path: 'userId', select: 'name email role' },
      { path: 'reply.repliedBy', select: 'name email role' }
    ]);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: contactMessage
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reply' 
    });
  }
});

// @route   GET /api/contact/stats
// @desc    Get contact message statistics (admin only)
// @access  Private/Admin
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const [total, pending, replied] = await Promise.all([
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ status: 'replied' })
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        replied
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics' 
    });
  }
});

module.exports = router;
