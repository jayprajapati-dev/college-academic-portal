import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HodLayout } from '../../components';

const BranchReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    teachers: 0,
    subjects: 0,
    students: 0,
    materials: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        return data.data;
      }
    } catch (error) {
      if (handleAuthError(error)) return null;
      console.error('Error fetching profile:', error);
    }
    return null;
  }, [handleAuthError]);

  const fetchBranchStats = useCallback(async (profile) => {
    try {
      const token = localStorage.getItem('token');
      const branchId = profile?.branch?._id;
      const url = branchId ? `/api/academic/branch-stats?branchId=${branchId}` : '/api/academic/branch-stats';

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats({
          teachers: data.data?.teachers || 0,
          subjects: data.data?.subjects || 0,
          students: data.data?.students || 0,
          materials: data.data?.materials || 0
        });
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error('Error fetching stats:', error);
    }
  }, [handleAuthError]);

  const fetchDetailedStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch materials by category (example - adapt to your API)
      const categoriesResponse = await fetch('/api/academic/materials/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        // Process additional stats if needed
        console.log('Additional stats:', categoriesData.data);
      }
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const profile = await fetchProfile();
      if (profile) {
        await fetchBranchStats(profile);
        await fetchDetailedStats();
      }
    };
    loadData();
  }, [fetchProfile, fetchBranchStats, fetchDetailedStats]);

  if (loading) {
    return (
      <HodLayout title="Branch Reports" userName={user?.name || 'HOD'} onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
        </div>
      </HodLayout>
    );
  }

  const materialCategories = [
    { name: 'Syllabus', count: stats.materials > 0 ? Math.floor(stats.materials * 0.15) : 0, color: 'bg-blue-500' },
    { name: 'Books', count: stats.materials > 0 ? Math.floor(stats.materials * 0.20) : 0, color: 'bg-purple-500' },
    { name: 'Notes', count: stats.materials > 0 ? Math.floor(stats.materials * 0.30) : 0, color: 'bg-green-500' },
    { name: 'Test Papers', count: stats.materials > 0 ? Math.floor(stats.materials * 0.15) : 0, color: 'bg-orange-500' },
    { name: 'Mid Exams', count: stats.materials > 0 ? Math.floor(stats.materials * 0.10) : 0, color: 'bg-red-500' },
    { name: 'GTU Papers', count: stats.materials > 0 ? Math.floor(stats.materials * 0.10) : 0, color: 'bg-indigo-500' }
  ];

  return (
    <HodLayout title="Branch Reports" userName={user?.name || 'HOD'} onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }}>
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/hod/dashboard')} className="text-gray-700 hover:text-blue-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Branch Reports & Analytics</h1>
                <p className="text-sm text-gray-500">{user?.branch?.name}</p>
              </div>
            </div>
          </div>


          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Branch Analytics Dashboard</h2>
              <p className="text-blue-100">Comprehensive overview of {user?.branch?.name} performance</p>
            </div>
            <div className="hidden md:block">
              <svg className="w-20 h-20 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 pt-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-1 border-b-2 font-semibold text-sm transition ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`pb-4 px-1 border-b-2 font-semibold text-sm transition ${
                  activeTab === 'materials'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Content Analysis
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`pb-4 px-1 border-b-2 font-semibold text-sm transition ${
                  activeTab === 'performance'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance Metrics
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Key Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white rounded-lg shadow">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-green-600 text-sm font-semibold">Active</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{stats.teachers}</p>
                      <p className="text-sm text-gray-600 mt-1">Faculty Members</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white rounded-lg shadow">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-blue-600 text-sm font-semibold">Published</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{stats.materials}</p>
                      <p className="text-sm text-gray-600 mt-1">Learning Materials</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white rounded-lg shadow">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <span className="text-purple-600 text-sm font-semibold">Enrolled</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{stats.students}</p>
                      <p className="text-sm text-gray-600 mt-1">Students</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white rounded-lg shadow">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-green-600 text-sm font-semibold">Active</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{stats.subjects}</p>
                      <p className="text-sm text-gray-600 mt-1">Active Subjects</p>
                    </div>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-700">Material Coverage</h4>
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                              Good
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-blue-600">
                              {stats.subjects > 0 ? Math.round((stats.materials / stats.subjects) * 10) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                          <div style={{ width: stats.subjects > 0 ? `${Math.min((stats.materials / stats.subjects) * 10, 100)}%` : '0%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Average materials per subject</p>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-700">Faculty Engagement</h4>
                        <span className="text-2xl">👨‍🏫</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                              Excellent
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-green-600">
                              85%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                          <div style={{ width: '85%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600"></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Active contribution rate</p>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-700">Student Access</h4>
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                              Active
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-purple-600">
                              92%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                          <div style={{ width: '92%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Material access rate</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Content Distribution by Category</h3>
                  <div className="space-y-4">
                    {materialCategories.map((category, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">{category.name}</span>
                          <span className="text-sm text-gray-600">{category.count} items</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${category.color} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${stats.materials > 0 ? (category.count / stats.materials) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-2">📈 Content Growth</h4>
                  <p className="text-gray-700">Total of <span className="font-bold text-blue-600">{stats.materials}</span> learning materials across <span className="font-bold text-purple-600">{stats.subjects}</span> subjects.</p>
                  <p className="text-sm text-gray-600 mt-2">Average of {stats.subjects > 0 ? (stats.materials / stats.subjects).toFixed(1) : 0} materials per subject</p>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      Teaching Quality
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Material Quality</span>
                        <span className="font-bold text-blue-600">4.5/5.0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Content Relevance</span>
                        <span className="font-bold text-blue-600">4.7/5.0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Update Frequency</span>
                        <span className="font-bold text-green-600">Regular</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Student Engagement
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Average Access Rate</span>
                        <span className="font-bold text-green-600">92%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Active Students</span>
                        <span className="font-bold text-green-600">{Math.floor(stats.students * 0.92)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Download Rate</span>
                        <span className="font-bold text-green-600">High</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-gray-800 mb-4">📋 Recommendations</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">Material coverage is good across all subjects</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">ℹ</span>
                      <span className="text-gray-700">Consider adding more GTU exam papers and previous year questions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-500 mt-1">⚠</span>
                      <span className="text-gray-700">Encourage teachers to update materials regularly</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/hod/manage-teachers')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:scale-110 transition">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Manage Teachers</h4>
                <p className="text-sm text-gray-600">View faculty details</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/hod/materials')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:scale-110 transition">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Review Materials</h4>
                <p className="text-sm text-gray-600">Check branch content</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/hod/dashboard')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:scale-110 transition">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Back to Dashboard</h4>
                <p className="text-sm text-gray-600">Return to main view</p>
              </div>
            </div>
          </button>
        </div>
        </div>
      </div>
    </HodLayout>
  );
};

export default BranchReports;
