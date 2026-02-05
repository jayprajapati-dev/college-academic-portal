import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatsCard, HodLayout } from '../components';

const HODDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teachers: 0,
    content: 0,
    students: 0
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
          content: data.data?.subjects || 0,
          students: data.data?.students || 0
        });
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error('Error fetching branch stats:', error);
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
        fetchBranchStats(data.data);
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
  }, [navigate, fetchBranchStats, handleAuthError]);

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
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <HodLayout title="Dashboard" userName={user?.name || 'HOD'} onLogout={handleLogout}>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#6B7280]">Head of Department</p>
            <h2 className="text-2xl font-bold">Welcome, {user?.name || 'HOD'}</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Branch: {user?.branch?.name || 'N/A'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F1F5F9] text-sm font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Branch Active
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <StatsCard icon="group" title="Branch Teachers" value={stats.teachers} color="indigo" />
        <StatsCard icon="menu_book" title="Branch Content" value={stats.content} color="purple" />
        <StatsCard icon="school" title="Branch Students" value={stats.students} color="green" />
      </div>

      <Card title="Quick Actions" subtitle="Manage teachers, reports, and schedules" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <button onClick={() => navigate('/hod/add-teacher')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">person_add</span>
              <div>
                <p className="text-sm font-bold">Add Teacher</p>
                <p className="text-xs text-[#6B7280]">Onboard faculty</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/hod/manage-teachers')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">group</span>
              <div>
                <p className="text-sm font-bold">Manage Teachers</p>
                <p className="text-xs text-[#6B7280]">Assignments</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/hod/materials')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">menu_book</span>
              <div>
                <p className="text-sm font-bold">Materials</p>
                <p className="text-xs text-[#6B7280]">Branch content</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/hod/reports')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">insights</span>
              <div>
                <p className="text-sm font-bold">Reports</p>
                <p className="text-xs text-[#6B7280]">Branch stats</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/hod/timetable')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <div>
                <p className="text-sm font-bold">Timetable</p>
                <p className="text-xs text-[#6B7280]">Manage schedule</p>
              </div>
            </div>
          </button>
        </div>
      </Card>

      <Card title="Branch Information" subtitle="Department details">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#111318] text-white flex items-center justify-center">
            <span className="material-symbols-outlined">apartment</span>
          </div>
          <div>
            <p className="text-lg font-bold">{user?.branch?.name || 'N/A'}</p>
            <p className="text-sm text-[#6B7280]">{user?.branch?.code || '—'}</p>
            <p className="text-xs text-[#6B7280] mt-1">Department Head: {user?.name}</p>
          </div>
        </div>
      </Card>
    </HodLayout>
  );
};

export default HODDashboard;
