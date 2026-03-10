import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, LoadingSpinner, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleExamsViewOnly = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role || 'teacher';
  const token = localStorage.getItem('token');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schedules, setSchedules] = useState([]);

  const examStats = useMemo(() => {
    const total = schedules.length;
    const scheduled = schedules.filter((item) => (item.status || 'scheduled') === 'scheduled').length;
    const completed = schedules.filter((item) => item.status === 'completed').length;
    const cancelled = schedules.filter((item) => item.status === 'cancelled').length;
    return { total, scheduled, completed, cancelled };
  }, [schedules]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    let isMounted = true;
    const loadSchedules = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/api/exams/schedules', {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 20, status: 'all' }
        });

        if (!isMounted) return;
        if (response.data?.success) {
          setSchedules(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setSchedules([]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || 'Failed to load exams');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSchedules();
    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const statusPill = (status = 'scheduled') => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <RoleLayout
        title="Exams"
        userName={storedUser?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={role === 'hod' ? 'HOD Panel' : role === 'coordinator' ? 'Coordinator Panel' : 'Teacher Panel'}
        profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <LoadingSpinner />
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Exams"
      userName={storedUser?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={role === 'hod' ? 'HOD Panel' : role === 'coordinator' ? 'Coordinator Panel' : 'Teacher Panel'}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-5">
        <section className="rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#2563eb] text-white p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-blue-100">Exams</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Exams (View Only)</h1>
          <p className="text-blue-100 mt-2 text-sm sm:text-base">
            View exam schedules and status updates for your classes.
          </p>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <p className="text-xs text-gray-500 uppercase font-semibold">All Exams</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{examStats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <p className="text-xs text-gray-500 uppercase font-semibold">Scheduled</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{examStats.scheduled}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <p className="text-xs text-gray-500 uppercase font-semibold">Completed</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{examStats.completed}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <p className="text-xs text-gray-500 uppercase font-semibold">Cancelled</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{examStats.cancelled}</p>
          </div>
        </div>

        {error && (
          <Card className="border border-rose-200 bg-rose-50">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </Card>
        )}

        <Card className="border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Exam Schedules</h2>
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-500">No exam schedules found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{schedule.examName || 'Exam'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.subjectId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{schedule.date ? String(schedule.date).slice(0, 10) : 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${statusPill(schedule.status || 'scheduled')}`}>
                          {schedule.status || 'scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </RoleLayout>
  );
};

export default RoleExamsViewOnly;
