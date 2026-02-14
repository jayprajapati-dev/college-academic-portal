import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, LoadingSpinner, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const TaskSubmissions = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [counts, setCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/tasks/${taskId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setTask(res.data.data.task);
        setSubmissions(res.data.data.submissions || []);
        setCounts(res.data.data.counts || {});
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      navigate(`/${role}/dashboard`);
    } finally {
      setLoading(false);
    }
  }, [navigate, role, taskId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleStatusUpdate = async (studentId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/tasks/${taskId}/recipients/${studentId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission status:', error);
      alert('Failed to update status');
    }
  };

  const filteredSubmissions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return submissions;
    return submissions.filter((entry) =>
      entry.student?.name?.toLowerCase().includes(term) ||
      entry.student?.email?.toLowerCase().includes(term) ||
      entry.student?.enrollmentNumber?.toLowerCase().includes(term)
    );
  }, [searchTerm, submissions]);

  if (loading) {
    return (
      <RoleLayout
        title="Task Submissions"
        userName={user?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : 'Teacher Panel'}
      >
        <LoadingSpinner />
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Task Submissions"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : 'Teacher Panel'}
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">{task?.title || 'Task Submissions'}</h1>
            <p className="text-gray-500 mt-1">
              {task?.subjectId?.name || ''} {task?.dueDate ? `• Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button
            onClick={() => navigate(role === 'hod' ? '/hod/tasks' : '/teacher/tasks')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
          >
            Back to Tasks
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total</p>
            <p className="text-2xl font-black text-gray-900">{submissions.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Pending</p>
            <p className="text-2xl font-black text-gray-900">{counts.pending || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Submitted</p>
            <p className="text-2xl font-black text-gray-900">{counts.submitted || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Completed</p>
            <p className="text-2xl font-black text-gray-900">{counts.completed || 0}</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student by name, email, or enrollment"
              className="w-full md:max-w-sm px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted At</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubmissions.map((entry) => (
                    <tr key={entry.student?._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{entry.student?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.student?.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{entry.status}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {entry.status === 'submitted' ? (
                          <button
                            onClick={() => handleStatusUpdate(entry.student?._id, 'completed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          >
                            Mark Completed
                          </button>
                        ) : entry.status === 'completed' ? (
                          <span className="text-xs font-semibold text-emerald-600">Completed</span>
                        ) : (
                          <span className="text-xs text-gray-500">Waiting</span>
                        )}
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

export default TaskSubmissions;
