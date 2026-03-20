const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

// Create Room
router.post('/', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { roomNo, type } = req.body;
    if (!roomNo || !type) return res.status(400).json({ success: false, message: 'roomNo and type required' });
    // Check for duplicate roomNo (active only)
    const existingRoom = await Room.findOne({ roomNo: roomNo.trim(), isActive: true });
    if (existingRoom) {
      return res.status(409).json({ success: false, message: 'Room already exists and is active.' });
    }
    const room = await Room.create({ roomNo: roomNo.trim(), type });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all active rooms
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true });
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Room
router.put('/:id', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { roomNo, type, isActive } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { roomNo, type, isActive }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Soft Delete Room
router.delete('/:id', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room soft deleted (isActive=false)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
