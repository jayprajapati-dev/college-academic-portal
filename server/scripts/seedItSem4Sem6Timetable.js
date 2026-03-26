require('dotenv').config();
const mongoose = require('mongoose');

const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Room = require('../models/Room');
const Timetable = require('../models/Timetable');
const TimetableSettings = require('../models/TimetableSettings');

const CONNECTION_STRING = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics';

const SLOT_INDEX = {
  '09:30': 1,
  '10:30': 2,
  '11:30': 3,
  '13:00': 4,
  '14:00': 5,
  '15:00': 6,
  '16:10': 7,
  '17:10': 8
};

const SUBJECT_DEFS = {
  IT4_MAD: { code: 'IT4-MAD', name: 'Mathematics for Application Development', semester: 4, type: 'theory+practical' },
  IT4_CSDF: { code: 'IT4-CSDF', name: 'Computer Security and Digital Forensics', semester: 4, type: 'theory+practical' },
  IT4_MCN: { code: 'IT4-MCN', name: 'Mobile Computing Networks', semester: 4, type: 'theory' },
  IT4_AJP: { code: 'IT4-AJP', name: 'Advanced Java Programming', semester: 4, type: 'theory+practical' },
  IT4_FOML: { code: 'IT4-FOML', name: 'Fundamentals of Machine Learning', semester: 4, type: 'theory+practical' },
  IT4_UIUX: { code: 'IT4-UIUXD', name: 'UI and UX Design', semester: 4, type: 'theory+practical' },
  IT4_ES: { code: 'IT4-ESVAC', name: 'Environment and Sustainability (VAC)', semester: 4, type: 'theory' },
  IT4_LIB: { code: 'IT4-LIB', name: 'Library Hour', semester: 4, type: 'theory' },

  IT6_SD: { code: 'IT6-SD', name: 'Software Development', semester: 6, type: 'theory+practical' },
  IT6_CDCT: { code: 'IT6-CDCT', name: 'Cloud and Distributed Computing Technologies', semester: 6, type: 'theory+practical' },
  IT6_CSDF: { code: 'IT6-CSDF', name: 'Cyber Security and Digital Forensics', semester: 6, type: 'theory+practical' },
  IT6_FOBC: { code: 'IT6-FOBC', name: 'Fundamentals of Blockchain', semester: 6, type: 'theory+practical' }
};

const TEACHER_DEFS = {
  CK: { name: 'Prof. C K', email: 'ck.it@college.edu', mobile: '9000000001' },
  TP: { name: 'Prof. T P', email: 'tp.it@college.edu', mobile: '9000000002' },
  DL: { name: 'Prof. D L', email: 'dl.it@college.edu', mobile: '9000000003' },
  VAC: { name: 'Prof. VAC Mentor', email: 'vac.it@college.edu', mobile: '9000000004' },
  LIB: { name: 'Library Staff IT', email: 'library.it@college.edu', mobile: '9000000005' }
};

