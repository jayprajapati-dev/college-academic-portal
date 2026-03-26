
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics');
    const Timetable = require('./models/Timetable');
    const Branch = require('./models/Branch');
    const Semester = require('./models/Semester');
    
    const b = await Branch.findOne({ code: 'IT' });
    const s = await Semester.findOne({ semesterNumber: 6 });
    
    if (!b || !s) {
      console.log('Branch/Semester not found');
      await mongoose.disconnect();
      return;
    }
    
    const labs = await Timetable.find({
      branchId: b._id,
      semesterId: s._id,
      lectureType: 'Lab'
    })
      .select('dayOfWeek slot slotSpan startTime endTime subject type')
      .sort({ dayOfWeek: 1, slot: 1 })
      .populate('subject', 'code name')
      .lean();
    
    console.log('\n=== IT SEM 6 - ALL LAB ENTRIES ===\n');
    labs.forEach((lab, idx) => {
      console.log(`${idx + 1}. ${lab.subject?.code || 'Unknown'}`);
      console.log(`   Start: ${lab.startTime} | End: ${lab.endTime}`);
      console.log(`   Slot: ${lab.slot} | SlotSpan: ${lab.slotSpan}`);
      console.log(`   Day: ${lab.dayOfWeek}\n`);
    });
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
