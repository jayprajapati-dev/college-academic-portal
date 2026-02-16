import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, LoadingSpinner, RoleLayout } from '../components';
import useRoleNav from '../hooks/useRoleNav';

const ActivityLog = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [role, setRole] = useState(storedUser?.role || 'admin');
  const [user, setUser] = useState(storedUser);
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }
      const res = await axios.get('/api/profile/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setUser(res.data.data);
        setRole(res.data.data.role);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        return res.data.data;
      }
      return null;
    } catch (error) {
      navigate('/login');
      return null;
    }
  }, [navigate]);

  const fetchLogs = useCallback(async (pageNumber) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/activity', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNumber, limit: 20 }
      });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotalPages(res.data.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const panelLabel = role === 'admin'
    ? 'Admin Panel'
    : role === 'hod'
      ? 'HOD Panel'
      : 'Coordinator Panel';

  return (
    <RoleLayout
      title="Activity Log"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
            <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
          </div>
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No activity found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">When</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.actorName || 'User'}
                        <span className="ml-2 text-xs text-gray-500">({log.actorRole})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">{log.action?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {log.targetLabel || log.targetType || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </Card>
      )}
    </RoleLayout>
  );
};

export default ActivityLog;
