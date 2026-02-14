import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, RoleLayout, StatsCard } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleDashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    hods: 0,
    branches: 0,
    subjects: 0
  });
  const [hodStats, setHodStats] = useState({
    teachers: 0,
    content: 0,
    students: 0
  });
  const [teacherStats, setTeacherStats] = useState({
    drafts: 0,
    published: 0,
    subjects: 0
  });
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.success) {
        navigate('/login');
        return;
      }

      setUser(data.data);
      setRole(data.data.role);
      setTeacherStats((prev) => ({
        ...prev,
        subjects: data.data.assignedSubjects?.length || 0
      }));
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchAdminStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const usersResponse = await fetch('/api/admin/users?page=1&limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();

      const [branchesRes, subjectsRes] = await Promise.all([
        fetch('/api/academic/branches').then((r) => r.json()),
        fetch('/api/academic/subjects').then((r) => r.json())
      ]);

      const branchCount = Array.isArray(branchesRes.data) ? branchesRes.data.length : 0;
      const subjectCount = Array.isArray(subjectsRes.data) ? subjectsRes.data.length : 0;

      if (usersData.success && Array.isArray(usersData.data)) {
        const allUsers = usersData.data;
        const students = allUsers.filter(u => u.role === 'student').length;
        const teachers = allUsers.filter(u => u.role === 'teacher').length;
        const hods = allUsers.filter(u => u.role === 'hod').length;

        setAdminStats({
          totalUsers: usersData.total || allUsers.length,
          students,
          teachers,
          hods,
          branches: branchCount,
          subjects: subjectCount
        });
      }
    } catch (error) {
      console.error('Admin stats error:', error);
    }
  }, []);

  const fetchHodStats = useCallback(async (profile) => {
    try {
      const token = localStorage.getItem('token');
      const branchId = profile?.branch?._id;
      const url = branchId ? `/api/academic/branch-stats?branchId=${branchId}` : '/api/academic/branch-stats';

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setHodStats({
          teachers: data.data?.teachers || 0,
          content: data.data?.subjects || 0,
          students: data.data?.students || 0
        });
      }
    } catch (error) {
      console.error('HOD stats error:', error);
    }
  }, []);

  const fetchTeacherMeta = useCallback(async () => {
    try {
      const [branchRes, semesterRes] = await Promise.all([
        fetch('/api/academic/branches').then((r) => r.json()),
        fetch('/api/academic/semesters').then((r) => r.json())
      ]);
      setBranches(branchRes?.data || []);
      setSemesters(semesterRes?.data || []);
    } catch (error) {
      console.error('Teacher meta error:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!user?.role) return;

    if (user.role === 'admin') {
      fetchAdminStats();
    }

    if (user.role === 'hod') {
      fetchHodStats(user);
    }

    if (user.role === 'teacher') {
      fetchTeacherMeta();
    }
  }, [user, fetchAdminStats, fetchHodStats, fetchTeacherMeta]);

  useEffect(() => {
    if (!user?.assignedSubjects?.length) return;

    const getId = (value) => (typeof value === 'string' ? value : value?._id);
    const assignedBranchIds = Array.from(new Set(user.assignedSubjects.map((s) => getId(s.branchId)))).filter(Boolean);
    const assignedSemesterIds = Array.from(new Set(user.assignedSubjects.map((s) => getId(s.semesterId)))).filter(Boolean);

    if (!selectedBranchId && assignedBranchIds.length === 1) {
      setSelectedBranchId(assignedBranchIds[0]);
    }

    if (!selectedSemesterId && assignedSemesterIds.length === 1) {
      setSelectedSemesterId(assignedSemesterIds[0]);
    }
  }, [user, selectedBranchId, selectedSemesterId]);

  const panelLabel = useMemo(() => {
    if (role === 'admin') return 'Admin Panel';
    if (role === 'hod') return 'HOD Panel';
    return 'Teacher Panel';
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
      </div>
    );
  }

  const renderAdmin = () => (
    <div className="space-y-8 font-display">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1220] text-white p-8 md:p-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#6366f1]/40 blur-3xl" />
        <div className="absolute left-10 bottom-0 h-32 w-32 rounded-full bg-[#f59e0b]/30 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200">System Control</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Welcome, {user?.name || 'Administrator'}</h2>
            <p className="text-sm md:text-base text-blue-100 max-w-xl">
              Monitor academics, manage users, and keep the institution running smoothly.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> System Online
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                {adminStats.totalUsers} active profiles
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="px-5 py-3 rounded-2xl bg-white text-[#0b1220] text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              Manage Users
            </button>
            <button
              onClick={() => navigate('/admin/academic-structure')}
              className="px-5 py-3 rounded-2xl border border-white/30 text-sm font-bold hover:bg-white/10 transition"
            >
              Academic Map
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatsCard icon="group" title="Total Users" value={adminStats.totalUsers} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-700" />
        <StatsCard icon="school" title="Students" value={adminStats.students} bgColor="bg-gradient-to-br from-sky-500 to-blue-600" />
        <StatsCard icon="person" title="Teachers" value={adminStats.teachers} bgColor="bg-gradient-to-br from-emerald-500 to-green-600" />
        <StatsCard icon="supervisor_account" title="Department Heads" value={adminStats.hods} bgColor="bg-gradient-to-br from-purple-500 to-fuchsia-600" />
        <StatsCard icon="apartment" title="Branches" value={adminStats.branches} bgColor="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatsCard icon="menu_book" title="Subjects" value={adminStats.subjects} bgColor="bg-gradient-to-br from-slate-700 to-slate-900" />
      </div>

      <Card title="Admin Workspace" subtitle="Daily operations and academic control">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <button onClick={() => navigate('/admin/semesters')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Academics</p>
            <p className="text-lg font-bold mt-2">Semesters</p>
            <p className="text-sm text-[#6B7280]">Plan terms & timelines</p>
          </button>
          <button onClick={() => navigate('/admin/branches')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Departments</p>
            <p className="text-lg font-bold mt-2">Branches</p>
            <p className="text-sm text-[#6B7280]">Capacity and structure</p>
          </button>
          <button onClick={() => navigate('/admin/subjects')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Catalog</p>
            <p className="text-lg font-bold mt-2">Subjects</p>
            <p className="text-sm text-[#6B7280]">Curriculum control</p>
          </button>
          <button onClick={() => navigate('/admin/timetable')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Scheduling</p>
            <p className="text-lg font-bold mt-2">Timetable</p>
            <p className="text-sm text-[#6B7280]">Manage schedules</p>
          </button>
          <button onClick={() => navigate('/admin/library')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Resources</p>
            <p className="text-lg font-bold mt-2">Library</p>
            <p className="text-sm text-[#6B7280]">Curate learning assets</p>
          </button>
        </div>
      </Card>
    </div>
  );

  const renderHod = () => (
    <div className="space-y-8 font-display">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f766e] via-[#0891b2] to-[#0ea5e9] text-white p-8 md:p-10">
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-100">Department Hub</p>
            <h2 className="text-3xl md:text-4xl font-black">Welcome, {user?.name || 'HOD'}</h2>
            <p className="text-sm md:text-base text-teal-50 mt-2">
              Branch: {user?.branch?.name || 'N/A'} • Keep teachers aligned and content flowing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/hod/manage-teachers')}
              className="px-5 py-3 rounded-2xl bg-white text-[#0f766e] text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              Manage Teachers
            </button>
            <button
              onClick={() => navigate('/hod/reports')}
              className="px-5 py-3 rounded-2xl border border-white/40 text-sm font-bold hover:bg-white/10 transition"
            >
              View Reports
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatsCard icon="group" title="Branch Teachers" value={hodStats.teachers} bgColor="bg-gradient-to-br from-sky-500 to-cyan-600" />
        <StatsCard icon="menu_book" title="Branch Content" value={hodStats.content} bgColor="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatsCard icon="school" title="Branch Students" value={hodStats.students} bgColor="bg-gradient-to-br from-emerald-500 to-green-600" />
      </div>

      <Card title="Daily Actions" subtitle="Teacher ops, content, and schedules">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <button onClick={() => navigate('/hod/add-teacher')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Faculty</p>
            <p className="text-lg font-bold mt-2">Add Teacher</p>
            <p className="text-sm text-[#6B7280]">Onboard new faculty</p>
          </button>
          <button onClick={() => navigate('/hod/materials')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Content</p>
            <p className="text-lg font-bold mt-2">Materials</p>
            <p className="text-sm text-[#6B7280]">Branch resources</p>
          </button>
          <button onClick={() => navigate('/hod/timetable')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Scheduling</p>
            <p className="text-lg font-bold mt-2">Timetable</p>
            <p className="text-sm text-[#6B7280]">Weekly routine</p>
          </button>
          {user?.assignedSubjects?.length > 0 && (
            <button onClick={() => navigate('/hod/tasks')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Tasks</p>
              <p className="text-lg font-bold mt-2">Assignments</p>
              <p className="text-sm text-[#6B7280]">Track deliverables</p>
            </button>
          )}
          <button onClick={() => navigate('/hod/library')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Library</p>
            <p className="text-lg font-bold mt-2">Reading Room</p>
            <p className="text-sm text-[#6B7280]">Curate resources</p>
          </button>
          <button onClick={() => navigate('/hod/notices')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Updates</p>
            <p className="text-lg font-bold mt-2">Notice Board</p>
            <p className="text-sm text-[#6B7280]">Share announcements</p>
          </button>
        </div>
      </Card>
    </div>
  );

  const resolveBranchName = (branchId) => {
    const id = typeof branchId === 'string' ? branchId : branchId?._id;
    return branches.find((b) => b._id === id)?.name || 'Branch';
  };

  const resolveSemesterName = (semesterId) => {
    const id = typeof semesterId === 'string' ? semesterId : semesterId?._id;
    const semester = semesters.find((s) => s._id === id);
    return semester ? `Semester ${semester.semesterNumber}` : 'Semester';
  };

  const renderTeacher = () => (
    <div className="space-y-8 font-display">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e3a8a] via-[#4338ca] to-[#7c3aed] text-white p-8 md:p-10">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Teaching Studio</p>
            <h2 className="text-3xl md:text-4xl font-black">Welcome back, {user?.name}!</h2>
            <p className="text-sm md:text-base text-indigo-100 mt-2">Plan lessons, publish content, and track assignments.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/teacher/materials')}
              className="px-5 py-3 rounded-2xl bg-white text-[#312e81] text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              Manage Materials
            </button>
            <button
              onClick={() => navigate('/teacher/tasks')}
              className="px-5 py-3 rounded-2xl border border-white/40 text-sm font-bold hover:bg-white/10 transition"
            >
              Create Tasks
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard icon="draft" title="Draft Materials" value={teacherStats.drafts} bgColor="bg-gradient-to-br from-amber-400 to-orange-500" />
        <StatsCard icon="verified" title="Published Content" value={teacherStats.published} bgColor="bg-gradient-to-br from-emerald-400 to-green-600" />
        <StatsCard icon="menu_book" title="My Subjects" value={teacherStats.subjects} bgColor="bg-gradient-to-br from-blue-500 to-indigo-600" />
      </div>

      <Card title="Quick Actions" subtitle="Jump to the tools you use most">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <button onClick={() => navigate('/teacher/subjects')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Subjects</p>
            <p className="text-lg font-bold mt-2">My Subjects</p>
            <p className="text-sm text-[#6B7280]">Review assignments</p>
          </button>
          <button onClick={() => navigate('/teacher/library')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Library</p>
            <p className="text-lg font-bold mt-2">Resources</p>
            <p className="text-sm text-[#6B7280]">Curate reading list</p>
          </button>
          <button onClick={() => navigate('/teacher/timetable')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Schedule</p>
            <p className="text-lg font-bold mt-2">Timetable</p>
            <p className="text-sm text-[#6B7280]">Check weekly plan</p>
          </button>
          <button onClick={() => navigate('/teacher/notices')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Notices</p>
            <p className="text-lg font-bold mt-2">Announcements</p>
            <p className="text-sm text-[#6B7280]">Campus updates</p>
          </button>
          <button onClick={() => navigate('/teacher/tasks')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Tasks</p>
            <p className="text-lg font-bold mt-2">Assignments</p>
            <p className="text-sm text-[#6B7280]">Publish and manage</p>
          </button>
          <button onClick={() => navigate('/teacher/users')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">People</p>
            <p className="text-lg font-bold mt-2">Manage Users</p>
            <p className="text-sm text-[#6B7280]">View assigned students</p>
          </button>
        </div>
      </Card>

      {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Filter Subjects</h3>
              <p className="text-sm text-gray-500 mt-1">Auto-selected if only one branch/semester assigned</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">All Branches</option>
                  {Array.from(new Set(user.assignedSubjects.map((s) => (typeof s.branchId === 'string' ? s.branchId : s.branchId?._id)))).filter(Boolean).map((id) => (
                    <option key={id} value={id}>
                      {resolveBranchName(id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Semester</label>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => setSelectedSemesterId(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">All Semesters</option>
                  {Array.from(new Set(user.assignedSubjects.map((s) => (typeof s.semesterId === 'string' ? s.semesterId : s.semesterId?._id)))).filter(Boolean).map((id) => (
                    <option key={id} value={id}>
                      {resolveSemesterName(id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Assigned Subjects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.assignedSubjects
              .filter((subject) => {
                const branchId = typeof subject.branchId === 'string' ? subject.branchId : subject.branchId?._id;
                return selectedBranchId ? branchId === selectedBranchId : true;
              })
              .filter((subject) => {
                const semesterId = typeof subject.semesterId === 'string' ? subject.semesterId : subject.semesterId?._id;
                return selectedSemesterId ? semesterId === selectedSemesterId : true;
              })
              .map((subject) => (
                <div key={subject._id || subject.id} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <svg className="w-5 h-5 text-[#194ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{subject.name}</p>
                      <p className="text-xs text-gray-500">{subject.code}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {resolveBranchName(subject.branchId)} • {resolveSemesterName(subject.semesterId)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate('/teacher/materials', { state: { subjectId: subject._id } })}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                    >
                      Manage Materials
                    </button>
                    <button
                      onClick={() => navigate(`/subjects/${subject._id}/materials`)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      Open Public View
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderBody = () => {
    if (role === 'admin') return renderAdmin();
    if (role === 'hod') return renderHod();
    return renderTeacher();
  };

  return (
    <RoleLayout
      title="Dashboard"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      {renderBody()}
    </RoleLayout>
  );
};

export default RoleDashboard;
