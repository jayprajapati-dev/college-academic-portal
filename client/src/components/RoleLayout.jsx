import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

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

  const hasProfileMenu = profileLinks.length > 0;

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
              <p className="text-[11px] text-[#6B7280]">{panelLabel}</p>
            </div>
          </div>
        </div>

        <nav className="px-4 py-4 space-y-1">
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
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
              {userName}
            </button>
            {hasProfileMenu && showProfileMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-[#E6E9EF] rounded-xl shadow-lg overflow-hidden z-40">
                {profileLinks.map((link) => (
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
