import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const StudentLayout = ({ title, children, userName = 'Student', onLogout = null }) => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [noticeCount, setNoticeCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadHeaderData = async () => {
      try {
        setNotificationLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const [notifRes, profileRes] = await Promise.all([
          fetch('/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/profile/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const data = await notifRes.json();
        const profileData = await profileRes.json();
        if (!isMounted) return;

        if (data?.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          const unread = data.data.filter((item) => !(item.isRead ?? item.read)).length;
          setNoticeCount(unread);
        }

        if (profileData?.success && profileData?.data) {
          setStudentProfile(profileData.data);
        }
      } catch (_) {
        // Keep layout stable if notifications are unavailable.
      } finally {
        if (isMounted) setNotificationLoading(false);
      }
    };

    loadHeaderData();
    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = useMemo(() => ([
    { label: 'Dashboard', to: '/student/dashboard', icon: 'space_dashboard' },
    { label: 'Subjects', to: '/student/subjects', icon: 'menu_book' },
    { label: 'Library', to: '/student/library', icon: 'library_books' },
    { label: 'Notice Board', to: '/notices', icon: 'campaign' },
    { label: 'Exams', to: '/student/exams', icon: 'quiz' },
    { label: 'Timetable', to: '/student/timetable', icon: 'calendar_today' },
    { label: 'Profile', to: '/student/profile', icon: 'account_circle' }
  ]), []);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !notificationId) return false;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return false;

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true, read: true }
            : item
        )
      );
      setNoticeCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (_) {
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, read: true })));
      setNoticeCount(0);
    } catch (_) {
      // Silent fail keeps header usable.
    }
  };

  const handleNotificationClick = async (item) => {
    const isUnread = !(item?.isRead ?? item?.read);
    if (isUnread && item?._id) {
      await markAsRead(item._id);
    }

    setShowNotifications(false);
    const targetPath = item?.actionUrl || item?.link || '/notices';
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#111318]">
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E6E9EF] transform transition-transform duration-200 md:translate-x-0 flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-[#E6E9EF]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111318] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-none">SmartAcademics</p>
              <p className="text-[11px] text-[#6B7280]">Student Panel</p>
            </div>
          </div>
        </div>

        <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 mb-4">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Student Panel</p>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#111318] text-white'
                    : 'text-[#374151] hover:bg-[#F1F5F9]'
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'Notice Board' && noticeCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {noticeCount > 99 ? '99+' : noticeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E6E9EF] space-y-1">
          <NavLink
            to="/"
            className="flex w-full items-center gap-3 px-3 py-2 text-[#4B5563] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">language</span>
            <span className="text-sm font-medium">View Website</span>
          </NavLink>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-3 py-2 text-[#4B5563] hover:text-red-600 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          )}
        </div>
      </aside>

      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-[#E6E9EF] md:pl-64">
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              className="md:hidden w-10 h-10 rounded-xl border border-[#E6E9EF] flex items-center justify-center"
              onClick={() => setIsMobileOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative hidden md:block max-w-md w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for subjects, tasks or files..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E6E9EF] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
              />
            </div>
            <h1 className="md:hidden text-base font-bold truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowProfileMenu(false);
              }}
              className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E6E9EF] text-[#475569] relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {noticeCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[10px] leading-4 font-bold">
                  {noticeCount > 99 ? '99+' : noticeCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-[#E6E9EF] rounded-xl shadow-lg overflow-hidden z-40">
                <div className="px-4 py-3 border-b border-[#E6E9EF] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#111318]">Notifications</p>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[#194ce6] hover:underline"
                    disabled={noticeCount === 0}
                  >
                    Read all
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationLoading ? (
                    <div className="px-4 py-6 text-sm text-[#6B7280] text-center">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-[#6B7280] text-center">No notifications</div>
                  ) : (
                    notifications.slice(0, 20).map((item) => {
                      const unread = !(item.isRead ?? item.read);
                      return (
                        <button
                          key={item._id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition ${unread ? 'bg-[#EEF4FF]' : 'bg-white'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 w-2 h-2 rounded-full ${unread ? 'bg-[#194ce6]' : 'bg-[#CBD5E1]'}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#111827] truncate">{item.title || 'Notification'}</p>
                              <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.message || ''}</p>
                              <p className="text-[11px] text-[#94A3B8] mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="hidden sm:block h-7 w-px bg-[#E2E8F0]" />

            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F8FAFC] transition"
              title="Profile Menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[#111827] leading-tight">
                  {studentProfile?.enrollmentNumber || 'Enrollment N/A'}
                </p>
                <p className="text-[11px] text-[#64748B] leading-tight truncate max-w-[130px]">
                  {studentProfile?.name || userName}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#194ce6] text-white flex items-center justify-center font-bold text-sm">
                {(studentProfile?.name || userName || 'S').charAt(0).toUpperCase()}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-[#E6E9EF] rounded-xl shadow-lg overflow-hidden z-40">
                <NavLink
                  to="/student/profile"
                  className="block px-4 py-2 text-sm text-[#111318] hover:bg-[#F1F5F9]"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Profile
                </NavLink>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#F1F5F9]"
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16 md:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
