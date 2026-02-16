import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

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

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role;
  const location = useLocation();
  const defaultProfileLinks = role ? [{ label: 'Profile', to: `/${role}/profile` }] : [];
  const effectiveProfileLinks = profileLinks.length > 0 ? profileLinks : defaultProfileLinks;
  const hasProfileMenu = effectiveProfileLinks.length > 0;
  const showModeTabs = storedUser?.adminAccess === true && role && role !== 'admin';
  const isAdminPath = location.pathname.startsWith('/admin');
  const roleLabel = useMemo(() => {
    if (role === 'hod') return 'HOD';
    if (role === 'teacher') return 'Teacher';
    if (role === 'coordinator') return 'Coordinator';
    return 'Role';
  }, [role]);

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
          {navLoading ? (
            <div className="px-3 py-2 text-xs text-[#6B7280]">Loading menu...</div>
          ) : navItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#6B7280]">No modules assigned</div>
          ) : (
            navItems.map((item) => (
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
                {item.label}
              </NavLink>
            ))
          )}
        </nav>
      </aside>

      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-[#E6E9EF] md:pl-64">
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-10 h-10 rounded-xl border border-[#E6E9EF] flex items-center justify-center"
              onClick={() => setIsMobileOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-bold">{title}</h1>
            {showModeTabs && (
              <div className="hidden sm:flex items-center bg-[#F1F5F9] rounded-full p-1 text-xs font-semibold">
                <NavLink
                  to="/admin/dashboard"
                  className={`px-3 py-1 rounded-full transition ${isAdminPath ? 'bg-[#111318] text-white' : 'text-[#374151]'}`}
                >
                  Admin
                </NavLink>
                <NavLink
                  to={`/${role}/dashboard`}
                  className={`px-3 py-1 rounded-full transition ${!isAdminPath ? 'bg-[#111318] text-white' : 'text-[#374151]'}`}
                >
                  {roleLabel}
                </NavLink>
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
              onClick={() => hasProfileMenu && setShowProfileMenu((prev) => !prev)}
              className="sm:hidden w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center"
              aria-label="Open profile menu"
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
            </button>
            <button
              onClick={() => hasProfileMenu && setShowProfileMenu((prev) => !prev)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] text-sm font-semibold"
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
      </header>

      <main className="pt-16 md:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default RoleLayout;
