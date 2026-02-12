import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

const TeacherLayout = ({ title, children, userName = 'Teacher', onLogout = null }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = useMemo(() => ([
    { label: 'Dashboard', to: '/teacher/dashboard', icon: 'space_dashboard' },
    { label: 'Materials', to: '/teacher/materials', icon: 'menu_book' },
    { label: 'Notices', to: '/teacher/notices', icon: 'notifications' },
    { label: 'Profile', to: '/teacher/profile', icon: 'account_circle' }
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
              <p className="text-[11px] text-[#6B7280]">Teacher Panel</p>
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
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] text-sm font-semibold">
              <span className="material-symbols-outlined text-base">account_circle</span>
              {userName}
            </div>
            {onLogout && (
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

export default TeacherLayout;
