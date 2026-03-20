// client/src/utils/role.js

export const isAdmin = user => user?.role === 'admin';
export const isHOD = user => user?.role === 'hod';
export const isCoordinator = user => user?.role === 'coordinator';
export const isTeacher = user => user?.role === 'teacher';
export const isStudent = user => user?.role === 'student';
