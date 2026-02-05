import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, Button, Modal, Input, Card, LoadingSpinner } from '../../components';
import axios from 'axios';

const AdminTaskManagement = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Task',
    subjectId: '',
    dueDate: '',
    attachments: []
  });
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    branchId: '',
    semesterId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filters.category) params.category = filters.category;
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.semesterId) params.semesterId = filters.semesterId;

      const res = await axios.get('/api/tasks/all', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setTasks(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch branches and semesters
  const fetchMetadata = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [branchRes, semesterRes, subjectRes] = await Promise.all([
        axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (branchRes.data.success) setBranches(branchRes.data.data);
      if (semesterRes.data.success) setSemesters(semesterRes.data.data);
      if (subjectRes.data.success) setSubjects(subjectRes.data.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!formData.title || !formData.description || !formData.subjectId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Prepare data with links-based attachments
      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subjectId: formData.subjectId,
        attachments: formData.attachments  // Array of {name, url}
      };
      
      if (formData.dueDate) data.dueDate = formData.dueDate;

      const res = await axios.post('/api/tasks/create', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Task created successfully');
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          category: 'Task',
          subjectId: '',
          dueDate: '',
          attachments: []
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Error creating task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          alert('Task deleted successfully');
          fetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Task Management" onLogout={handleLogout}>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Task Management" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-blue-500">assignment</span>
              Task Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Manage subject tasks, assignments, and custom items
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
          <select
            value={filters.category}
            onChange={(e) => { setFilters(prev => ({ ...prev, category: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="Task">Task</option>
            <option value="Assignment">Assignment</option>
            <option value="Custom">Custom</option>
          </select>

          <select
            value={filters.branchId}
            onChange={(e) => { setFilters(prev => ({ ...prev, branchId: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>

          <select
            value={filters.semesterId}
            onChange={(e) => { setFilters(prev => ({ ...prev, semesterId: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Semesters</option>
            {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        {/* Tasks Table */}
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Created By</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{task.title}</td>
                      <td className="px-6 py-4 text-sm"><span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">{task.category}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.subjectId?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.createdBy?.name}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Create Task Modal */}
        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)} isOpen={true}>
            <div className="w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Task</h2>

              <div className="space-y-4">
                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Task">Task</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <Input
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="" className="text-gray-900 bg-white">Select Subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id} className="text-gray-900 bg-white">{s.name} ({s.code})</option>)}
                  </select>
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
                            const newAttachments = [...formData.attachments];
                            newAttachments[idx].name = e.target.value;
                            setFormData(prev => ({ ...prev, attachments: newAttachments }));
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={att.url || ''}
                          onChange={(e) => {
                            const newAttachments = [...formData.attachments];
                            newAttachments[idx].url = e.target.value;
                            setFormData(prev => ({ ...prev, attachments: newAttachments }));
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newAttachments = formData.attachments.filter((_, i) => i !== idx);
                            setFormData(prev => ({ ...prev, attachments: newAttachments }));
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
                    onClick={() => setFormData(prev => ({ ...prev, attachments: [...prev.attachments, { name: '', url: '' }] }))}
                    className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    + Add Link
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTaskManagement;
