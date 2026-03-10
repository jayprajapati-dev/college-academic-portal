/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Subject = require('../models/Subject');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics';

const ensureTeacherAssignments = async () => {
  const teacher = await User.findOne({ email: 'rahul.teacher@example.com', role: 'teacher' });
  if (!teacher) {
    console.log('Teacher test user not found: rahul.teacher@example.com');
    return;
  }

  const branchId = teacher.branch;
  const subjects = await Subject.find(branchId ? { branchId } : {}).sort({ createdAt: 1 }).limit(6).select('_id');
  if (subjects.length === 0) {
    console.log('No subjects found for teacher assignment repair.');
    return;
  }

  teacher.assignedSubjects = subjects.map((s) => s._id);
  await teacher.save();
  console.log(`Teacher assignments repaired (${teacher.assignedSubjects.length} subjects).`);
};

const ensureCoordinatorUser = async () => {
  const fallbackBranch = await Branch.findOne().sort({ createdAt: 1 }).select('_id');
  const fallbackSemesters = await Semester.find().sort({ semesterNumber: 1, createdAt: 1 }).limit(2).select('_id');

  if (!fallbackBranch || fallbackSemesters.length === 0) {
    console.log('Cannot create coordinator: branch/semester baseline data missing.');
    return;
  }

  let coordinator = await User.findOne({ email: 'coordinator@example.com' }).select('+password');
  if (!coordinator) {
    coordinator = new User({
      name: 'Default Coordinator',
      email: 'coordinator@example.com',
      mobile: '6666666666',
      password: 'coordinator123',
      role: 'coordinator',
      status: 'active',
      branch: fallbackBranch._id,
      semester: fallbackSemesters[0]._id,
      coordinator: {
        branch: fallbackBranch._id,
        semesters: fallbackSemesters.map((s) => s._id),
        academicYear: '2024-2025',
        status: 'active',
        baseRole: 'teacher',
        validFrom: new Date('2024-06-01'),
        validTill: new Date('2030-05-31')
      }
    });
    await coordinator.save();
    console.log('Coordinator test user created (coordinator@example.com).');
    return;
  }

  coordinator.role = 'coordinator';
  coordinator.status = 'active';
  coordinator.branch = fallbackBranch._id;
  coordinator.semester = fallbackSemesters[0]._id;
  coordinator.coordinator = {
    ...(coordinator.coordinator || {}),
    branch: fallbackBranch._id,
    semesters: fallbackSemesters.map((s) => s._id),
    academicYear: coordinator.coordinator?.academicYear || '2024-2025',
    status: 'active',
    baseRole: coordinator.coordinator?.baseRole || 'teacher',
    validFrom: coordinator.coordinator?.validFrom || new Date('2024-06-01'),
    validTill: coordinator.coordinator?.validTill || new Date('2030-05-31')
  };
  await coordinator.save();
  console.log('Coordinator test user updated and activated (coordinator@example.com).');
};

const main = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for audit failure repair.');

    await ensureTeacherAssignments();
    await ensureCoordinatorUser();

    console.log('Audit failure repair complete.');
    process.exit(0);
  } catch (error) {
    console.error('Audit failure repair failed:', error);
    process.exit(1);
  }
};

main();
