require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics');
    const Timetable = require('./models/Timetable');
    
    // Search for all labs with IT6
    const entries = await Timetable.find({ 'subject.code': /IT6/, type: 'Lab' }).lean();
    
    if (entries.length > 0) {
      console.log(`Found ${entries.length} IT6 lab entries:\n`);
      entries.forEach((entry, idx) => {
        console.log(`${idx + 1}. ${entry.subject.code} - ${entry.dayOfWeek}`);
        console.log(`   Time: ${entry.startTime} to ${entry.endTime}`);
        console.log(`   Slot: ${entry.slot}, SlotSpan: ${entry.slotSpan}`);
        console.log(`   Teacher: ${entry.teacher.name}\n`);
      });
    } else {
      console.log('No IT6 lab entries found');
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
