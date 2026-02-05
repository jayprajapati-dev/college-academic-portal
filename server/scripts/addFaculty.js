const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('../models/Subject');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics';

const addFaculty = async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    const facultyMap = {
      'CS101': { name: 'Prof. Arjun Mehta', email: 'arjun.mehta@college.edu', office: 'CSE-210', phone: '+91-90000-20000' },
      'CS102': { name: 'Dr. Vikram Singh', email: 'vikram.singh@college.edu', office: 'CSE-215', phone: '+91-90000-20001' },
      'IT101': { name: 'Prof. Priya Sharma', email: 'priya.sharma@college.edu', office: 'IT-105', phone: '+91-90000-20002' },
      'IT102': { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@college.edu', office: 'IT-110', phone: '+91-90000-20003' },
      'IT201': { name: 'Prof. Anjali Desai', email: 'anjali.desai@college.edu', office: 'IT-115', phone: '+91-90000-20004' },
      'IT202': { name: 'Dr. Suresh Patel', email: 'suresh.patel@college.edu', office: 'IT-120', phone: '+91-90000-20005' }
    };

    for (const [code, faculty] of Object.entries(facultyMap)) {
      const result = await Subject.updateOne(
        { code },
        { $set: { faculty } }
      );
      console.log(`Updated ${code}:`, result.modifiedCount > 0 ? 'SUCCESS' : 'NOT FOUND');
    }

    console.log('Faculty data added to all subjects');
  } finally {
    await mongoose.disconnect();
  }
};

addFaculty().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
