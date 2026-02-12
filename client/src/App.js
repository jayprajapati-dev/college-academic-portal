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
import NoticeBoard from './pages/NoticeBoard';

// Import dashboards
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherProfile from './pages/TeacherProfile';
import HODDashboard from './pages/HODDashboard';
import HODProfile from './pages/HODProfile';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import SemesterManagement from './pages/SemesterManagement';
import BranchManagement from './pages/BranchManagement';
import SubjectManagement from './pages/SubjectManagement';
import SubjectMaterialsManagement from './pages/SubjectMaterialsManagement';
import AcademicStructure from './pages/AcademicStructure';
import ContactManagement from './pages/admin/ContactManagement';
import TeacherMaterials from './pages/TeacherMaterials';
import AdminMaterials from './pages/AdminMaterials';
import PasswordSetup from './pages/PasswordSetup';
import NoticeManagement from './pages/NoticeManagement';
import TaskManagement from './pages/TaskManagement';

// Import HOD pages
import AddTeacher from './pages/hod/AddTeacher';
import ManageTeachers from './pages/hod/ManageTeachers';
import BranchReports from './pages/hod/BranchReports';
import HodTeacherTimetableManagement from './pages/hod/TimetableManagement';

// Import Admin pages
import AddTeacherAdmin from './pages/admin/AddTeacher';
import AddHODAdmin from './pages/admin/AddHOD';
import AdminTimetableManagement from './pages/admin/TimetableManagement';

// Import Student pages
import StudentTimetableView from './pages/student/TimetableView';
import StudentTaskView from './pages/student/TaskView';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentTaskDetail from './pages/student/TaskDetail';

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
        <Route path="/subjects/:id/materials" element={<SubjectMaterialsPublic />} />
        <Route path="/notices" element={<NoticeBoard />} />
        
        {/* First Login & Profile Setup */}
        <Route path="/first-login" element={<FirstLoginPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/password-setup" element={<PasswordSetup />} />
        
        {/* Dashboards (Role-based) */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/subjects" element={<StudentSubjects />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/timetable" element={<StudentTimetableView />} />
        <Route path="/subjects/:subjectId/tasks" element={<StudentTaskView />} />
        <Route path="/student/tasks/:taskId" element={<StudentTaskDetail />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />
        <Route path="/teacher/materials" element={<TeacherMaterials />} />
        <Route path="/teacher/notices" element={<NoticeManagement />} />
        <Route path="/teacher/tasks" element={<TaskManagement />} />
        <Route path="/hod/dashboard" element={<HODDashboard />} />
        <Route path="/hod/profile" element={<HODProfile />} />
        <Route path="/hod/add-teacher" element={<AddTeacher />} />
        <Route path="/hod/manage-teachers" element={<ManageTeachers />} />
        <Route path="/hod/materials" element={<TeacherMaterials />} />
        <Route path="/hod/reports" element={<BranchReports />} />
        <Route path="/hod/timetable" element={<HodTeacherTimetableManagement />} />
        <Route path="/hod/notices" element={<NoticeManagement />} />
        <Route path="/hod/tasks" element={<TaskManagement />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/manage-users" element={<UserManagement />} />
        <Route path="/admin/add-teacher" element={<AddTeacherAdmin />} />
        <Route path="/admin/add-hod" element={<AddHODAdmin />} />
        <Route path="/admin/semesters" element={<SemesterManagement />} />
        <Route path="/admin/branches" element={<BranchManagement />} />
        <Route path="/admin/subjects" element={<SubjectManagement />} />
        <Route path="/admin/subjects/:id/materials" element={<SubjectMaterialsManagement />} />
        <Route path="/admin/academic-structure" element={<AcademicStructure />} />
        <Route path="/admin/contacts" element={<ContactManagement />} />
        <Route path="/admin/timetable" element={<AdminTimetableManagement />} />
        <Route path="/admin/notices" element={<NoticeManagement />} />
        <Route path="/admin/tasks" element={<TaskManagement />} />
        <Route path="/admin/materials" element={<AdminMaterials />} />
        
        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
