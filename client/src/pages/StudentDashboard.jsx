import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    materials: 0,
    notices: 0,
    subjects: 0
  });
  const [notifications, setNotifications] = useState([]);

  const handleAuthError = useCallback((error) => {
    if (error?.response?.status === 401 || error?.message?.includes('401')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchStudentSubjects = useCallback(async (profile) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/academic/subjects/student', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setStats((prev) => ({
          ...prev,
          materials: data.data.length,
          subjects: data.data.length
        }));
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error('Error fetching subjects:', error);
    }
  }, [handleAuthError]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data?.success && Array.isArray(data.data)) {
        const unread = data.data.filter((item) => !(item.isRead ?? item.read)).length;
        setStats((prev) => ({ ...prev, notices: unread }));
        setNotifications(data.data.slice(0, 6));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      setNotifications([]);
    }
  }, [handleAuthError]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        fetchStudentSubjects(data.data);
        fetchNotifications();
      } else {
        navigate('/login');
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error('Error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications, fetchStudentSubjects, handleAuthError, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#eef2ff,_#f8fafc)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e0e7ff] border-t-[#4338ca]" />
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#6366f1]">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <StudentLayout title="Student Dashboard" onLogout={handleLogout} userName={user?.name || 'Student'}>
      <main className="mx-auto max-w-7xl space-y-4 px-3.5 py-4 sm:space-y-5 sm:px-5 sm:py-5 md:space-y-6 md:px-6 lg:px-8 lg:py-7 font-display">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden rounded-[2rem] border border-[#c7d2fe] bg-[radial-gradient(circle_at_top_left,rgba(199,210,254,0.35),transparent_26%),linear-gradient(135deg,#1e1b4b_0%,#312e81_28%,#4338ca_58%,#06b6d4_100%)] px-4 py-5 text-white shadow-[0_28px_80px_rgba(49,46,129,0.32)] sm:px-6 sm:py-7 md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.08),transparent_34%,rgba(255,255,255,0.04)_66%,transparent)]" />
          <div className="absolute -left-12 top-8 h-40 w-40 rounded-full bg-[#818cf8]/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 translate-x-14 -translate-y-12 rounded-full bg-[#22d3ee]/18 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-20 w-48 translate-y-8 -translate-x-1/2 rounded-full bg-black/20 blur-2xl" />

          <div className="relative z-10 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.30em] text-indigo-200 backdrop-blur-md sm:text-[11px]">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">school</span>
                Student Workspace
              </div>

              <div>
                <h2 className="text-xl font-black leading-tight tracking-tight sm:text-3xl md:text-5xl">
                  Welcome back,{' '}
                  <span className="text-cyan-300">{user?.name?.split(' ')[0] || 'Student'}</span>!
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-indigo-100/80 sm:mt-2 sm:text-sm md:text-base">
                  Classes, notices, and exams — all in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {user?.branch?.name && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md sm:px-3 sm:text-[11px]">
                    <span className="material-symbols-outlined text-[12px] opacity-80 sm:text-[13px]">location_on</span>
                    {user.branch.name}
                  </span>
                )}
                {user?.semester?.semesterNumber && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md sm:px-3 sm:text-[11px]">
                    <span className="material-symbols-outlined text-[12px] opacity-80 sm:text-[13px]">book_2</span>
                    Sem {user.semester.semesterNumber}
                  </span>
                )}
                {user?.enrollmentNumber && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md sm:px-3 sm:text-[11px]">
                    <span className="material-symbols-outlined text-[12px] opacity-80 sm:text-[13px]">badge</span>
                    {user.enrollmentNumber}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/student/subjects')}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-xs font-black text-[#4338ca] shadow-[0_14px_32px_rgba(67,56,202,0.28)] transition hover:-translate-y-0.5 sm:py-2.5 sm:text-sm"
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px]">menu_book</span>
                  Study Materials
                </button>
                <button
                  onClick={() => navigate('/notices')}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15 sm:py-2.5 sm:text-sm"
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px]">notifications</span>
                  View Notices
                </button>
              </div>
            </div>

            <div className="hidden xl:grid grid-cols-2 gap-3">
              {[
                { icon: 'draft', label: 'Materials', value: stats.materials },
                { icon: 'notifications', label: 'Alerts', value: stats.notices },
                { icon: 'menu_book', label: 'Subjects', value: stats.subjects },
                { icon: 'book_2', label: 'Semester', value: user?.semester?.semesterNumber ?? '—' },
              ].map((s) => (
                <div key={s.label} className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                  <span className="material-symbols-outlined text-[22px] text-white/60">{s.icon}</span>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/60">{s.label}</p>
                  <p className="mt-1 text-3xl font-black leading-none">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-4">
          {[
            { label: 'Study Materials', value: stats.materials, icon: 'draft', shell: 'from-[#1e3a5f] via-[#1d4ed8] to-[#60a5fa]', note: 'Subjects with content' },
            { label: 'Unread Notices', value: stats.notices, icon: 'notifications', shell: 'from-[#3b0764] via-[#7c3aed] to-[#c084fc]', note: 'Pending notifications' },
            { label: 'My Subjects', value: stats.subjects, icon: 'menu_book', shell: 'from-[#134e4a] via-[#0f766e] to-[#34d399]', note: 'Enrolled this semester' },
            { label: 'Enrolled Sem', value: user?.semester?.semesterNumber ?? '—', icon: 'book_2', shell: 'from-[#92400e] via-[#b45309] to-[#fbbf24]', note: user?.branch?.name || 'Current branch' },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.25rem] border border-white/40 bg-white p-[3px] shadow-[0_18px_40px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-0.5 sm:rounded-[1.5rem] sm:p-1">
              <div className={`rounded-[1.1rem] bg-gradient-to-br ${item.shell} p-3 text-white sm:rounded-[1.3rem] sm:p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75 sm:text-[11px]">{item.label}</p>
                    <p className="mt-1.5 text-2xl font-black leading-none sm:mt-2 sm:text-3xl">{item.value}</p>
                  </div>
                  <span className="material-symbols-outlined shrink-0 rounded-lg bg-white/15 p-2 text-[20px] leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:rounded-xl sm:p-2.5 sm:text-[24px]">{item.icon}</span>
                </div>
                <div className="mt-2.5 rounded-xl border border-white/15 bg-black/10 px-2.5 py-1.5 text-[10px] text-white/80 backdrop-blur-sm sm:mt-4 sm:px-3 sm:py-2 sm:text-xs">
                  {item.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Modules ── */}
        <section className="rounded-[1.5rem] border border-[#c7d2fe] bg-[linear-gradient(180deg,#ffffff_0%,#eef2ff_100%)] p-3.5 shadow-[0_18px_40px_rgba(67,56,202,0.09)] sm:rounded-[2rem] sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#4338ca] sm:text-xs">Quick Access</p>
              <h3 className="mt-1 text-base font-black text-[#0f172a] sm:mt-2 sm:text-xl md:text-2xl">Your learning toolkit</h3>
            </div>
            <p className="hidden shrink-0 text-xs text-[#475569] sm:block">6 modules ready</p>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-3">
            {[
              { key: 'Content', label: 'Study Materials', to: '/student/subjects', accent: 'text-[#1d4ed8]' },
              { key: 'Notices', label: 'Notice Board', to: '/notices', accent: 'text-[#7c3aed]' },
              { key: 'Exams', label: 'Exam Schedule', to: '/student/exams', accent: 'text-[#be123c]' },
              { key: 'Schedule', label: 'Timetable', to: '/student/timetable', accent: 'text-[#0369a1]' },
              { key: 'Library', label: 'Reading Room', to: '/student/library', accent: 'text-[#047857]' },
              { key: 'Profile', label: 'My Profile', to: '/student/profile', accent: 'text-[#b45309]' },
            ].map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="group rounded-[1rem] border border-[#e0e7ff] bg-white px-3 py-3 text-left shadow-[0_8px_20px_rgba(67,56,202,0.07)] transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.25rem] sm:px-4 sm:py-4"
              >
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${item.accent} sm:text-[11px]`}>{item.key}</p>
                <p className="mt-1.5 text-sm font-black text-[#0f172a] line-clamp-1 sm:mt-2 sm:text-base">{item.label}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#4338ca] sm:mt-3 sm:text-[11px]">
                  <span>Open</span>
                  <span className="material-symbols-outlined text-[15px] transition duration-200 group-hover:translate-x-1">arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="rounded-[1.5rem] border border-[#c7d2fe] bg-[linear-gradient(180deg,#ffffff_0%,#eef2ff_100%)] shadow-[0_22px_50px_rgba(67,56,202,0.10)] sm:rounded-[2rem]">
          <div className="border-b border-[#e0e7ff] px-3.5 py-3 sm:px-4 sm:py-4 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#4338ca] sm:text-xs">Recent Activity</p>
                <h3 className="mt-1 text-base font-black text-[#111827] sm:mt-2 sm:text-xl md:text-2xl">Update stream</h3>
                <p className="mt-0.5 text-[10px] text-[#6b7280] sm:mt-1 sm:text-xs">Latest college notices and alerts</p>
              </div>
              <button
                onClick={() => navigate('/notices')}
                className="shrink-0 rounded-full border border-[#c7d2fe] bg-white px-3 py-1.5 text-[10px] font-bold text-[#4338ca] shadow-sm sm:px-4 sm:py-2 sm:text-xs"
              >
                <span className="sm:hidden">All</span>
                <span className="hidden sm:inline">Open Notices</span>
              </button>
            </div>
          </div>
          <div className="max-h-[20rem] overflow-y-auto px-3.5 py-3 sm:max-h-[24rem] sm:px-4 sm:py-4 md:px-5">
            {notifications.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[#c7d2fe] bg-white/75 px-4 py-7 text-center text-xs text-[#6b7280] sm:rounded-[1.2rem] sm:py-9 sm:text-sm">
                No recent updates available.
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                {notifications.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => navigate(item.actionUrl || item.link || '/notices')}
                    className="w-full rounded-[1rem] border border-[#e0e7ff] bg-white px-3 py-2.5 text-left shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 sm:rounded-[1.2rem] sm:px-4 sm:py-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${(item.isRead ?? item.read) ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#111827] truncate sm:text-sm">{item.title || 'Notification'}</p>
                        <p className="mt-0.5 text-[10px] text-[#6b7280] line-clamp-1 sm:mt-1 sm:text-xs sm:line-clamp-2">{item.message || 'New update available'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
