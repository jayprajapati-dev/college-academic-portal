// server/controllers/timetableController.js

const Timetable = require('../models/Timetable');
const { filterDataByRole } = require('../middleware/roleAccess');

// GET timetable (role-based filtering)
exports.getTimetable = async (req, res) => {
  try {
    const query = filterDataByRole(req);
    const timetables = await Timetable.find(query).sort({ dayOfWeek: 1, slot: 1 });
    res.json({ success: true, data: timetables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create timetable (Admin/HOD/Coordinator only)
exports.createTimetable = async (req, res) => {
  if (!['admin', 'hod', 'coordinator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const data = req.body;
    const timetable = await Timetable.create(data);
    res.status(201).json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE timetable (soft delete, Admin/HOD/Coordinator only)
exports.deleteTimetable = async (req, res) => {
  if (!['admin', 'hod', 'coordinator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Not found' });
    timetable.status = 'archived';
    await timetable.save();
    res.json({ success: true, message: 'Timetable archived' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
