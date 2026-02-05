const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('../models/Subject');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics';

const checkSubject = async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    const targetId = '698255ff9456cfc19bc566af';
    const subject = await Subject.findById(targetId); // Get all fields
    
    if (subject) {
      console.log('Found subject:', JSON.stringify(subject.toObject(), null, 2));
      console.log('\nFaculty data:', subject.faculty);
    } else {
      console.log('Subject not found with ID:', targetId);
      
      // List all subjects
      const allSubjects = await Subject.find().select('_id code name branchId semesterId');
      console.log('\nAll subjects in database:');
      allSubjects.forEach(s => {
        console.log(`- ID: ${s._id}, Code: ${s.code}, Name: ${s.name}`);
      });
    }
  } finally {
    await mongoose.disconnect();
  }
};

checkSubject().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
