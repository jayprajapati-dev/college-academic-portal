import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, LoadingSpinner, Modal, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';
import axios from 'axios';

const RoleNotices = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Normal',
    targetAudience: 'Everyone',
    targetRoles: [],
    attachments: []
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
          navigate('/login');
          return;
        }

        setUser(data.data);
        setRole(data.data.role);
      } catch (error) {
        console.error('Profile error:', error);
        navigate('/login');
      }
    };

    loadProfile();
  }, [navigate]);

  const noticesEndpoint = role === 'teacher'
    ? '/api/notices/teacher'
    : role === 'coordinator'
      ? '/api/notices/coordinator'
      : '/api/notices/admin';

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      };

      const res = await axios.get(noticesEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setNotices(res.data.data);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      alert('Error fetching notices');
    } finally {
      setLoading(false);
    }
  }, [noticesEndpoint, pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    if (!role) return;
    fetchNotices();
  }, [role, fetchNotices]);

  const audienceOptions = useMemo(() => {
    return [
      { value: 'hod', label: 'HODs' },
      { value: 'teacher', label: 'Teachers' },
      { value: 'coordinator', label: 'Coordinators' },
      { value: 'student', label: 'Students' }
    ];
  }, []);

  const allAudienceValues = useMemo(() => audienceOptions.map((option) => option.value), [audienceOptions]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'Normal',
      targetAudience: 'Everyone',
      targetRoles: allAudienceValues,
      attachments: []
    });
    setEditingNotice(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (notice) => {
    const rolesFromNotice = Array.isArray(notice.targetRoles) && notice.targetRoles.length > 0
      ? notice.targetRoles
      : notice.targetAudience === 'Everyone'
        ? allAudienceValues
        : notice.targetAudience === 'Students'
          ? ['student']
          : notice.targetAudience === 'Teachers'
            ? ['teacher']
            : notice.targetAudience === 'Staff'
              ? ['hod']
              : [];

    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      priority: notice.priority || 'Normal',
      targetAudience: notice.targetAudience || 'Everyone',
      targetRoles: rolesFromNotice,
      attachments: notice.attachments || []
    });
    setShowModal(true);
  };

  const handleSaveNotice = async (status) => {
    if (!formData.title || !formData.content) {
      alert('Please fill all required fields');
      return;
    }

    if (!formData.targetRoles || formData.targetRoles.length === 0) {
      alert('Please select at least one recipient group');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        targetAudience: formData.targetRoles.length === allAudienceValues.length ? 'Everyone' : 'Selected',
        targetRoles: formData.targetRoles,
        attachments: formData.attachments,
        status
      };

      if (editingNotice) {
        const res = await axios.put(`/api/notices/${editingNotice._id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.data.success) {
          alert(status === 'draft' ? 'Notice updated' : 'Notice published successfully');
        }
      } else {
        const res = await axios.post('/api/notices/create', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.data.success) {
          alert(status === 'draft' ? 'Notice saved as draft' : 'Notice published successfully');
        }
      }

      setShowModal(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert(error.response?.data?.message || 'Error saving notice');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNotice = async (noticeId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/notices/${noticeId}`, { status: 'published' }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert('Notice published successfully');
        fetchNotices();
      }
    } catch (error) {
      console.error('Error publishing notice:', error);
      alert('Error publishing notice');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/notices/${noticeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert('Notice deleted successfully');
        fetchNotices();
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Error deleting notice');
    }
  };

  if (loading) {
    return (
      <RoleLayout
        title="Notice Management"
        userName={user?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : role === 'coordinator' ? 'Coordinator Panel' : 'Teacher Panel'}
        profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <LoadingSpinner />
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Notice Management"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : role === 'coordinator' ? 'Coordinator Panel' : 'Teacher Panel'}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-red-500">notifications</span>
              Notice Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Create drafts or publish notices to your audience
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <Button onClick={openCreateModal} className="bg-red-600 hover:bg-red-700">
              + Create Notice
            </Button>
          </div>
        </div>

        <Card>
          {notices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No notices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Priority</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Audience</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Recipients</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((notice) => (
                    <tr key={notice._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{notice.title}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          notice.priority === 'High'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : notice.priority === 'Normal'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                          {notice.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          notice.status === 'draft'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : notice.status === 'archived'
                            ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                            : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        }`}>
                          {notice.status || 'published'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {Array.isArray(notice.targetRoles) && notice.targetRoles.length > 0
                          ? notice.targetRoles.length === allAudienceValues.length
                            ? 'All'
                            : notice.targetRoles
                              .map((roleKey) => audienceOptions.find((option) => option.value === roleKey)?.label || roleKey)
                              .join(', ')
                          : notice.targetAudience}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {notice.recipients?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-3">
                          {notice.status === 'draft' && (
                            <button
                              onClick={() => handlePublishNotice(notice._id)}
                              className="text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(notice)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(notice._id)}
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

        {pagination.total > pagination.limit && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{editingNotice ? 'Edit Notice' : 'Create Notice'}</h2>
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Send To</label>
                <div className="border rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.length === allAudienceValues.length}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          targetRoles:
                            prev.targetRoles.length === allAudienceValues.length ? [] : allAudienceValues
                        }))
                      }
                    />
                    All
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {audienceOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.targetRoles.includes(option.value)}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              targetRoles: prev.targetRoles.includes(option.value)
                                ? prev.targetRoles.filter((item) => item !== option.value)
                                : [...prev.targetRoles, option.value]
                            }))
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {role === 'admin'
                      ? 'Admin notices go to selected roles across the system.'
                      : role === 'hod'
                        ? 'HOD notices go to selected roles within your branch.'
                        : 'Teacher notices go to selected roles within your assigned branch/semester.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleSaveNotice('draft')}
                className="bg-gray-200 text-gray-900 hover:bg-gray-300"
                disabled={saving}
              >
                Save Draft
              </Button>
              <Button
                onClick={() => handleSaveNotice('published')}
                className="bg-red-600 hover:bg-red-700"
                disabled={saving}
              >
                Publish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </RoleLayout>
  );
};

export default RoleNotices;
