import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import all pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import FirstLoginPage from './pages/FirstLoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import DisclaimerPage from './pages/DisclaimerPage';
import SubjectMaterialsPublic from './pages/SubjectMaterialsPublic';
import SubjectHub from './pages/SubjectHub';
import NoticeBoard from './pages/NoticeBoard';
import RoleDashboard from './pages/role/RoleDashboard';
import RoleMaterials from './pages/role/RoleMaterials';
import RoleNotices from './pages/role/RoleNotices';
import RoleTasks from './pages/role/RoleTasks';
import RoleLibrary from './pages/role/RoleLibrary';
import RoleTimetable from './pages/role/RoleTimetable';
import RoleBranches from './pages/role/RoleBranches';
import RoleSemesters from './pages/role/RoleSemesters';
import RoleProfile from './pages/role/RoleProfile';
import RoleManageTeachers from './pages/role/RoleManageTeachers';

// Import dashboards
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import UserManagement from './pages/UserManagement';
import SubjectMaterialsManagement from './pages/SubjectMaterialsManagement';
import RoleAcademicStructure from './pages/role/RoleAcademicStructure';
import RoleSubjects from './pages/role/RoleSubjects';
import ContactManagement from './pages/admin/ContactManagement';
import PasswordSetup from './pages/PasswordSetup';
import AttendanceManagement from './pages/AttendanceManagement';
import ExamManagement from './pages/ExamManagement';

// Import HOD pages
import AddTeacher from './pages/hod/AddTeacher';
import ManageTeachers from './pages/hod/ManageTeachers';
import BranchReports from './pages/hod/BranchReports';

// Import Admin pages
import AddTeacherAdmin from './pages/admin/AddTeacher';
import AddHODAdmin from './pages/admin/AddHOD';

// Import Student pages
import StudentTimetableView from './pages/student/TimetableView';
import StudentTaskView from './pages/student/TaskView';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentTaskDetail from './pages/student/TaskDetail';
import StudentLibrary from './pages/student/StudentLibrary';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentExams from './pages/student/StudentExams';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/subjects/:id" element={<SubjectHub />} />
        <Route path="/subjects/:id/materials" element={<SubjectMaterialsPublic />} />
        <Route path="/notices" element={<NoticeBoard />} />
        
        {/* First Login & Profile Setup */}
        <Route path="/first-login" element={<FirstLoginPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/password-setup" element={<PasswordSetup />} />
        
        {/* Dashboards (Role-based) */}
        <Route path="/student/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/student/subjects" element={<StudentSubjects />} />
        <Route path="/student/library" element={<StudentLibrary />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/exams" element={<StudentExams />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/timetable" element={<StudentTimetableView />} />
        <Route path="/subjects/:subjectId/tasks" element={<StudentTaskView />} />
        <Route path="/student/tasks/:taskId" element={<StudentTaskDetail />} />
        <Route path="/teacher/dashboard" element={<RoleDashboard />} />
        <Route path="/teacher/profile" element={<RoleProfile />} />
        <Route path="/teacher/materials" element={<RoleMaterials />} />
        <Route path="/teacher/notices" element={<RoleNotices />} />
        <Route path="/teacher/tasks" element={<RoleTasks />} />
        <Route path="/teacher/library" element={<RoleLibrary />} />
        <Route path="/teacher/attendance" element={<AttendanceManagement />} />
        <Route path="/teacher/exams" element={<ExamManagement />} />
        <Route path="/hod/dashboard" element={<RoleDashboard />} />
        <Route path="/hod/profile" element={<RoleProfile />} />
        <Route path="/hod/add-teacher" element={<AddTeacher />} />
        <Route path="/hod/manage-teachers" element={<RoleManageTeachers />} />
        <Route path="/hod/materials" element={<RoleMaterials />} />
        <Route path="/hod/reports" element={<BranchReports />} />
        <Route path="/hod/timetable" element={<RoleTimetable />} />
        <Route path="/hod/notices" element={<RoleNotices />} />
        <Route path="/hod/tasks" element={<RoleTasks />} />
        <Route path="/hod/library" element={<RoleLibrary />} />
        <Route path="/hod/attendance" element={<AttendanceManagement />} />
        <Route path="/hod/exams" element={<ExamManagement />} />
        <Route path="/admin/dashboard" element={<RoleDashboard />} />
        <Route path="/admin/profile" element={<RoleProfile />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/manage-users" element={<UserManagement />} />
        <Route path="/hod/users" element={<UserManagement />} />
        <Route path="/teacher/users" element={<UserManagement />} />
        <Route path="/admin/add-teacher" element={<AddTeacherAdmin />} />
        <Route path="/admin/add-hod" element={<AddHODAdmin />} />
        <Route path="/admin/semesters" element={<RoleSemesters />} />
        <Route path="/admin/branches" element={<RoleBranches />} />
        <Route path="/admin/subjects" element={<RoleSubjects />} />
        <Route path="/admin/subjects/:id/materials" element={<SubjectMaterialsManagement />} />
        <Route path="/admin/academic-structure" element={<RoleAcademicStructure />} />
        <Route path="/admin/contacts" element={<ContactManagement />} />
        <Route path="/admin/timetable" element={<RoleTimetable />} />
        <Route path="/admin/notices" element={<RoleNotices />} />
        <Route path="/admin/tasks" element={<RoleTasks />} />
        <Route path="/admin/materials" element={<RoleMaterials />} />
        <Route path="/admin/library" element={<RoleLibrary />} />
        <Route path="/admin/attendance" element={<AttendanceManagement />} />
        <Route path="/admin/exams" element={<ExamManagement />} />
        <Route path="/hod/subjects" element={<RoleSubjects />} />
        <Route path="/teacher/subjects" element={<RoleSubjects />} />
        <Route path="/hod/academic-structure" element={<RoleAcademicStructure />} />
        <Route path="/teacher/academic-structure" element={<RoleAcademicStructure />} />
        <Route path="/teacher/timetable" element={<RoleTimetable />} />
        
        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
