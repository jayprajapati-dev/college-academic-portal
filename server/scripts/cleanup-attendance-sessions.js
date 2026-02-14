const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

const OLD_SESSIONS = ['Regular', 'Morning', 'Evening', 'Lab'];

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics';

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const result = await Attendance.deleteMany({ session: { $in: OLD_SESSIONS } });
    console.log(`Deleted ${result.deletedCount} attendance sessions (${OLD_SESSIONS.join(', ')})`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
