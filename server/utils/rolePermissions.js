const ROLE_DEFAULTS = {
  admin: [
    'dashboard',
    'academic-structure',
    'semesters',
    'branches',
    'subjects',
    'library',
    'timetable',
    'notices',
    'tasks',
    'attendance',
    'exams',
    'users',
    'contacts'
  ],
  hod: [
    'dashboard',
    'profile',
    'add-teacher',
    'manage-teachers',
    'notices',
    'tasks',
    'materials',
    'library',
    'attendance',
    'exams',
    'reports',
    'timetable',
    'users'
  ],
  teacher: [
    'dashboard',
    'materials',
    'library',
    'tasks',
    'notices',
    'attendance',
    'exams',
    'profile',
    'users'
  ]
};

const getRoleDefaults = (role) => ROLE_DEFAULTS[role] || [];

module.exports = {
  ROLE_DEFAULTS,
  getRoleDefaults
};
