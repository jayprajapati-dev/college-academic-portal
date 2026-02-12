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
      const response = await fetch('/api/academic/subjects');
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const branchId = profile?.branch?._id;
        const semesterId = profile?.semester?._id;

        const filtered = data.data.filter((subject) =>
          (!branchId || subject.branchId === branchId) &&
          (!semesterId || subject.semesterId === semesterId)
        );

        setStats((prev) => ({
          ...prev,
          materials: filtered.length,
          subjects: filtered.length
        }));
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error('Error fetching subjects:', error);
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
  }, [fetchStudentSubjects, handleAuthError, navigate]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#194ce6]"></div>
      </div>
    );
  }

  return (
    <StudentLayout title="Student Dashboard" onLogout={handleLogout} userName={user?.name || 'Student'}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-[#194ce6] to-purple-500 rounded-full">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name}!</h2>
              <p className="text-gray-600 mt-1">Ready to explore your academic resources</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Study Materials</p>
                <p className="text-3xl font-bold text-[#194ce6] mt-1">{stats.materials}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-[#194ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Notices</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.notices}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">My Subjects</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.subjects}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/student/subjects')}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition group"
            >
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-[#194ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Study Materials</p>
              <p className="text-sm text-gray-600 mt-1">Browse resources</p>
            </button>

            <button
              onClick={() => navigate('/notices')}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition group"
            >
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">View Notices</p>
              <p className="text-sm text-gray-600 mt-1">Latest updates</p>
            </button>

            <button
              onClick={() => navigate('/student/subjects')}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition group"
            >
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">My Subjects</p>
              <p className="text-sm text-gray-600 mt-1">View all subjects</p>
            </button>

            <button
              onClick={() => navigate('/student/library')}
              className="p-6 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl hover:shadow-lg transition group"
            >
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Library</p>
              <p className="text-sm text-gray-600 mt-1">Browse recommended books</p>
            </button>

            <button 
              onClick={() => navigate('/student/timetable')}
              className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Timetable</p>
              <p className="text-sm text-gray-600 mt-1">View your schedule</p>
            </button>

            <button 
              onClick={() => navigate('/student/profile')}
              className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">My Profile</p>
              <p className="text-sm text-gray-600 mt-1">View & edit profile</p>
            </button>
          </div>
        </div>
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
