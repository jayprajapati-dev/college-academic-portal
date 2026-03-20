const ROLE_DEFAULTS = {
  admin: [
    'dashboard',
    'academic-structure',
    'semesters',
    'branches',
    'subjects',
    'rooms',
    'projects',
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
    'projects',
    'materials',
    'library',
    'exams',
    'reports',
    'timetable',
    'rooms',
    'users'
  ],
  teacher: [
    'dashboard',
    'materials',
    'library',
    'tasks',
    'projects',
    'notices',
    'exams',
    'profile',
    'users'
  ],
  coordinator: [
    'dashboard',
    'tasks',
    'projects',
    'notices',
    'exams',
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
