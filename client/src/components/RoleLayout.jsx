import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (_) {
    return {};
  }
};

const RoleLayout = ({
  title,
  children,
  userName,
  onLogout,
  navItems,
  navLoading = false,
  panelLabel,
  topLinks = [],
  profileLinks = []
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [noticeCount, setNoticeCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const navigate = useNavigate();

  const storedUser = parseStoredUser();
  const role = storedUser?.role;
  const location = useLocation();
  const coordinatorBaseRole = ['teacher', 'hod'].includes(storedUser?.coordinator?.baseRole)
    ? storedUser.coordinator.baseRole
    : null;
  const coordinatorActive = Boolean(storedUser?.coordinator?.branch)
    && storedUser?.coordinator?.status !== 'expired';

  const modeSet = new Set(role ? [role] : []);
  if (storedUser?.adminAccess === true || role === 'admin') {
    modeSet.add('admin');
  }
  if (['teacher', 'hod'].includes(role) && coordinatorActive) {
    modeSet.add('coordinator');
  }
  if (role === 'coordinator' && coordinatorBaseRole) {
    modeSet.add(coordinatorBaseRole);
  }

  const modeOrder = ['admin', 'coordinator', 'hod', 'teacher'];
  const availableModes = modeOrder.filter((mode) => modeSet.has(mode));
  const showModeTabs = availableModes.length > 1;
  const activeMode = availableModes.find((mode) => location.pathname.startsWith(`/${mode}`)) || role;

  const modeLabel = (mode) => {
    if (mode === 'admin') return 'Admin';
    if (mode === 'hod') return 'HOD';
    if (mode === 'teacher') return 'Teacher';
    if (mode === 'coordinator') return 'Coordinator';
    return 'Role';
  };

  const defaultProfileLinks = role ? [{ label: 'Profile', to: `/${role}/profile` }] : [];
  const effectiveProfileLinks = profileLinks.length > 0 ? profileLinks : defaultProfileLinks;
  const hasProfileMenu = effectiveProfileLinks.length > 0;

  const roleLabel = useMemo(() => {
    if (role === 'hod') return 'HOD';
    if (role === 'teacher') return 'Teacher';
    if (role === 'coordinator') return 'Coordinator';
    if (role === 'admin') return 'Admin';
    return 'Role';
  }, [role]);

  React.useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setNotificationLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!mounted) return;

        if (data?.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          const unread = data.data.filter((item) => !(item.isRead ?? item.read)).length;
          setNoticeCount(unread);
        }
      } catch (_) {
        if (mounted) {
          setNotifications([]);
          setNoticeCount(0);
        }
      } finally {
        if (mounted) setNotificationLoading(false);
      }
    };

    loadNotifications();
    return () => {
      mounted = false;
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !notificationId) return;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.map((item) =>
        item._id === notificationId ? { ...item, isRead: true, read: true } : item
      ));
      setNoticeCount((prev) => Math.max(0, prev - 1));
    } catch (_) {
      // no-op
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
      // no-op
    }
  };

  const onNotificationClick = async (item) => {
    const unread = !(item?.isRead ?? item?.read);
    if (unread && item?._id) {
      await markAsRead(item._id);
    }

    setShowNotifications(false);
    const target = item?.actionUrl || item?.link || '/notices';
    navigate(target);
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
              <p className="text-[11px] text-[#6B7280]">{panelLabel}</p>
            </div>
          </div>
        </div>

        <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 mb-4">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">{panelLabel}</p>
          </div>
          {navLoading ? (
            <div className="px-3 py-2 text-xs text-[#6B7280]">Loading menu...</div>
          ) : navItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#6B7280]">No modules assigned</div>
          ) : (
            navItems.map((item) => {
              const isNoticeItem = item.key === 'notices' || /notice/i.test(item.label || '') || (item.to || '').includes('/notices');
              const displayLabel = isNoticeItem ? 'Notice Board' : item.label;
              const displayIcon = isNoticeItem ? 'campaign' : item.icon;

              return (
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
                  <span className="material-symbols-outlined text-lg">{displayIcon}</span>
                  <span>{displayLabel}</span>
                  {isNoticeItem && noticeCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {noticeCount > 99 ? '99+' : noticeCount}
                    </span>
                  )}
                </NavLink>
              );
            })
          )}
        </nav>

        <div className="p-4 border-t border-[#E6E9EF] space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#374151] hover:bg-[#F1F5F9] transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="material-symbols-outlined text-lg">language</span>
            View Website
          </NavLink>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#374151] hover:text-red-600 hover:bg-[#F9FAFB] transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          )}
        </div>
      </aside>

      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-[#E6E9EF] md:pl-64">
        <div className="h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              className="md:hidden w-10 h-10 rounded-xl border border-[#E6E9EF] flex items-center justify-center"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
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
                placeholder="Search for modules, users or content..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E6E9EF] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
              />
            </div>
            {showModeTabs && (
              <div className="hidden sm:flex items-center bg-[#F1F5F9] rounded-full p-1 text-xs font-semibold">
                {availableModes.map((mode) => (
                  <NavLink
                    key={mode}
                    to={`/${mode}/dashboard`}
                    className={`px-3 py-1 rounded-full transition ${activeMode === mode ? 'bg-[#111318] text-white' : 'text-[#374151]'}`}
                  >
                    {modeLabel(mode)}
                  </NavLink>
                ))}
              </div>
            )}
            {!showModeTabs && roleLabel && (
              <div className="hidden sm:flex items-center bg-[#F1F5F9] rounded-full p-1 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-[#111318] text-white">{roleLabel}</span>
              </div>
            )}
            {showModeTabs && (
              <div className="sm:hidden text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                {modeLabel(activeMode)} Mode
              </div>
            )}
          </div>

          {topLinks.length > 0 && (
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#374151]">
              {topLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className="hover:text-black">
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}

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
                          onClick={() => onNotificationClick(item)}
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

            <button
              onClick={() => hasProfileMenu && setShowProfileMenu((prev) => !prev)}
              className="sm:hidden w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center"
              aria-label="Open profile menu"
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
            </button>
            <button
              onClick={() => hasProfileMenu && setShowProfileMenu((prev) => !prev)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] text-sm font-semibold"
              aria-label="Open profile menu"
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
              {userName}
            </button>
            {hasProfileMenu && showProfileMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-[#E6E9EF] rounded-xl shadow-lg overflow-hidden z-40">
                {effectiveProfileLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-2 text-sm text-[#111318] hover:bg-[#F1F5F9]"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
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
            {onLogout && !hasProfileMenu && (
              <button
                onClick={onLogout}
                className="h-10 px-4 rounded-xl bg-[#111318] text-white text-sm font-semibold hover:opacity-90"
              >
                Logout
              </button>
            )}
          </div>
        </div>
        {showModeTabs && (
          <div className="sm:hidden border-t border-[#E6E9EF] px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {availableModes.map((mode) => (
                <NavLink
                  key={mode}
                  to={`/${mode}/dashboard`}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${activeMode === mode ? 'bg-[#111318] text-white' : 'bg-[#F1F5F9] text-[#374151]'}`}
                >
                  {modeLabel(mode)}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className={`${showModeTabs ? 'pt-[106px]' : 'pt-16'} md:pt-16 md:pl-64`}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default RoleLayout;
