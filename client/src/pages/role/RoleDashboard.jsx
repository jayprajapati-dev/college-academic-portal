import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, RoleLayout, StatsCard } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';
import useActiveBranch from '../../hooks/useActiveBranch';

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

  // Active branch for multi-branch HODs
  const { activeBranchId, activeBranchName } = useActiveBranch();

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

  const fetchHodStats = useCallback(async (branchId) => {
    try {
      const token = localStorage.getItem('token');
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
      fetchHodStats(activeBranchId);
    }

    if (user.role === 'teacher') {
      fetchTeacherMeta();
    }

    fetchNotifications();
    setSyncStamp(new Date().toLocaleTimeString());
  }, [user, activeBranchId, fetchAdminStats, fetchHodStats, fetchTeacherMeta, fetchNotifications]);

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

  const renderAdmin = () => {
    const adminOverview = [
      {
        icon: 'group',
        label: 'Total Users',
        value: adminStats.totalUsers,
        note: 'Profiles under management',
        shell: 'from-[#082f49] via-[#0369a1] to-[#0ea5e9]'
      },
      {
        icon: 'school',
        label: 'Students',
        value: adminStats.students,
        note: 'Enrolled students',
        shell: 'from-[#14532d] via-[#16a34a] to-[#4ade80]'
      },
      {
        icon: 'person',
        label: 'Teachers',
        value: adminStats.teachers,
        note: 'Faculty accounts',
        shell: 'from-[#3b0764] via-[#7c3aed] to-[#c084fc]'
      },
      {
        icon: 'hub',
        label: 'Academic Units',
        value: `${adminStats.branches}/${adminStats.subjects}`,
        note: 'Branches and subjects',
        shell: 'from-[#7f1d1d] via-[#dc2626] to-[#fb7185]'
      }
    ];

    return (
      <div className="space-y-5 md:space-y-8 font-display">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#bfdbfe] bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.35),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#0b3954_34%,#0369a1_68%,#0f766e_100%)] px-4 py-5 text-white shadow-[0_30px_90px_rgba(15,23,42,0.34)] sm:px-6 sm:py-7 md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05)_65%,transparent)]" />
          <div className="absolute -left-10 top-10 h-36 w-36 rounded-full bg-[#67e8f9]/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-52 w-52 translate-x-12 -translate-y-10 rounded-full bg-[#86efac]/20 blur-3xl" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.95fr] xl:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-50 shadow-[0_12px_28px_rgba(3,105,161,0.25)] backdrop-blur-md">
                Administration Command Deck
              </div>

              <div className="space-y-3">
                <h2 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl md:text-5xl">
                  Control center for campus operations
                </h2>
                <p className="hidden sm:block max-w-2xl text-sm leading-6 text-cyan-50/90 md:text-base">
                  Welcome, {user?.name || 'Administrator'}. Manage users, academics, and system-wide workflow from one aligned dashboard.
                </p>
                <p className="sm:hidden text-xs text-cyan-50/85">
                  Welcome, {user?.name || 'Administrator'}. System control at a glance.
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] font-semibold text-white/90 sm:flex-wrap sm:gap-3 sm:text-xs">
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 shadow-[0_10px_24px_rgba(2,132,199,0.2)] backdrop-blur-md">
                  {adminStats.totalUsers} active profiles
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 shadow-[0_10px_24px_rgba(2,132,199,0.2)] backdrop-blur-md">
                  {adminStats.branches} branches mapped
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 shadow-[0_10px_24px_rgba(2,132,199,0.2)] backdrop-blur-md">
                  {unreadCount} unread alerts
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#0f766e] shadow-[0_18px_40px_rgba(7,89,133,0.25)] transition duration-200 hover:-translate-y-1"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => navigate('/admin/academic-structure')}
                  className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-black text-white shadow-[0_18px_40px_rgba(4,28,50,0.2)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-white/15"
                >
                  Academic Structure
                </button>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur-xl md:p-5">
              <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-100/80">System Snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Students</p>
                  <p className="mt-1 text-2xl font-black leading-none">{adminStats.students}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Teachers</p>
                  <p className="mt-1 text-2xl font-black leading-none">{adminStats.teachers}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">HODs</p>
                  <p className="mt-1 text-2xl font-black leading-none">{adminStats.hods}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Alerts</p>
                  <p className="mt-1 text-2xl font-black leading-none">{unreadCount}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-4">
          {adminOverview.map((item) => (
            <div key={item.label} className="rounded-[1.25rem] border border-white/40 bg-white p-[3px] shadow-[0_16px_36px_rgba(15,23,42,0.08)] sm:rounded-[1.5rem] sm:p-1">
              <div className={`rounded-[1.1rem] bg-gradient-to-br ${item.shell} p-3 text-white sm:rounded-[1.3rem] sm:p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 sm:text-[11px] sm:tracking-[0.22em]">{item.label}</p>
                    <p className="mt-1.5 text-2xl font-black leading-none sm:mt-2 sm:text-3xl">{item.value}</p>
                  </div>
                  <span className="material-symbols-outlined rounded-lg bg-white/15 p-2 text-[18px] sm:rounded-xl sm:p-2.5 sm:text-[22px]">{item.icon}</span>
                </div>
                <p className="mt-2.5 rounded-lg border border-white/15 bg-black/10 px-2.5 py-1.5 text-[10px] text-white/85 sm:mt-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">{item.note}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-[1.5rem] border border-[#dbeafe] bg-[linear-gradient(180deg,#f8fdff_0%,#eefbf8_100%)] p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#0f766e] sm:text-xs sm:tracking-[0.3em]">Action Modules</p>
              <h3 className="mt-1 text-base font-black text-[#0f172a] sm:mt-2 sm:text-xl md:text-2xl">Priority administration workflows</h3>
              <p className="mt-0.5 hidden text-xs text-[#475569] sm:mt-1 sm:block sm:text-sm">Use quick modules to handle user and academic operations without context switching.</p>
            </div>
            <div className="shrink-0 rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#0369a1] shadow-sm sm:px-4 sm:py-2 sm:text-xs">
              {adminPrimaryActions.length} modules ready
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-3">
            {adminPrimaryActions.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="group rounded-[1rem] border border-[#dbeafe] bg-white px-3 py-3 text-left shadow-[0_8px_20px_rgba(14,165,233,0.10)] transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.25rem] sm:px-4 sm:py-4 sm:shadow-[0_14px_28px_rgba(14,165,233,0.12)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b] sm:text-[11px] sm:tracking-[0.22em]">{item.key}</p>
                <p className="mt-1.5 text-sm font-black text-[#0f172a] line-clamp-1 sm:mt-2 sm:text-base">{item.label}</p>
                <p className="mt-0.5 text-[10px] text-[#64748b] line-clamp-1 sm:mt-1 sm:text-xs sm:line-clamp-2">Open module and manage records</p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f766e] sm:mt-3 sm:text-[11px] sm:tracking-[0.16em]">
                  <span>Open</span>
                  <span className="transition duration-200 group-hover:translate-x-1">Go</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#e9d5ff] bg-[linear-gradient(180deg,#ffffff_0%,#faf5ff_100%)] shadow-[0_22px_50px_rgba(124,58,237,0.1)] sm:rounded-[2rem]">
          <div className="border-b border-[#f3e8ff] px-3.5 py-3 sm:px-4 sm:py-4 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7c3aed] sm:text-xs sm:tracking-[0.28em]">Recent Activity</p>
                <h3 className="mt-1 text-base font-black text-[#111827] sm:mt-2 sm:text-xl md:text-2xl">System update stream</h3>
                <p className="mt-0.5 truncate text-[10px] text-[#6b7280] sm:mt-1 sm:text-xs md:text-sm">
                  Latest updates{syncStamp ? ` • synced at ${syncStamp}` : ''}
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/notices')}
                className="shrink-0 rounded-full border border-[#ddd6fe] bg-white px-3 py-1.5 text-[10px] font-bold text-[#6d28d9] shadow-sm sm:px-4 sm:py-2 sm:text-xs"
              >
                <span className="sm:hidden">Notices</span>
                <span className="hidden sm:inline">Open Notice Board</span>
              </button>
            </div>
          </div>

          <div className="max-h-[22rem] overflow-y-auto px-3.5 py-3 sm:max-h-[26rem] sm:px-4 sm:py-4 md:px-5">
            {notifications.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[#d8b4fe] bg-white/75 px-4 py-7 text-center text-xs text-[#6b7280] sm:rounded-[1.2rem] sm:py-9 sm:text-sm">
                No recent updates available.
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {notifications.slice(0, 8).map((item) => (
                  <button
                    key={item._id}
                    onClick={() => navigate(item.actionUrl || item.link || '/admin/notices')}
                    className="w-full rounded-[1rem] border border-[#ede9fe] bg-white px-3 py-2.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.2rem] sm:px-4 sm:py-3 sm:shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
                  >
                    <p className="text-xs font-black text-[#111827] truncate sm:text-sm">{item.title || 'Notification'}</p>
                    <p className="mt-0.5 text-[10px] text-[#6b7280] line-clamp-1 sm:mt-1 sm:text-xs sm:line-clamp-2">{item.message || 'New update available'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderHod = () => {
    const hodActions = [
      {
        eyebrow: 'Faculty Core',
        title: 'Manage Teachers',
        description: 'Review branch faculty, onboarding status, and teaching coverage.',
        tone: 'from-[#0f766e] to-[#14b8a6]',
        accent: 'bg-[#d1fae5]',
        action: () => navigate('/hod/manage-teachers')
      },
      {
        eyebrow: 'Faculty Add',
        title: 'Add Teacher',
        description: 'Create a new teacher account and align branch ownership fast.',
        tone: 'from-[#0284c7] to-[#38bdf8]',
        accent: 'bg-[#dbeafe]',
        action: () => navigate('/hod/add-teacher')
      },
      {
        eyebrow: 'Learning Content',
        title: 'Materials',
        description: 'Track branch resources and keep material flow current.',
        tone: 'from-[#7c3aed] to-[#c084fc]',
        accent: 'bg-[#ede9fe]',
        action: () => navigate('/hod/materials')
      },
      {
        eyebrow: 'Scheduling',
        title: 'Timetable',
        description: 'Oversee weekly routine and spot timetable gaps quickly.',
        tone: 'from-[#f97316] to-[#fb923c]',
        accent: 'bg-[#ffedd5]',
        action: () => navigate('/hod/timetable')
      },
      ...(user?.assignedSubjects?.length > 0
        ? [{
          eyebrow: 'Assignments',
          title: 'Tasks',
          description: 'Monitor deliverables, submissions, and pending academic work.',
          tone: 'from-[#ec4899] to-[#f472b6]',
          accent: 'bg-[#fce7f3]',
          action: () => navigate('/hod/tasks')
        }]
        : []),
      {
        eyebrow: 'Resource Wing',
        title: 'Reading Room',
        description: 'Curate reference material and strengthen branch learning assets.',
        tone: 'from-[#0f172a] to-[#334155]',
        accent: 'bg-[#e2e8f0]',
        action: () => navigate('/hod/library')
      },
      {
        eyebrow: 'Announcements',
        title: 'Notice Board',
        description: 'Publish branch-wide updates and keep everyone aligned.',
        tone: 'from-[#dc2626] to-[#fb7185]',
        accent: 'bg-[#ffe4e6]',
        action: () => navigate('/hod/notices')
      },
      {
        eyebrow: 'Analytics',
        title: 'View Reports',
        description: 'Open branch reports and inspect performance patterns.',
        tone: 'from-[#4338ca] to-[#6366f1]',
        accent: 'bg-[#e0e7ff]',
        action: () => navigate('/hod/reports')
      }
    ];
    const hodPulseMetrics = [
      {
        label: 'Branch Capacity',
        value: hodStats.students,
        caption: 'Student load',
        surface: 'from-[#0f766e] to-[#14b8a6]'
      },
      {
        label: 'Faculty Count',
        value: hodStats.teachers,
        caption: 'Active faculty',
        surface: 'from-[#0284c7] to-[#38bdf8]'
      },
      {
        label: 'Unread Alerts',
        value: unreadCount,
        caption: 'Need review',
        surface: 'from-[#7c3aed] to-[#c084fc]'
      }
    ];

    return (
      <div className="space-y-5 md:space-y-8 font-display">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#cffafe] bg-[radial-gradient(circle_at_top_left,_rgba(153,246,228,0.32),_transparent_28%),linear-gradient(135deg,#041c32_0%,#0b3954_30%,#116466_62%,#16a34a_100%)] px-4 py-5 text-white shadow-[0_30px_90px_rgba(4,28,50,0.32)] sm:px-6 sm:py-7 md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05)_65%,transparent)]" />
          <div className="absolute -left-10 top-10 h-36 w-36 rounded-full bg-[#67e8f9]/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-52 w-52 translate-x-12 -translate-y-10 rounded-full bg-[#86efac]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-48 translate-y-10 rounded-full bg-black/25 blur-2xl" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-50 shadow-[0_12px_28px_rgba(15,118,110,0.22)] backdrop-blur-md sm:px-4 sm:text-[11px]">
                Department Command Deck
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl md:text-5xl">
                  Control view for {activeBranchName || user?.branch?.name || 'your branch'}
                </h2>
                <p className="hidden sm:block max-w-2xl text-sm leading-6 text-cyan-50/90 md:text-base">
                  Welcome, {user?.name || 'HOD'}. Track faculty strength, content readiness, student load, and branch activity from one clean dashboard surface.
                </p>
                <p className="sm:hidden text-xs text-cyan-50/85">
                  Welcome, {user?.name || 'HOD'}. Branch operations at a glance.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 text-[11px] font-semibold text-white/90 sm:overflow-visible sm:gap-3 sm:text-xs">
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 shadow-[0_10px_24px_rgba(15,118,110,0.16)] backdrop-blur-md">
                  Branch: {activeBranchName || user?.branch?.name || 'N/A'}
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 shadow-[0_10px_24px_rgba(15,118,110,0.16)] backdrop-blur-md">
                  {hodStats.teachers} teachers active
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 shadow-[0_10px_24px_rgba(15,118,110,0.16)] backdrop-blur-md">
                  {unreadCount} unread alerts
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 sm:gap-2.5">
                <button
                  onClick={() => navigate('/hod/manage-teachers')}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-[#0f766e] shadow-[0_18px_40px_rgba(7,89,133,0.25)] transition duration-200 hover:-translate-y-1 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Manage Teachers
                </button>
                <button
                  onClick={() => navigate('/hod/reports')}
                  className="rounded-2xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-black text-white shadow-[0_18px_40px_rgba(4,28,50,0.2)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-white/15 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  View Reports
                </button>
              </div>
            </div>

            {/* Mobile Quick Branch Snapshot */}
            <div className="lg:hidden rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-100/80">Quick Branch Snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Teachers</p>
                  <p className="mt-1 text-2xl font-black">{hodStats.teachers}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Students</p>
                  <p className="mt-1 text-2xl font-black">{hodStats.students}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Content</p>
                  <p className="mt-1 text-2xl font-black">{hodStats.content}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Alerts</p>
                  <p className="mt-1 text-2xl font-black">{unreadCount}</p>
                </div>
              </div>
            </div>

            {/* Desktop Stats Cards */}
            <div className="hidden lg:grid gap-4 xl:grid-cols-1">
              <div className="rounded-[1.9rem] border border-white/15 bg-white/10 p-5 shadow-[0_22px_55px_rgba(8,47,73,0.24)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/80">Signal Grid</p>
                    <p className="mt-2 text-xl font-black">Branch systems</p>
                    <p className="mt-1 text-sm text-cyan-50/75">A quick look at teacher, content, and student coverage.</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left sm:text-right backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">Content Units</p>
                    <p className="mt-1 text-3xl font-black leading-none">{hodStats.content}</p>
                    <p className="mt-2 text-xs text-white/65">Subjects and content mapped to the branch.</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.35rem] border border-white/12 bg-[#ecfeff]/10 p-4">
                    <p className="text-xs text-cyan-100/75">Teachers</p>
                    <p className="mt-2 text-4xl font-black leading-none text-white">{hodStats.teachers}</p>
                    <p className="mt-2 text-xs text-cyan-100/65">Faculty mapped</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/12 bg-[#f5f3ff]/10 p-4">
                    <p className="text-xs text-cyan-100/75">Students</p>
                    <p className="mt-2 text-4xl font-black leading-none text-white">{hodStats.students}</p>
                    <p className="mt-2 text-xs text-cyan-100/65">Branch strength</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-white/12 bg-black/12 px-4 py-4">
                  <p className="text-xs text-cyan-100/75">Operational balance</p>
                  <p className="mt-1 text-base font-black text-white">Keep faculty, content, and student flow aligned.</p>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-white/15 bg-white/10 p-5 shadow-[0_22px_55px_rgba(4,28,50,0.24)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-100/80">Branch Pulse</p>
                    <p className="mt-2 text-xl font-black">Operational focus</p>
                    <p className="mt-1 text-sm text-emerald-50/75">Core branch indicators that need your attention.</p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-left sm:text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">Unread Alerts</p>
                    <p className="mt-1 text-3xl font-black leading-none text-white">{unreadCount}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {hodPulseMetrics.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.35rem] border border-white/12 bg-black/10 p-4"
                    >
                      <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${item.surface}`} />
                      <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/65">{item.label}</p>
                      <p className="mt-2 text-3xl font-black leading-none text-white">{item.value}</p>
                      <p className="mt-2 text-xs text-white/65">{item.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="hidden md:grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: 'group',
              title: 'Branch Teachers',
              value: hodStats.teachers,
              note: 'Faculty mapped to this branch',
              shell: 'from-[#082f49] via-[#0369a1] to-[#0ea5e9]',
              glow: 'shadow-[0_24px_50px_rgba(3,105,161,0.28)]'
            },
            {
              icon: 'menu_book',
              title: 'Branch Content',
              value: hodStats.content,
              note: 'Subjects and content units visible',
              shell: 'from-[#3b0764] via-[#7c3aed] to-[#c084fc]',
              glow: 'shadow-[0_24px_50px_rgba(124,58,237,0.28)]'
            },
            {
              icon: 'school',
              title: 'Branch Students',
              value: hodStats.students,
              note: 'Student strength under active branch',
              shell: 'from-[#14532d] via-[#16a34a] to-[#4ade80]',
              glow: 'shadow-[0_24px_50px_rgba(22,163,74,0.28)]'
            }
          ].map((item) => (
            <div
              key={item.title}
              className={`group relative rounded-[1.8rem] border border-white/40 bg-white p-1 ${item.glow} transition duration-300 hover:-translate-y-1`}
            >
              <div className={`rounded-[1.5rem] bg-gradient-to-br ${item.shell} p-5 text-white`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">{item.title}</p>
                    <p className="mt-3 text-4xl font-black leading-none">{item.value}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                    <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl border border-white/15 bg-black/10 px-3 py-3 text-sm text-white/85 backdrop-blur-sm">
                  {item.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="md:hidden rounded-[1.6rem] border border-[#dbeafe] bg-[linear-gradient(180deg,#f8fdff_0%,#eefbf8_100%)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Quick Actions</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {hodActions.slice(0, 6).map((item) => (
              <button
                key={`mobile-${item.title}`}
                onClick={item.action}
                className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2.5 text-left shadow-sm"
              >
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#64748b]">{item.eyebrow}</p>
                <p className="mt-1 text-sm font-black text-[#0f172a] truncate">{item.title}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="hidden md:block rounded-[2rem] border border-[#dbeafe] bg-[linear-gradient(180deg,#f8fdff_0%,#eefbf8_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0f766e]">Action Modules</p>
              <h3 className="mt-2 text-2xl font-black text-[#0f172a]">Depth-based branch workflows</h3>
              <p className="mt-1 text-sm text-[#475569]">Every primary HOD task remains here, redesigned as layered interaction cards.</p>
            </div>
            <div className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-xs font-semibold text-[#0369a1] shadow-sm">
              {hodActions.length} modules ready
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {hodActions.map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="group relative overflow-hidden rounded-[1.7rem] border border-[#dbeafe] bg-white p-5 text-left shadow-[0_22px_50px_rgba(14,165,233,0.12)] transition duration-300 hover:-translate-y-1.5"
              >
                <div className={`absolute inset-x-4 top-0 h-1.5 rounded-b-full bg-gradient-to-r ${item.tone}`} />
                <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${item.accent} opacity-80 blur-2xl transition duration-300 group-hover:scale-125`} />
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#64748b]">{item.eyebrow}</p>
                  <h4 className="mt-3 text-xl font-black text-[#0f172a]">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#475569]">{item.description}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full border border-[#dbeafe] bg-[#f8fafc] px-3 py-1 text-xs font-bold text-[#0369a1]">
                      Open module
                    </span>
                    <span className="material-symbols-outlined text-[#0f766e] transition duration-300 group-hover:translate-x-1">arrow_forward</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="md:hidden rounded-[1.6rem] border border-[#e9d5ff] bg-[linear-gradient(180deg,#ffffff_0%,#faf5ff_100%)] p-4 shadow-[0_16px_34px_rgba(124,58,237,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7c3aed]">Recent Activity</p>
              <p className="mt-1 text-sm font-black text-[#111827]">Latest updates</p>
            </div>
            <button
              onClick={() => navigate('/hod/notices')}
              className="rounded-full border border-[#ddd6fe] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6d28d9]"
            >
              Open
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {notifications.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#d8b4fe] bg-white/70 px-3 py-4 text-center text-xs text-[#6b7280]">
                No recent updates available.
              </p>
            ) : (
              notifications.slice(0, 3).map((item) => (
                <button
                  key={`mobile-feed-${item._id}`}
                  onClick={() => navigate(item.actionUrl || item.link || '/hod/notices')}
                  className="w-full rounded-xl border border-[#ede9fe] bg-white px-3 py-3 text-left"
                >
                  <p className="text-xs font-black text-[#111827] truncate">{item.title || 'Notification'}</p>
                  <p className="mt-1 text-[11px] text-[#6b7280] line-clamp-2">{item.message || 'New update available'}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="hidden md:grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-[#d9f99d] bg-[linear-gradient(180deg,#f7fee7_0%,#ecfccb_100%)] p-5 shadow-[0_24px_60px_rgba(101,163,13,0.14)] md:p-6">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/40 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#3f6212]">Operational Snapshot</p>
                  <h3 className="mt-2 text-2xl font-black text-[#1f2937]">Branch pulse and quick access</h3>
                  <p className="mt-1 text-sm text-[#4b5563]">Live workflow signals{syncStamp ? ` • synced at ${syncStamp}` : ''}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280]">Unread</p>
                  <p className="mt-1 text-3xl font-black text-[#0f172a]">{unreadCount}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {dashboardInsights.map((item, index) => (
                  <div
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.07)] backdrop-blur-sm"
                    style={{ transform: `rotateY(${index === 1 ? '0deg' : index === 0 ? '-3deg' : '3deg'})` }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#64748b]">{item.label}</p>
                    <p className={`mt-2 text-3xl font-black ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {hodActions.slice(0, 6).map((item) => (
                  <button
                    key={`quick-${item.title}`}
                    onClick={item.action}
                    className="rounded-[1.3rem] border border-white/70 bg-white/80 px-4 py-3 text-left shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#64748b]">{item.eyebrow}</p>
                    <p className="mt-1 text-sm font-black text-[#0f172a]">{item.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-[#e9d5ff] bg-[linear-gradient(180deg,#ffffff_0%,#faf5ff_100%)] shadow-[0_24px_60px_rgba(124,58,237,0.12)]">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#e9d5ff]/60 blur-3xl" />
            <div className="relative border-b border-[#f3e8ff] px-5 py-4 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7c3aed]">Recent Activity</p>
                  <h3 className="mt-2 text-2xl font-black text-[#111827]">Branch update stream</h3>
                </div>
                <button
                  onClick={() => navigate('/hod/notices')}
                  className="rounded-full border border-[#ddd6fe] bg-white px-4 py-2 text-xs font-bold text-[#6d28d9] shadow-sm"
                >
                  Open Notice Board
                </button>
              </div>
            </div>

            <div className="max-h-[30rem] overflow-y-auto px-4 py-4 md:px-5">
              {notifications.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-[#d8b4fe] bg-white/70 px-4 py-10 text-center text-sm text-[#6b7280]">
                  No recent updates available.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 6).map((item, index) => (
                    <button
                      key={item._id}
                      onClick={() => navigate(item.actionUrl || item.link || '/hod/notices')}
                      className="group w-full rounded-[1.4rem] border border-[#ede9fe] bg-white/85 px-4 py-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5"
                      style={{ transform: `rotateY(${index % 2 === 0 ? '-2deg' : '2deg'})` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[#111827] truncate">{item.title || 'Notification'}</p>
                          <p className="mt-1 text-xs leading-5 text-[#6b7280] line-clamp-2">{item.message || 'New update available'}</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-2.5 w-2.5 rounded-full ${item.isRead ?? item.read ? 'bg-slate-300' : 'bg-rose-500'}`} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c3aed]">
                        <span>{item.type || 'Alert'}</span>
                        <span className="transition duration-200 group-hover:translate-x-1">Open</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

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
    const teacherBasePath = dashboardMode === 'coordinator' ? 'coordinator' : 'teacher';

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
      <div className="space-y-4 md:space-y-6 font-display">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#ddd6fe] bg-[radial-gradient(circle_at_top_left,_rgba(216,180,254,0.32),_transparent_28%),linear-gradient(135deg,#1e1b4b_0%,#312e81_32%,#4338ca_68%,#7c3aed_100%)] px-4 py-5 text-white shadow-[0_30px_90px_rgba(49,46,129,0.34)] sm:px-6 sm:py-7 md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05)_65%,transparent)]" />
          <div className="absolute -left-10 top-10 h-36 w-36 rounded-full bg-[#a78bfa]/25 blur-3xl" />
          <div className="absolute right-0 top-0 h-52 w-52 translate-x-12 -translate-y-10 rounded-full bg-[#c4b5fd]/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-48 translate-y-10 rounded-full bg-black/25 blur-2xl" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.95fr] xl:items-center">
            <div className="space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.32em] text-indigo-100 shadow-[0_12px_28px_rgba(76,29,149,0.26)] backdrop-blur-md">
                Teaching Command Deck
              </div>

              <div className="space-y-2.5">
                <h2 className="max-w-2xl text-xl font-black tracking-tight sm:text-3xl md:text-5xl">
                  Daily classroom control view
                </h2>
                <p className="hidden sm:block max-w-2xl text-sm leading-6 text-indigo-100/90 md:text-base">
                  Welcome, {user?.name || 'Teacher'}. Keep subjects, materials, and tasks aligned in one responsive workspace.
                </p>
                <p className="text-xs text-indigo-100/85 sm:hidden">
                  Welcome, {user?.name || 'Teacher'}. Subjects, tasks, and updates together.
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-0.5 text-[10px] font-semibold text-white/90 sm:flex-wrap sm:gap-3 sm:text-[11px]">
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  {teacherStats.subjects} subjects
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  {teacherStats.published} published
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  {unreadCount} alerts
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate(`/${teacherBasePath}/materials`)}
                  className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#4338ca] shadow-[0_18px_40px_rgba(67,56,202,0.25)] transition duration-200 hover:-translate-y-1"
                >
                  Manage Materials
                </button>
                <button
                  onClick={() => navigate(`/${teacherBasePath}/tasks`)}
                  className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-black text-white backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-white/15"
                >
                  Open Tasks
                </button>
              </div>
            </div>

            <div className="hidden xl:block rounded-[1.6rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.26em] text-indigo-100/80">Teacher Snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Drafts</p>
                  <p className="mt-1 text-2xl font-black leading-none">{teacherStats.drafts}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Published</p>
                  <p className="mt-1 text-2xl font-black leading-none">{teacherStats.published}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Subjects</p>
                  <p className="mt-1 text-2xl font-black leading-none">{teacherStats.subjects}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Alerts</p>
                  <p className="mt-1 text-2xl font-black leading-none">{unreadCount}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-4">
          {[
            { label: 'Draft Materials', value: teacherStats.drafts, icon: '📝', shell: 'from-[#92400e] via-[#d97706] to-[#fbbf24]', note: 'Unpublished content' },
            { label: 'Published Items', value: teacherStats.published, icon: '✅', shell: 'from-[#14532d] via-[#16a34a] to-[#4ade80]', note: 'Live study content' },
            { label: 'My Subjects', value: teacherStats.subjects, icon: '📚', shell: 'from-[#1e3a5f] via-[#1d4ed8] to-[#60a5fa]', note: 'Assigned this term' },
            { label: 'Unread Alerts', value: unreadCount, icon: '🔔', shell: 'from-[#4c0519] via-[#be123c] to-[#fb7185]', note: 'Notifications pending' },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.25rem] border border-white/40 bg-white p-[3px] shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-0.5 sm:rounded-[1.5rem] sm:p-1">
              <div className={`rounded-[1.1rem] bg-gradient-to-br ${item.shell} p-3 text-white sm:rounded-[1.3rem] sm:p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 sm:text-[11px]">{item.label}</p>
                    <p className="mt-1.5 text-2xl font-black leading-none sm:mt-2 sm:text-3xl">{item.value}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white/15 p-2 text-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:rounded-xl sm:p-2.5 sm:text-[22px]">{item.icon}</span>
                </div>
                <div className="mt-2.5 rounded-xl border border-white/15 bg-black/10 px-2.5 py-1.5 text-[10px] text-white/80 backdrop-blur-sm sm:mt-4 sm:px-3 sm:py-2 sm:text-xs">
                  {item.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-[1.5rem] border border-[#ddd6fe] bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)] p-3.5 shadow-[0_18px_40px_rgba(91,33,182,0.09)] sm:rounded-[2rem] sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6d28d9] sm:text-xs">Quick Modules</p>
              <h3 className="mt-1 text-base font-black text-[#0f172a] sm:mt-2 sm:text-xl md:text-2xl">Teaching workflows</h3>
            </div>
            <p className="hidden shrink-0 text-xs text-[#475569] sm:block">All core teacher tools</p>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-3">
            {[
              { key: 'Content', label: 'My Materials', to: `/${teacherBasePath}/materials` },
              { key: 'Subjects', label: 'My Subjects', to: `/${teacherBasePath}/subjects` },
              { key: 'Assignments', label: 'Tasks', to: `/${teacherBasePath}/tasks` },
              { key: 'Schedule', label: 'Timetable', to: `/${teacherBasePath}/timetable` },
              { key: 'Notices', label: 'Notice Board', to: `/${teacherBasePath}/notices` },
              { key: 'Library', label: 'Reading Room', to: `/${teacherBasePath}/library` },
            ].map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="group rounded-[1rem] border border-[#ede9fe] bg-white px-3 py-3 text-left shadow-[0_8px_20px_rgba(91,33,182,0.08)] transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.25rem] sm:px-4 sm:py-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b] sm:text-[11px] sm:tracking-[0.22em]">{item.key}</p>
                <p className="mt-1.5 text-sm font-black text-[#0f172a] line-clamp-1 sm:mt-2 sm:text-base">{item.label}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d28d9] sm:mt-3 sm:text-[11px]">
                  <span>Open</span>
                  <span className="transition duration-200 group-hover:translate-x-1">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#ddd6fe] bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)] shadow-[0_22px_50px_rgba(91,33,182,0.1)] sm:rounded-[2rem]">
          <div className="border-b border-[#ede9fe] px-3.5 py-3 sm:px-4 sm:py-4 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d28d9] sm:text-xs">Recent Activity</p>
                <h3 className="mt-1 text-base font-black text-[#111827] sm:mt-2 sm:text-xl md:text-2xl">Update stream</h3>
                <p className="mt-0.5 truncate text-[10px] text-[#6b7280] sm:mt-1 sm:text-xs">
                  Latest updates{syncStamp ? ` • synced at ${syncStamp}` : ''}
                </p>
              </div>
              <button
                onClick={() => navigate(`/${teacherBasePath}/notices`)}
                className="shrink-0 rounded-full border border-[#ddd6fe] bg-white px-3 py-1.5 text-[10px] font-bold text-[#6d28d9] shadow-sm sm:px-4 sm:py-2 sm:text-xs"
              >
                <span className="sm:hidden">Notices</span>
                <span className="hidden sm:inline">Open Notices</span>
              </button>
            </div>
          </div>
          <div className="max-h-[20rem] overflow-y-auto px-3.5 py-3 sm:max-h-[24rem] sm:px-4 sm:py-4 md:px-5">
            {notifications.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[#ddd6fe] bg-white/75 px-4 py-7 text-center text-xs text-[#6b7280] sm:rounded-[1.2rem] sm:py-9 sm:text-sm">
                No recent updates available.
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                {notifications.slice(0, 8).map((item) => (
                  <button
                    key={item._id}
                    onClick={() => navigate(item.actionUrl || item.link || `/${teacherBasePath}/notices`)}
                    className="w-full rounded-[1rem] border border-[#ede9fe] bg-white px-3 py-2.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.2rem] sm:px-4 sm:py-3"
                  >
                    <p className="text-xs font-black text-[#111827] truncate sm:text-sm">{item.title || 'Notification'}</p>
                    <p className="mt-0.5 text-[10px] text-[#6b7280] line-clamp-1 sm:mt-1 sm:text-xs sm:line-clamp-2">{item.message || 'New update available'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
          <section className="rounded-[1.5rem] border border-[#dbeafe] bg-[linear-gradient(180deg,#f8fdff_0%,#eef6ff_100%)] p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#0f766e] sm:text-xs">Assigned Subjects</p>
                <h3 className="mt-1 text-base font-black text-[#0f172a] sm:mt-1.5 sm:text-lg md:text-xl">Subject overview</h3>
              </div>
              <span className="shrink-0 rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#0369a1] shadow-sm sm:px-4 sm:py-2 sm:text-xs">
                {filteredSubjects.length} records
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-2.5">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-xs font-semibold text-[#374151] shadow-sm sm:text-sm"
              >
                <option value="">All Branches</option>
                {Array.from(new Set(user.assignedSubjects.map((s) => (typeof s.branchId === 'string' ? s.branchId : s.branchId?._id)))).filter(Boolean).map((id) => (
                  <option key={id} value={id}>{resolveBranchName(id)}</option>
                ))}
              </select>
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-xs font-semibold text-[#374151] shadow-sm sm:text-sm"
              >
                <option value="">All Semesters</option>
                {Array.from(new Set(user.assignedSubjects.map((s) => (typeof s.semesterId === 'string' ? s.semesterId : s.semesterId?._id)))).filter(Boolean).map((id) => (
                  <option key={id} value={id}>{resolveSemesterName(id)}</option>
                ))}
              </select>
            </div>

            {filteredSubjects.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-[#dbeafe] bg-white/70 px-4 py-6 text-center text-xs text-[#64748b] sm:mt-4 sm:text-sm">
                No subjects found for current filters.
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-2.5 sm:hidden">
                  {filteredSubjects.map((subject) => (
                    <div key={subject._id || subject.id} className="rounded-[1rem] border border-[#dbeafe] bg-white p-3 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#1f2937] line-clamp-1">{subject.name}</p>
                          <p className="mt-0.5 text-[10px] text-[#6b7280]">{subject.code}</p>
                        </div>
                        <span className="shrink-0 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">{resolveSemesterName(subject.semesterId)}</span>
                      </div>
                      <p className="mt-1.5 text-[10px] text-[#475569]">{resolveBranchName(subject.branchId)}</p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => navigate(`/${teacherBasePath}/materials`, { state: { subjectId: subject._id } })}
                          className="flex-1 rounded-lg bg-[#4338ca] py-1.5 text-[10px] font-bold text-white transition hover:bg-[#3730a3]"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => navigate(`/subjects/${subject._id}/materials`)}
                          className="flex-1 rounded-lg border border-[#d1d5db] bg-white py-1.5 text-[10px] font-bold text-[#374151] transition hover:bg-[#f9fafb]"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto rounded-xl border border-[#dbeafe] bg-white sm:block">
                  <table className="w-full min-w-[600px]">
                    <thead className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Subject</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Branch</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Semester</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredSubjects.map((subject) => (
                        <tr key={subject._id || subject.id}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-[#1f2937] line-clamp-1">{subject.name}</p>
                            <p className="text-xs text-[#6b7280]">{subject.code}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#475569]">{resolveBranchName(subject.branchId)}</td>
                          <td className="px-4 py-3 text-sm text-[#475569]">{resolveSemesterName(subject.semesterId)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => navigate(`/${teacherBasePath}/materials`, { state: { subjectId: subject._id } })}
                                className="rounded-lg bg-[#4338ca] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3730a3]"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => navigate(`/subjects/${subject._id}/materials`)}
                                className="rounded-lg border border-[#d1d5db] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
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
              </>
            )}
          </section>
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
