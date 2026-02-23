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
    'exams',
    'profile',
    'users'
  ],
  coordinator: [
    'dashboard',
    'tasks',
    'notices',
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
