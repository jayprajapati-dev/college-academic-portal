import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, RoleLayout, StatsCard } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const MODE_ORDER = ['admin', 'coordinator', 'hod', 'teacher'];

const RoleDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const coordinatorBaseRole = ['teacher', 'hod'].includes(user?.coordinator?.baseRole)
    ? user.coordinator.baseRole
    : null;
  const coordinatorActive = Boolean(user?.coordinator?.branch) && user?.coordinator?.status !== 'expired';

  const modeSet = useMemo(() => {
    const set = new Set(role ? [role] : []);
    if (user?.adminAccess === true || role === 'admin') {
      set.add('admin');
    }
    if (['teacher', 'hod'].includes(role) && coordinatorActive) {
      set.add('coordinator');
    }
    if (role === 'coordinator' && coordinatorBaseRole) {
      set.add(coordinatorBaseRole);
    }
    return set;
  }, [coordinatorActive, coordinatorBaseRole, role, user?.adminAccess]);

  const availableModes = useMemo(() => MODE_ORDER.filter((mode) => modeSet.has(mode)), [modeSet]);

  const dashboardMode = useMemo(() => {
    const pathMode = availableModes.find((mode) => location.pathname.startsWith(`/${mode}`));
    return pathMode || role;
  }, [availableModes, location.pathname, role]);

  const { navItems, loading: navLoading } = useRoleNav(dashboardMode);

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
  const [notifications, setNotifications] = useState([]);
  const [syncStamp, setSyncStamp] = useState('');

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

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data.slice(0, 8));
      } else {
        setNotifications([]);
      }
    } catch (_) {
      setNotifications([]);
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

    fetchNotifications();
    setSyncStamp(new Date().toLocaleTimeString());
  }, [user, fetchAdminStats, fetchHodStats, fetchTeacherMeta, fetchNotifications]);

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
    if (dashboardMode === 'admin') return 'Admin Panel';
    if (dashboardMode === 'hod') return 'HOD Panel';
    if (dashboardMode === 'coordinator') return 'Coordinator Panel';
    return 'Teacher Panel';
  }, [dashboardMode]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !(item.isRead ?? item.read)).length,
    [notifications]
  );

  const adminPrimaryActions = useMemo(
    () => (navItems || [])
      .filter((item) => !['dashboard', 'profile'].includes(item.key))
      .slice(0, 6),
    [navItems]
  );

  const dashboardInsights = useMemo(() => {
    if (dashboardMode === 'admin') {
      return [
        { label: 'System Load', value: `${Math.min(99, 35 + adminStats.hods + adminStats.teachers)}%`, tone: 'text-indigo-600' },
        { label: 'Unread Alerts', value: unreadCount, tone: 'text-rose-600' },
        { label: 'Managed Modules', value: navItems.length, tone: 'text-emerald-600' }
      ];
    }

    if (dashboardMode === 'hod') {
      return [
        { label: 'Branch Capacity', value: hodStats.students, tone: 'text-cyan-600' },
        { label: 'Faculty Count', value: hodStats.teachers, tone: 'text-emerald-600' },
        { label: 'Unread Alerts', value: unreadCount, tone: 'text-rose-600' }
      ];
    }

    if (dashboardMode === 'coordinator') {
      return [
        { label: 'Tracked Semesters', value: Array.isArray(user?.coordinator?.semesters) ? user.coordinator.semesters.length : 0, tone: 'text-teal-600' },
        { label: 'Assigned Subjects', value: user?.assignedSubjects?.length || 0, tone: 'text-indigo-600' },
        { label: 'Unread Alerts', value: unreadCount, tone: 'text-rose-600' }
      ];
    }

    return [
      { label: 'My Subjects', value: teacherStats.subjects, tone: 'text-blue-600' },
      { label: 'Published', value: teacherStats.published, tone: 'text-emerald-600' },
      { label: 'Unread Alerts', value: unreadCount, tone: 'text-rose-600' }
    ];
  }, [adminStats.hods, adminStats.teachers, dashboardMode, hodStats.students, hodStats.teachers, navItems.length, teacherStats.published, teacherStats.subjects, unreadCount, user]);

  const renderOperationalPanel = () => (
    <Card title="Operational Snapshot" subtitle={`Live workflow signals${syncStamp ? ` • synced at ${syncStamp}` : ''}`}>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dashboardInsights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFB] p-4">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">{item.label}</p>
                <p className={`text-2xl font-black mt-1 ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-sm font-bold text-[#111827] mb-3">Quick Access</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(navItems || [])
                .filter((item) => item.key !== 'dashboard')
                .slice(0, 6)
                .map((item) => (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-left hover:bg-[#EEF2FF] transition"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-[#64748B]">{item.key}</p>
                    <p className="text-sm font-semibold text-[#0F172A] mt-0.5 truncate">{item.label}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EEF2F7] flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">Recent Activity Feed</p>
            <button
              onClick={() => navigate(`/${dashboardMode}/notices`)}
              className="text-xs font-semibold text-[#194ce6] hover:underline"
            >
              Open Notice Board
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748B]">No recent updates available.</div>
            ) : (
              notifications.slice(0, 6).map((item) => (
                <button
                  key={item._id}
                  onClick={() => navigate(item.actionUrl || item.link || `/${dashboardMode}/notices`)}
                  className="w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition"
                >
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{item.title || 'Notification'}</p>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.message || 'New update available'}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );

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
              Manage users, academics, and daily operations from one clean control center.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> System Online
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                {adminStats.totalUsers} active profiles
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                {adminStats.branches} branches • {adminStats.subjects} subjects
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard icon="group" title="Total Users" value={adminStats.totalUsers} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-700" />
        <StatsCard icon="school" title="Students" value={adminStats.students} bgColor="bg-gradient-to-br from-sky-500 to-blue-600" />
        <StatsCard icon="person" title="Teachers" value={adminStats.teachers} bgColor="bg-gradient-to-br from-emerald-500 to-green-600" />
        <StatsCard icon="supervisor_account" title="Department Heads" value={adminStats.hods} bgColor="bg-gradient-to-br from-purple-500 to-fuchsia-600" />
      </div>

      <Card title="Action Center" subtitle="Most-used workflows and what needs attention first">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {adminPrimaryActions.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="group rounded-2xl border border-[#E6E9EF] bg-white p-5 text-left hover:shadow-md transition"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">{item.key}</p>
              <p className="text-lg font-bold mt-2 text-[#111827]">{item.label}</p>
              <p className="text-sm text-[#6B7280]">Open and manage this module</p>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Recent Alerts" subtitle={`Latest updates${syncStamp ? ` • synced at ${syncStamp}` : ''}`}>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EEF2F7] flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">Notice Feed</p>
            <button
              onClick={() => navigate('/admin/notices')}
              className="text-xs font-semibold text-[#194ce6] hover:underline"
            >
              Open Notice Board
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748B]">No recent updates available.</div>
            ) : (
              notifications.slice(0, 8).map((item) => (
                <button
                  key={item._id}
                  onClick={() => navigate(item.actionUrl || item.link || '/admin/notices')}
                  className="w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition"
                >
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{item.title || 'Notification'}</p>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.message || 'New update available'}</p>
                </button>
              ))
            )}
          </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <StatsCard icon="group" title="Branch Teachers" value={hodStats.teachers} bgColor="bg-gradient-to-br from-sky-500 to-cyan-600" compact singleLine />
        <StatsCard icon="menu_book" title="Branch Content" value={hodStats.content} bgColor="bg-gradient-to-br from-violet-500 to-purple-600" compact singleLine />
        <StatsCard icon="school" title="Branch Students" value={hodStats.students} bgColor="bg-gradient-to-br from-emerald-500 to-green-600" compact singleLine />
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

      {renderOperationalPanel()}
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

  const renderTeacher = () => {
    const filteredSubjects = (user?.assignedSubjects || [])
      .filter((subject) => {
        const branchId = typeof subject.branchId === 'string' ? subject.branchId : subject.branchId?._id;
        return selectedBranchId ? branchId === selectedBranchId : true;
      })
      .filter((subject) => {
        const semesterId = typeof subject.semesterId === 'string' ? subject.semesterId : subject.semesterId?._id;
        return selectedSemesterId ? semesterId === selectedSemesterId : true;
      });

    return (
      <div className="space-y-4 md:space-y-5 font-display">
        <section className="rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#4338ca] to-[#7c3aed] text-white p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">Teaching Dashboard</p>
              <h2 className="text-xl md:text-2xl font-black mt-1">Welcome, {user?.name || 'Teacher'}</h2>
              <p className="text-xs md:text-sm text-indigo-100 mt-1">Simple view for classes, materials and tasks.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate(`/${dashboardMode === 'coordinator' ? 'coordinator' : 'teacher'}/materials`)} className="px-3.5 py-2 rounded-lg bg-white text-[#312e81] text-xs md:text-sm font-bold">
                Materials
              </button>
              <button onClick={() => navigate(`/${dashboardMode === 'coordinator' ? 'coordinator' : 'teacher'}/tasks`)} className="px-3.5 py-2 rounded-lg border border-white/40 text-xs md:text-sm font-bold">
                Tasks
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatsCard icon="draft" title="Draft" value={teacherStats.drafts} bgColor="bg-gradient-to-br from-amber-400 to-orange-500" compact singleLine />
          <StatsCard icon="verified" title="Published" value={teacherStats.published} bgColor="bg-gradient-to-br from-emerald-400 to-green-600" compact singleLine />
          <StatsCard icon="menu_book" title="Subjects" value={teacherStats.subjects} bgColor="bg-gradient-to-br from-blue-500 to-indigo-600" compact singleLine />
        </div>

        <Card title="Primary Actions" subtitle="Quick access">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => navigate(`/${dashboardMode === 'coordinator' ? 'coordinator' : 'teacher'}/subjects`)} className="rounded-xl border border-[#E6E9EF] bg-white p-3.5 text-left hover:shadow-md transition">
              <p className="text-xs uppercase tracking-[0.15em] text-[#6B7280]">Subjects</p>
              <p className="text-sm font-bold mt-1">My Subjects</p>
            </button>
            <button onClick={() => navigate(`/${dashboardMode === 'coordinator' ? 'coordinator' : 'teacher'}/timetable`)} className="rounded-xl border border-[#E6E9EF] bg-white p-3.5 text-left hover:shadow-md transition">
              <p className="text-xs uppercase tracking-[0.15em] text-[#6B7280]">Schedule</p>
              <p className="text-sm font-bold mt-1">Timetable</p>
            </button>
            <button onClick={() => navigate(`/${dashboardMode === 'coordinator' ? 'coordinator' : 'teacher'}/notices`)} className="rounded-xl border border-[#E6E9EF] bg-white p-3.5 text-left hover:shadow-md transition">
              <p className="text-xs uppercase tracking-[0.15em] text-[#6B7280]">Updates</p>
              <p className="text-sm font-bold mt-1">Notices</p>
            </button>
          </div>
        </Card>

        {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
          <Card title="Assigned Subjects" subtitle="Compact list">
            <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Branches</option>
                {Array.from(new Set(user.assignedSubjects.map((s) => (typeof s.branchId === 'string' ? s.branchId : s.branchId?._id)))).filter(Boolean).map((id) => (
                  <option key={id} value={id}>
                    {resolveBranchName(id)}
                  </option>
                ))}
              </select>
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Semesters</option>
                {Array.from(new Set(user.assignedSubjects.map((s) => (typeof s.semesterId === 'string' ? s.semesterId : s.semesterId?._id)))).filter(Boolean).map((id) => (
                  <option key={id} value={id}>
                    {resolveSemesterName(id)}
                  </option>
                ))}
              </select>
            </div>

            {filteredSubjects.length === 0 ? (
              <p className="text-sm text-gray-500">No subjects found for current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-600">Subject</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-600">Branch</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-600">Semester</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubjects.map((subject) => (
                      <tr key={subject._id || subject.id}>
                        <td className="px-3 py-2.5">
                          <p className="text-sm font-semibold text-gray-800">{subject.name}</p>
                          <p className="text-xs text-gray-500">{subject.code}</p>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">{resolveBranchName(subject.branchId)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">{resolveSemesterName(subject.semesterId)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate('/teacher/materials', { state: { subjectId: subject._id } })}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => navigate(`/subjects/${subject._id}/materials`)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  const renderCoordinator = () => (
    <div className="space-y-8 font-display">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d91] via-[#14532d] to-[#0f766e] text-white p-8 md:p-10">
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">Coordinator Desk</p>
            <h2 className="text-3xl md:text-4xl font-black">Welcome, {user?.name || 'Coordinator'}</h2>
            <p className="text-sm md:text-base text-emerald-50 mt-2">
              Branch: {user?.coordinator?.branch?.name || 'N/A'} • Semesters: {Array.isArray(user?.coordinator?.semesters) ? user.coordinator.semesters.length : 0}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/coordinator/tasks')}
              className="px-5 py-3 rounded-2xl bg-white text-[#0f766e] text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              Manage Tasks
            </button>
          </div>
        </div>
      </section>

      <Card title="Coordinator Actions" subtitle="Class-level updates and tracking">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={() => navigate('/coordinator/tasks')} className="group rounded-xl border border-[#E6E9EF] bg-white p-4 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Tasks</p>
            <p className="text-base font-bold mt-1.5">Assignments</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Create and track tasks</p>
          </button>
          <button onClick={() => navigate('/coordinator/notices')} className="group rounded-xl border border-[#E6E9EF] bg-white p-4 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Notices</p>
            <p className="text-base font-bold mt-1.5">Announcements</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Share updates</p>
          </button>
          <button onClick={() => navigate('/coordinator/projects')} className="group rounded-xl border border-[#E6E9EF] bg-white p-4 text-left hover:shadow-md transition">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Projects</p>
            <p className="text-base font-bold mt-1.5">Project Tracking</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Monitor submissions</p>
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard icon="school" title="Tracked Semesters" value={Array.isArray(user?.coordinator?.semesters) ? user.coordinator.semesters.length : 0} bgColor="bg-gradient-to-br from-teal-500 to-emerald-600" />
        <StatsCard icon="menu_book" title="Assigned Subjects" value={user?.assignedSubjects?.length || 0} bgColor="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatsCard icon="notifications" title="Unread Alerts" value={unreadCount} bgColor="bg-gradient-to-br from-rose-500 to-pink-600" />
      </div>

      {renderOperationalPanel()}
    </div>
  );

  const renderBody = () => {
    if (dashboardMode === 'admin') return renderAdmin();
    if (dashboardMode === 'hod') return renderHod();
    if (dashboardMode === 'coordinator') return renderCoordinator();
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
      profileLinks={dashboardMode === 'admin' ? [] : [{ label: 'Profile', to: `/${dashboardMode}/profile` }]}
    >
      {renderBody()}
    </RoleLayout>
  );
};

export default RoleDashboard;
