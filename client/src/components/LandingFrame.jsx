import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingFrame = ({ children, isLoggedIn, currentUser, userProfile, notifications }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getDashboardPath = (user) => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'admin' || user.adminAccess === true) return '/admin/dashboard';
    if (user.role === 'hod') return '/hod/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'coordinator') return '/coordinator/dashboard';
    return '/';
  };

  const getProfilePath = (user) => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/profile?view=website';
    if (user.role === 'admin' || user.adminAccess === true) return '/admin/profile?view=website';
    if (user.role === 'hod') return '/hod/profile?view=website';
    if (user.role === 'teacher') return '/teacher/profile?view=website';
    if (user.role === 'coordinator') return '/coordinator/profile?view=website';
    return '/';
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-[#111318] dark:text-white transition-colors duration-300">
      <header className="fixed top-0 w-full z-50 glass-header">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            <div className="p-1 sm:p-1.5 bg-primary rounded-lg text-white shrink-0">
              <svg className="size-4 sm:size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight truncate">SmartAcademics</h1>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {isLoggedIn && (
              <a className="text-sm font-semibold hover:text-primary transition-colors" href={getDashboardPath(currentUser)}>Dashboard</a>
            )}
            <a className="text-sm font-semibold hover:text-primary transition-colors" href="/academic-explorer">Academic Explorer</a>
            <a className="text-sm font-semibold hover:text-primary transition-colors" href="/about">About Us</a>
            <a className="text-sm font-semibold hover:text-primary transition-colors" href="/contact">Contact Us</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isLoggedIn ? (
              <>
                {currentUser?.role === 'student' && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowNotifications(!showNotifications);
                          setShowProfileDropdown(false);
                        }}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all relative"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notifications?.length > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </button>

                      {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-sm">Notifications</h3>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications?.length === 0 ? (
                              <div className="p-6 text-center text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-sm">No new notifications</p>
                              </div>
                            ) : (
                              notifications.map((notif, index) => (
                                <div
                                  key={index}
                                  className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    if (notif.link) navigate(notif.link);
                                    setShowNotifications(false);
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                      <span className="material-symbols-outlined text-sm">notifications</span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">{notif.time || 'Just now'}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(!showProfileDropdown);
                          setShowNotifications(false);
                        }}
                        className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                          {currentUser?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden md:inline text-sm font-semibold">{currentUser?.name}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <p className="font-bold text-sm">{currentUser?.name}</p>
                            <p className="text-xs text-gray-500">{currentUser?.email}</p>
                            {userProfile && (
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <p>{userProfile.branch?.name}</p>
                                <p>Semester {userProfile.semester?.semesterNumber}</p>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <button
                              onClick={() => {
                                navigate('/student/profile?view=website');
                                setShowProfileDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm font-semibold">Profile</span>
                            </button>
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors flex items-center gap-3"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span className="text-sm font-semibold">Logout</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {currentUser?.role !== 'student' && (
                  <>
                    <button
                      onClick={() => navigate(getProfilePath(currentUser))}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#f0f1f4] dark:bg-white/10 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                    >
                      Logout
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <a
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#f0f1f4] dark:bg-white/10 rounded-lg hover:bg-gray-200 transition-all"
                  href="/login"
                >
                  Login
                </a>
                <a
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  href="/register"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-12 sm:pt-14 mesh-background min-h-screen">
        <div className="md:hidden max-w-[1280px] mx-auto px-3 sm:px-4 pt-2.5">
          <a
            href="/academic-explorer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 px-4 py-2 text-xs font-bold hover:border-primary/40 transition-colors"
          >
            <span className="material-symbols-outlined" style={{fontSize:'16px'}}>travel_explore</span>
            Academic Explorer
          </a>
        </div>
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-[#dcdee5] dark:border-[#2d3244] py-6">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-1 bg-primary rounded text-white">
                <svg className="size-4" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-sm font-bold tracking-tight">SmartAcademics</h2>
            </a>
            <div className="flex gap-4 text-xs text-[#636c88] dark:text-slate-400 font-medium">
              <a className="hover:text-primary transition-colors" href="/privacy">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="/terms">Terms of Service</a>
              <a className="hover:text-primary transition-colors" href="/disclaimer">Disclaimer</a>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'SmartAcademics Portal',
                      text: 'Check out SmartAcademics - Elite Academic Resource Management Portal',
                      url: window.location.origin
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="w-10 h-10 rounded-full border border-[#dcdee5] dark:border-[#2d3244] flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                title="Share this portal"
              >
                <span className="material-symbols-outlined text-xl">share</span>
              </button>
              <button
                onClick={() => {
                  window.open(window.location.origin, '_blank');
                }}
                className="w-10 h-10 rounded-full border border-[#dcdee5] dark:border-[#2d3244] flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                title="Open in new tab"
              >
                <span className="material-symbols-outlined text-xl">open_in_new</span>
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#f0f1f4] dark:border-[#2d3244] text-center text-[10px] text-[#636c88] dark:text-slate-500">
            © 2026 SmartAcademics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingFrame;