const SEM4_ROWS = [
  { day: 'Monday', start: '10:30', end: '11:30', subject: 'IT4_MAD', teacher: 'TP', lectureType: 'Lab', division: 'IT1', room: 'F-05' },
  { day: 'Monday', start: '11:30', end: '12:30', subject: 'IT4_CSDF', teacher: 'CK', lectureType: 'Theory', division: 'IT2', room: 'G-07' },
  { day: 'Monday', start: '13:00', end: '14:00', subject: 'IT4_MCN', teacher: 'DL', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Monday', start: '14:00', end: '15:00', subject: 'IT4_AJP', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Monday', start: '15:00', end: '16:00', subject: 'IT4_AJP', teacher: 'CK', lectureType: 'Theory', division: 'IT2', room: 'G-07' },

  { day: 'Tuesday', start: '10:30', end: '11:30', subject: 'IT4_CSDF', teacher: 'CK', lectureType: 'Theory', division: 'IT1', room: 'G-07' },
  { day: 'Tuesday', start: '11:30', end: '12:30', subject: 'IT4_UIUX', teacher: 'TP', lectureType: 'Lab', division: 'IT2', room: 'G-06' },
  { day: 'Tuesday', start: '13:00', end: '14:00', subject: 'IT4_MAD', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Tuesday', start: '14:00', end: '15:00', subject: 'IT4_ES', teacher: 'VAC', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Tuesday', start: '15:00', end: '16:00', subject: 'IT4_MCN', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },

  { day: 'Wednesday', start: '09:30', end: '10:30', subject: 'IT4_FOML', teacher: 'CK', lectureType: 'Theory', division: 'IT1', room: 'G-07' },
  { day: 'Wednesday', start: '10:30', end: '11:30', subject: 'IT4_MAD', teacher: 'TP', lectureType: 'Lab', division: 'IT2', room: 'G-06' },
  { day: 'Wednesday', start: '11:30', end: '12:30', subject: 'IT4_MCN', teacher: 'DL', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Wednesday', start: '13:00', end: '14:00', subject: 'IT4_MAD', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Wednesday', start: '14:00', end: '15:00', subject: 'IT4_FOML', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Wednesday', start: '15:00', end: '16:00', subject: 'IT4_CSDF', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Wednesday', start: '16:10', end: '17:10', subject: 'IT4_UIUX', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },

  { day: 'Thursday', start: '09:30', end: '10:30', subject: 'IT4_UIUX', teacher: 'TP', lectureType: 'Lab', division: 'IT1', room: 'F-05' },
  { day: 'Thursday', start: '10:30', end: '11:30', subject: 'IT4_FOML', teacher: 'CK', lectureType: 'Theory', division: 'IT2', room: 'G-07' },
  { day: 'Thursday', start: '11:30', end: '12:30', subject: 'IT4_CSDF', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Thursday', start: '13:00', end: '14:00', subject: 'IT4_FOML', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Thursday', start: '14:00', end: '15:00', subject: 'IT4_ES', teacher: 'VAC', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Thursday', start: '15:00', end: '16:00', subject: 'IT4_UIUX', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'G-06' },
  { day: 'Thursday', start: '16:10', end: '17:10', subject: 'IT4_AJP', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },

  { day: 'Friday', start: '09:30', end: '10:30', subject: 'IT4_FOML', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Friday', start: '10:30', end: '11:30', subject: 'IT4_AJP', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Friday', start: '11:30', end: '12:30', subject: 'IT4_MCN', teacher: 'DL', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Friday', start: '13:00', end: '14:00', subject: 'IT4_MAD', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Friday', start: '14:00', end: '15:00', subject: 'IT4_LIB', teacher: 'LIB', lectureType: 'Theory', division: 'General', room: 'G-07' },
  { day: 'Friday', start: '15:00', end: '16:00', subject: 'IT4_AJP', teacher: 'CK', lectureType: 'Theory', division: 'IT1', room: 'G-07' }
];

const SEM6_ROWS = [
  { day: 'Monday', start: '11:30', end: '12:30', subject: 'IT6_SD', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Monday', start: '13:00', end: '14:00', subject: 'IT6_SD', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Monday', start: '14:00', end: '15:00', subject: 'IT6_CDCT', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Monday', start: '15:00', end: '16:00', subject: 'IT6_CSDF', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },

  { day: 'Tuesday', start: '11:30', end: '12:30', subject: 'IT6_CDCT', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Tuesday', start: '13:00', end: '14:00', subject: 'IT6_FOBC', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Tuesday', start: '14:00', end: '15:00', subject: 'IT6_SD', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Tuesday', start: '15:00', end: '16:00', subject: 'IT6_SD', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },

  { day: 'Wednesday', start: '11:30', end: '12:30', subject: 'IT6_CSDF', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Wednesday', start: '13:00', end: '14:00', subject: 'IT6_FOBC', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Wednesday', start: '14:00', end: '16:00', subject: 'IT6_CSDF', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05', slotSpan: 2 },
  { day: 'Wednesday', start: '16:10', end: '17:10', subject: 'IT6_FOBC', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },

  { day: 'Thursday', start: '11:30', end: '12:30', subject: 'IT6_CDCT', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Thursday', start: '13:00', end: '14:00', subject: 'IT6_CSDF', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },
  { day: 'Thursday', start: '14:00', end: '15:00', subject: 'IT6_SD', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Thursday', start: '15:00', end: '16:00', subject: 'IT6_SD', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Thursday', start: '16:10', end: '17:10', subject: 'IT6_CDCT', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05' },

  { day: 'Friday', start: '13:00', end: '14:00', subject: 'IT6_FOBC', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Friday', start: '14:00', end: '15:00', subject: 'IT6_FOBC', teacher: 'CK', lectureType: 'Theory', division: 'General', room: 'F-06' },
  { day: 'Friday', start: '15:00', end: '17:10', subject: 'IT6_CSDF', teacher: 'TP', lectureType: 'Lab', division: 'General', room: 'F-05', slotSpan: 2 }
];

function uniqueIds(values) {
  return Array.from(new Set(values.map((id) => String(id)).filter(Boolean)));
}

async function ensureSemester(semesterNumber) {
  let semester = await Semester.findOne({ semesterNumber });
  if (!semester) {
    semester = await Semester.create({
      semesterNumber,
      academicYear: '2025-2026',
      isActive: true
    });
    return semester;
  }

  if (!semester.isActive) {
    semester.isActive = true;
    await semester.save();
  }

  return semester;
}

async function ensureITBranch(referenceSemesterId) {
  let branch = await Branch.findOne({ code: 'IT' });
  if (!branch) {
    branch = await Branch.create({
      name: 'Information Technology',
      code: 'IT',
      description: 'Information Technology Department',
      semesterId: referenceSemesterId,
      totalSeats: 120,
      isActive: true
    });
    return branch;
  }

  const updates = {};
  if (!branch.isActive) updates.isActive = true;
  if (!branch.semesterId && referenceSemesterId) updates.semesterId = referenceSemesterId;
  if (Object.keys(updates).length > 0) {
    branch = await Branch.findByIdAndUpdate(branch._id, { $set: updates }, { new: true });
  }

  return branch;
}

async function ensureRoom(roomNo, type, buildingName, floor = 'Ground') {
  let room = await Room.findOne({ roomNo });
  if (!room) {
    room = await Room.create({ roomNo, type, buildingName, floor, isActive: true });
    return room;
  }

  const updates = {};
  if (room.type !== type) updates.type = type;
  if (room.buildingName !== buildingName) updates.buildingName = buildingName;
  if (room.floor !== floor) updates.floor = floor;
  if (!room.isActive) updates.isActive = true;
  if (Object.keys(updates).length > 0) {
    room = await Room.findByIdAndUpdate(room._id, { $set: updates }, { new: true });
  }

  return room;
}

async function ensureSubject(def, branchId, semesterId) {
  let subject = await Subject.findOne({ code: def.code });
  const offeringPair = {
    branchId: new mongoose.Types.ObjectId(branchId),
    semesterId: new mongoose.Types.ObjectId(semesterId)
  };

  if (!subject) {
    subject = await Subject.create({
      name: def.name,
      code: def.code,
      credits: 4,
      branchId,
      semesterId,
      offerings: [offeringPair],
      type: def.type || 'theory',
      description: `${def.name} for IT semester ${def.semester}`,
      isActive: true
    });
    return subject;
  }

  const existingOfferings = Array.isArray(subject.offerings) ? subject.offerings : [];
  const hasOffering = existingOfferings.some(
    (off) => String(off.branchId) === String(branchId) && String(off.semesterId) === String(semesterId)
  );

  if (!hasOffering) {
    subject.offerings = [...existingOfferings, offeringPair];
  }

  subject.name = def.name;
  subject.branchId = branchId;
  subject.semesterId = semesterId;
  subject.type = def.type || subject.type;
  subject.isActive = true;
  await subject.save();

  return subject;
}

async function ensureTeacher(key, teacherDef, branchId, semesterIds, subjectIds) {
  let teacher = await User.findOne({ email: teacherDef.email.toLowerCase() }).select('+password');

  if (!teacher) {
    teacher = new User({
      name: teacherDef.name,
      email: teacherDef.email.toLowerCase(),
      mobile: teacherDef.mobile,
      role: 'teacher',
      status: 'active',
      password: 'Teacher@123',
      branch: branchId,
      branches: [branchId],
      semesters: semesterIds,
      assignedSubjects: subjectIds,
      subjects: subjectIds
    });
    await teacher.save();
    return teacher;
  }

  const mergedSemesters = uniqueIds([...(teacher.semesters || []), ...semesterIds]);
  const mergedSubjects = uniqueIds([...(teacher.assignedSubjects || []), ...subjectIds]);

  teacher.role = 'teacher';
  teacher.status = 'active';
  teacher.name = teacherDef.name;
  teacher.mobile = teacherDef.mobile;
  teacher.branch = branchId;
  teacher.branches = uniqueIds([...(teacher.branches || []), branchId]);
  teacher.semesters = mergedSemesters;
  teacher.assignedSubjects = mergedSubjects;
  teacher.subjects = uniqueIds([...(teacher.subjects || []), ...subjectIds]);

  await teacher.save();
  return teacher;
}

async function upsertTimetableSettings() {
  await TimetableSettings.updateOne(
    {},
    {
      $set: {
        dayStartTime: '09:30',
        dayEndTime: '18:10',
        slotMinutes: 60,
        maxSlot: 8,
        breakSlots: [],
        breakWindows: [
          { startTime: '12:30', endTime: '13:00', label: 'Lunch Break' },
          { startTime: '16:00', endTime: '16:10', label: 'Short Break' }
        ],
        teacherMaxHoursPerDay: 7,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

function buildTimetableDoc(row, semesterId, branchId, subjectMap, teacherMap, roomMap) {
  const slot = SLOT_INDEX[row.start];
  if (!slot) {
    throw new Error(`No slot mapping found for time ${row.start}`);
  }

  const slotSpan = Number(row.slotSpan) > 1 ? Number(row.slotSpan) : 1;

  const subject = subjectMap[row.subject];
  const teacher = teacherMap[row.teacher];
  const room = roomMap[row.room];

  if (!subject) throw new Error(`Subject mapping missing for ${row.subject}`);
  if (!teacher) throw new Error(`Teacher mapping missing for ${row.teacher}`);
  if (!room) throw new Error(`Room mapping missing for ${row.room}`);

  return {
    semesterId,
    branchId,
    subjectId: subject._id,
    teacherId: teacher._id,
    roomId: room._id,
    dayOfWeek: row.day,
    slot,
    slotSpan,
    startTime: row.start,
    endTime: row.end,
    lectureType: row.lectureType,
    division: row.division || 'General',
    status: 'active'
  };
}

async function run() {
  await mongoose.connect(CONNECTION_STRING);

  const sem4 = await ensureSemester(4);
  const sem6 = await ensureSemester(6);
  const itBranch = await ensureITBranch(sem4._id);

  const roomMap = {
    'G-07': await ensureRoom('G-07', 'Class', 'Main Building', 'Ground'),
    'G-06': await ensureRoom('G-06', 'Lab', 'Main Building', 'Ground'),
    'F-06': await ensureRoom('F-06', 'Class', 'Mech Building', 'Ground'),
    'F-05': await ensureRoom('F-05', 'Lab', 'Mech Building', 'Ground')
  };

  const subjectMap = {};
  for (const key of Object.keys(SUBJECT_DEFS)) {
    const def = SUBJECT_DEFS[key];
    const semester = def.semester === 4 ? sem4 : sem6;
    subjectMap[key] = await ensureSubject(def, itBranch._id, semester._id);
  }

  const subjectsByTeacher = {
    CK: ['IT4_CSDF', 'IT4_AJP', 'IT4_FOML', 'IT6_SD', 'IT6_FOBC'],
    TP: ['IT4_MAD', 'IT4_UIUX', 'IT4_MCN', 'IT6_CDCT', 'IT6_CSDF'],
    DL: ['IT4_MCN'],
    VAC: ['IT4_ES'],
    LIB: ['IT4_LIB']
  };

  const teacherMap = {};
  for (const key of Object.keys(TEACHER_DEFS)) {
    const subjectIds = (subjectsByTeacher[key] || []).map((subjectKey) => subjectMap[subjectKey]._id);
    teacherMap[key] = await ensureTeacher(
      key,
      TEACHER_DEFS[key],
      itBranch._id,
      [sem4._id, sem6._id],
      subjectIds
    );
  }

  await Timetable.deleteMany({
    branchId: itBranch._id,
    semesterId: { $in: [sem4._id, sem6._id] }
  });

  const sem4Docs = SEM4_ROWS.map((row) => buildTimetableDoc(row, sem4._id, itBranch._id, subjectMap, teacherMap, roomMap));
  const sem6Docs = SEM6_ROWS.map((row) => buildTimetableDoc(row, sem6._id, itBranch._id, subjectMap, teacherMap, roomMap));
  await Timetable.insertMany([...sem4Docs, ...sem6Docs]);

  await upsertTimetableSettings();

  console.log('IT Sem 4 + Sem 6 timetable seeded successfully.');
  console.log(`Branch: ${itBranch.name} (${itBranch.code})`);
  console.log(`Semester 4 entries: ${sem4Docs.length}`);
  console.log(`Semester 6 entries: ${sem6Docs.length}`);
  console.log('Teachers created/reused:');
  Object.entries(teacherMap).forEach(([key, teacher]) => {
    console.log(`- ${key}: ${teacher.name} (${teacher.email})`);
  });
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
