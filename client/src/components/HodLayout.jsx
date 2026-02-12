import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

const HodLayout = ({ title, children, userName = 'HOD', onLogout = null }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = useMemo(() => ([
    { label: 'Dashboard', to: '/hod/dashboard', icon: 'space_dashboard' },
    { label: 'Profile', to: '/hod/profile', icon: 'account_circle' },
    { label: 'Add Teacher', to: '/hod/add-teacher', icon: 'person_add' },
    { label: 'Manage Teachers', to: '/hod/manage-teachers', icon: 'group' },
    { label: 'Notices', to: '/hod/notices', icon: 'notifications' },
    { label: 'Tasks', to: '/hod/tasks', icon: 'assignment' },
    { label: 'Materials', to: '/hod/materials', icon: 'menu_book' },
    { label: 'Reports', to: '/hod/reports', icon: 'insights' },
    { label: 'Timetable', to: '/hod/timetable', icon: 'calendar_today' }
  ]), []);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#111318]">
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E6E9EF] transform transition-transform duration-200 md:translate-x-0 ${
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
              <p className="text-[11px] text-[#6B7280]">HOD Panel</p>
            </div>
          </div>
        </div>

        <nav className="px-4 py-4 space-y-1">
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
              {item.label}
            </NavLink>
          ))}
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
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#374151]">
            <NavLink to="/" className="hover:text-black">Home</NavLink>
            <NavLink to="/about" className="hover:text-black">About</NavLink>
            <NavLink to="/contact" className="hover:text-black">Contact</NavLink>
          </nav>
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
              {userName}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-44 bg-white border border-[#E6E9EF] rounded-xl shadow-lg overflow-hidden z-40">
                <NavLink
                  to="/hod/profile"
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

export default HodLayout;
