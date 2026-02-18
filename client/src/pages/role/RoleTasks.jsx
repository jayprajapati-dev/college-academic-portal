import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Card, Input, LoadingSpinner, Modal, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleTasks = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const isTeacher = role === 'teacher';
  const isHodTeacher = role === 'hod' && (user?.assignedSubjects || []).length > 0;
  const isCoordinator = role === 'coordinator';
  const canManageTasks = isTeacher || isHodTeacher || isCoordinator;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    category: '',
    semesterId: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Task',
    subjectId: '',
    dueDate: '',
    attachments: []
  });

  const token = localStorage.getItem('token');
  const tasksEndpoint = '/api/tasks/all';
  const submissionsBasePath = role === 'coordinator' ? '/coordinator' : role === 'hod' ? '/hod' : '/teacher';
  const panelLabel = role === 'admin'
    ? 'Admin Panel'
    : role === 'hod'
      ? 'HOD Panel'
      : role === 'coordinator'
        ? 'Coordinator Panel'
        : 'Teacher Panel';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Session expired. Please login again.');
      navigate('/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const profileRes = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      if (!profileData.success) {
        navigate('/login');
        return;
      }

      setUser(profileData.data);
      setRole(profileData.data.role);
      localStorage.setItem('user', JSON.stringify(profileData.data));
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    }
  }, [navigate, token]);

  const fetchMetadata = useCallback(async () => {
    try {
      const requests = [
        axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } })
      ];

      if (role === 'coordinator') {
        requests.push(axios.get('/api/academic/subjects/coordinator', { headers: { Authorization: `Bearer ${token}` } }));
      } else {
        if (!user?._id) return;
        requests.push(axios.get(`/api/academic/teacher/${user._id}/subjects`, { headers: { Authorization: `Bearer ${token}` } }));
      }

      const results = await Promise.all(requests);
      const semestersRes = results[0];
      const subjectsRes = results[1];

      if (semestersRes.data.success) setSemesters(semestersRes.data.data || []);

      if (subjectsRes?.data?.success) {
        const subjectData = subjectsRes.data.subjects || subjectsRes.data.data || [];
        setSubjects(subjectData);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching metadata:', error);
      }
    }
  }, [handleAuthError, role, token, user]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      };

      if (filters.category) params.category = filters.category;
      if (filters.semesterId) params.semesterId = filters.semesterId;

      const res = await axios.get(tasksEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setTasks(res.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0
        }));
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching tasks:', error);
        alert('Error fetching tasks');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, handleAuthError, pagination.limit, pagination.page, statusFilter, tasksEndpoint, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [fetchProfile, navigate, token]);

  useEffect(() => {
    if (!role) return;
    if (!canManageTasks) {
      navigate(`/${role}/dashboard`);
      return;
    }
    fetchMetadata();
  }, [canManageTasks, fetchMetadata, navigate, role]);

  useEffect(() => {
    if (!role) return;
    fetchTasks();
  }, [fetchTasks, role]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Task',
      subjectId: '',
      dueDate: '',
      attachments: []
    });
    setEditingTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'Task',
      subjectId: task.subjectId?._id || task.subjectId || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      attachments: task.attachments || []
    });
    setShowModal(true);
  };

  const handleSaveTask = async (status) => {
    if (!formData.title || !formData.description || !formData.subjectId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subjectId: formData.subjectId,
        dueDate: formData.dueDate || undefined,
        attachments: formData.attachments,
        status
      };

      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask._id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('/api/tasks/create', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setShowModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error saving task:', error);
        alert(error.response?.data?.message || 'Error saving task');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublishTask = async (taskId) => {
    try {
      const res = await axios.put(`/api/tasks/${taskId}`, { status: 'active' }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        fetchTasks();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error publishing task:', error);
        alert('Error publishing task');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        fetchTasks();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error deleting task:', error);
        alert('Error deleting task');
      }
    }
  };

  if (loading) {
    return (
      <RoleLayout
        title="Task Management"
        userName={user?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={panelLabel}
        profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <LoadingSpinner />
      </RoleLayout>
    );
  }

  if (!canManageTasks) {
    return (
      <RoleLayout
        title="Task Management"
        userName={user?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={panelLabel}
        profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <Card>
          <div className="text-center py-12 text-gray-600">
            Tasks are available only to subject teachers.
          </div>
        </Card>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Task Management"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-blue-500">assignment</span>
              Task Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Create drafts or publish tasks and assignments
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">Published</option>
              <option value="draft">Draft</option>
            </select>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              + Create Task
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="Task">Task</option>
            <option value="Assignment">Assignment</option>
            <option value="Custom">Custom</option>
          </select>

          <select
            value={filters.semesterId}
            onChange={(e) => setFilters((prev) => ({ ...prev, semesterId: e.target.value }))}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>{s.name || `Semester ${s.semesterNumber}`}</option>
            ))}
          </select>
        </div>

        <Card>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Created By</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{task.title}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                          {task.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === 'draft'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : task.status === 'deleted'
                            ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                            : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        }`}>
                          {task.status === 'active' ? 'published' : task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.subjectId?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.createdBy?.name}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => navigate(`${submissionsBasePath}/tasks/${task._id}/submissions`)}
                            className="text-slate-700 hover:text-slate-900 font-medium"
                          >
                            Submissions
                          </button>
                          <button
                            onClick={() => openEditModal(task)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          {task.status === 'draft' && (
                            <button
                              onClick={() => handlePublishTask(task._id)}
                              className="text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showModal && (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <div className="w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>

              <div className="space-y-4">
                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Task">Task</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subjectId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.code || subject.name} - {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</label>
                  <p className="text-xs text-gray-500 mb-2">Paste Google Drive, Dropbox, or other file sharing links</p>
                  <div className="space-y-2">
                    {formData.attachments.map((att, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name/Title"
                          value={att.name || ''}
                          onChange={(e) => {
                            const next = [...formData.attachments];
                            next[idx].name = e.target.value;
                            setFormData((prev) => ({ ...prev, attachments: next }));
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={att.url || ''}
                          onChange={(e) => {
                            const next = [...formData.attachments];
                            next[idx].url = e.target.value;
                            setFormData((prev) => ({ ...prev, attachments: next }));
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.attachments.filter((_, i) => i !== idx);
                            setFormData((prev) => ({ ...prev, attachments: next }));
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      attachments: [...prev.attachments, { name: '', url: '' }]
                    }))}
                    className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    + Add Link
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveTask('draft')}
                  disabled={saving}
                  variant="secondary"
                >
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSaveTask('active')}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Publish'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </RoleLayout>
  );
};

export default RoleTasks;
