import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      
      // Fetch detailed profile for all logged-in users
      fetch('/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserProfile(data.data);
        }
      })
      .catch(err => console.error('Error fetching profile:', err));
      
      // Fetch notifications (only for students)
      if (parsedUser.role === 'student') {
        fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(data.data || []);
          }
        })
        .catch(err => console.error('Error fetching notifications:', err));
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header className="fixed top-0 w-full z-50 glass-header">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-primary rounded-lg text-white">
            <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">SmartAcademics</h1>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="/about">About Us</a>
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="/contact">Contact Us</a>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {currentUser?.role === 'student' && (
                <>
                  {/* Notifications Icon */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowProfileDropdown(false);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all relative"
                      title="Notifications"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-sm">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <p className="text-sm">No new notifications</p>
                            </div>
                          ) : (
                            notifications.map((notif, index) => (
                              <div key={index} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => {
                                if (notif.link) navigate(notif.link);
                                setShowNotifications(false);
                              }}>
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
                </>
              )}

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                  title="Profile Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm font-semibold">{currentUser?.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-bold text-sm">{currentUser?.name}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                      {userProfile && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {currentUser?.role === 'student' && (
                            <>
                              <p>{userProfile.branch?.name}</p>
                              <p>Semester {userProfile.semester?.semesterNumber}</p>
                            </>
                          )}
                          {(currentUser?.role === 'teacher' || currentUser?.role === 'hod' || currentUser?.role === 'coordinator') && (
                            <>
                              <p className="capitalize">{currentUser.role}</p>
                              {currentUser?.role === 'coordinator'
                                ? userProfile.coordinator?.branch?.name && <p>{userProfile.coordinator.branch.name}</p>
                                : userProfile.branch?.name && <p>{userProfile.branch.name}</p>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          const profilePath = currentUser?.role === 'teacher' 
                            ? '/teacher/profile' 
                            : currentUser?.role === 'hod'
                            ? '/hod/profile'
                            : currentUser?.role === 'coordinator'
                            ? '/coordinator/profile'
                            : '/student/profile';
                          navigate(profilePath);
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">person</span>
                        My Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a
                className="px-5 py-2 text-sm font-bold bg-[#f0f1f4] dark:bg-white/10 rounded-lg hover:bg-gray-200 transition-all"
                href="/login"
              >
                Login
              </a>
              <a
                className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                href="/register"
              >
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
