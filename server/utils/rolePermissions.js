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
    'attendance',
    'exams',
    'users',
    'contacts',
    'activity'
  ],
  hod: [
    'dashboard',
    'profile',
    'add-teacher',
    'manage-teachers',
    'notices',
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
  ],
  coordinator: [
    'dashboard',
    'tasks',
    'notices',
    'attendance',
    'profile',
    'users',
    'activity'
  ]
};

const getRoleDefaults = (role) => ROLE_DEFAULTS[role] || [];

module.exports = {
  ROLE_DEFAULTS,
  getRoleDefaults
};
