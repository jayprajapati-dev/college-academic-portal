const mongoose = require('mongoose');
require('dotenv').config();

const Semester = require('../models/Semester');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics';

const seed = async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Find ALL subjects in the database
    const allSubjects = await Subject.find();
    
    if (allSubjects.length === 0) {
      console.log('No subjects found in database');
      return;
    }

    console.log(`Found ${allSubjects.length} subjects to update`);

    // Update all existing subjects with proper data
    for (const subj of allSubjects) {
      const materials = [
        {
          title: `${subj.name} - Unit 1 Notes`,
          fileName: `${subj.code}_Unit1.pdf`,
          fileType: '.pdf',
          fileSize: 524288,
          filePath: `/uploads/materials/${subj.code}_Unit1.pdf`,
          downloadCount: 12,
          uploadedAt: new Date('2025-08-01')
        },
        {
          title: `${subj.name} - Unit 2 Notes`,
          fileName: `${subj.code}_Unit2.pdf`,
          fileType: '.pdf',
          fileSize: 612352,
          filePath: `/uploads/materials/${subj.code}_Unit2.pdf`,
          downloadCount: 9,
          uploadedAt: new Date('2025-08-10')
        },
        {
          title: `${subj.name} - Lab Assignment`,
          fileName: `${subj.code}_Assignment.docx`,
          fileType: '.docx',
          fileSize: 132096,
          filePath: `/uploads/materials/${subj.code}_Assignment.docx`,
          downloadCount: 7,
          uploadedAt: new Date('2025-08-15')
        },
        {
          title: `${subj.name} - Previous Year Papers`,
          fileName: `${subj.code}_PYQ_2024.pdf`,
          fileType: '.pdf',
          fileSize: 286720,
          filePath: `/uploads/materials/${subj.code}_PYQ_2024.pdf`,
          downloadCount: 15,
          uploadedAt: new Date('2025-09-01')
        }
      ];

      subj.credits = subj.credits || 3;
      subj.type = subj.type || 'theory';
      subj.description = subj.description || `Comprehensive study of ${subj.name} covering fundamental concepts and practical applications.`;
      subj.syllabus = subj.syllabus || `Advanced topics in ${subj.name} including theoretical foundations and real-world applications.`;
      subj.faculty = subj.faculty || {
        name: 'Prof. Arjun Mehta',
        email: 'arjun.mehta@college.edu',
        office: 'CSE-210',
        phone: '+91-90000-20000'
      };
      subj.marks = {
        theory: { internal: 30, external: 70, total: 100 },
        practical: { internal: 20, external: 30, total: 50 },
        totalMarks: 150,
        passingMarks: 60
      };
      subj.materials = materials;
      
      await subj.save();
      console.log('Updated subject:', subj._id.toString(), subj.code, subj.name);
    }

    console.log('All subjects updated successfully');
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
