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
      .select('dayOfWeek slot slotSpan startTime endTime subject')
      .sort({ dayOfWeek: 1, slot: 1 })
      .populate('subject', 'code')
      .lean();
    
    console.log('\n=== IT SEMESTER 6 - LAB ENTRIES ===\n');
    console.log(`Total Labs: ${labs.length}\n`);
    
    labs.forEach((lab, idx) => {
      console.log(`${idx + 1}. ${lab.subject.code}`);
      console.log(`   Day: ${lab.dayOfWeek}`);
      console.log(`   Time: ${lab.startTime} to ${lab.endTime}`);
      console.log(`   Slot: ${lab.slot}, SlotSpan: ${lab.slotSpan}`);
      console.log('');
    });
    
    const twoHourCount = labs.filter(l => Number(l.slotSpan) > 1).length;
    console.log(`\n✅ Labs with slotSpan > 1: ${twoHourCount}`);
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
