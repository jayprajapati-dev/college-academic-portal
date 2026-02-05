import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [stats, setStats] = useState({
    drafts: 0,
    published: 0,
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
        setStats((prev) => ({
          ...prev,
          subjects: data.data.assignedSubjects?.length || 0
        }));
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
  }, [navigate, handleAuthError]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [branchRes, semesterRes] = await Promise.all([
          fetch('/api/academic/branches').then((r) => r.json()),
          fetch('/api/academic/semesters').then((r) => r.json())
        ]);
        setBranches(branchRes?.data || []);
        setSemesters(semesterRes?.data || []);
      } catch (error) {
        console.error('Error fetching branches/semesters:', error);
      }
    };

    fetchMeta();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!user?.assignedSubjects?.length) return;

    const assignedBranchIds = Array.from(new Set(user.assignedSubjects.map((s) => s.branchId)));
    const assignedSemesterIds = Array.from(new Set(user.assignedSubjects.map((s) => s.semesterId)));

    if (!selectedBranchId && assignedBranchIds.length === 1) {
      setSelectedBranchId(assignedBranchIds[0]);
    }

    if (!selectedSemesterId && assignedSemesterIds.length === 1) {
      setSelectedSemesterId(assignedSemesterIds[0]);
    }
  }, [user, selectedBranchId, selectedSemesterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#194ce6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#194ce6] to-purple-500 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Welcome back, {user?.name}!</h2>
              <p className="mt-2 text-blue-100">Manage your subjects and publish content for students</p>
            </div>
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Draft Materials</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">{stats.drafts}</p>
                <p className="text-xs text-gray-400 mt-1">Pending publication</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Published Content</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.published}</p>
                <p className="text-xs text-gray-400 mt-1">Live materials</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">My Subjects</p>
                <p className="text-3xl font-bold text-[#194ce6] mt-1">{stats.subjects}</p>
                <p className="text-xs text-gray-400 mt-1">Assigned subjects</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-[#194ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5m4 0h5a1 1 0 001-1V10" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Website</p>
              <p className="text-sm text-gray-600 mt-1">Open landing page</p>
            </button>
            <button 
              onClick={() => navigate('/teacher/materials')}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-[#194ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Manage Materials</p>
              <p className="text-sm text-gray-600 mt-1">Add/edit content</p>
            </button>

            <button 
              onClick={() => navigate('/teacher/materials')}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">View Materials</p>
              <p className="text-sm text-gray-600 mt-1">Your content</p>
            </button>

            <button className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Post Notice</p>
              <p className="text-sm text-gray-600 mt-1">Create announcement</p>
            </button>

            <button className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition group">
              <div className="p-3 bg-white rounded-lg w-fit mb-3 group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">My Subjects</p>
              <p className="text-sm text-gray-600 mt-1">View assigned subjects</p>
            </button>
          </div>
        </div>

        {/* Branch/Semester Filters */}
        {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Filter Subjects</h3>
                <p className="text-sm text-gray-500 mt-1">Auto-selected if only one branch/semester assigned</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Branch</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">All Branches</option>
                    {Array.from(new Set(user.assignedSubjects.map((s) => s.branchId))).map((id) => {
                      const branch = branches.find((b) => b._id === id);
                      return (
                        <option key={id} value={id}>
                          {branch?.name || 'Unknown Branch'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Semester</label>
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">All Semesters</option>
                    {Array.from(new Set(user.assignedSubjects.map((s) => s.semesterId))).map((id) => {
                      const semester = semesters.find((s) => s._id === id);
                      return (
                        <option key={id} value={id}>
                          Semester {semester?.semesterNumber || 'N/A'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Subjects */}
        {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Assigned Subjects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.assignedSubjects
                .filter((subject) => (selectedBranchId ? subject.branchId === selectedBranchId : true))
                .filter((subject) => (selectedSemesterId ? subject.semesterId === selectedSemesterId : true))
                .map((subject, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <svg className="w-5 h-5 text-[#194ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{subject.name}</p>
                      <p className="text-xs text-gray-500">{subject.code}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {branches.find((b) => b._id === subject.branchId)?.name || 'Branch'} • Semester {semesters.find((s) => s._id === subject.semesterId)?.semesterNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate('/teacher/materials', { state: { subjectId: subject._id } })}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                    >
                      Manage Materials
                    </button>
                    <button
                      onClick={() => navigate(`/subjects/${subject._id}/materials`)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      Open Public View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
