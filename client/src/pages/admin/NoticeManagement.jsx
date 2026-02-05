import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, Button, Modal, Input, Card, LoadingSpinner } from '../../components';
import axios from 'axios';

const AdminNoticeManagement = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Normal',
    targetAudience: 'Everyone',
    attachments: []
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

  // Fetch notices
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      const res = await axios.get('/api/notices/admin', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setNotices(res.data.data);
        setPagination(prev => ({
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
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreateNotice = async () => {
    if (!formData.title || !formData.content) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const data = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        attachments: formData.attachments
      };

      const res = await axios.post('/api/notices/create', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Notice published successfully');
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          priority: 'Normal',
          targetAudience: 'Everyone',
          attachments: []
        });
        fetchNotices();
      }
    } catch (error) {
      console.error('Error creating notice:', error);
      alert(error.response?.data?.message || 'Error creating notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
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
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Notice Management" onLogout={handleLogout}>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Notice Management" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-red-500">notifications</span>
              Notice Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Publish announcements and notices to the college
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            + Publish Notice
          </Button>
        </div>

        {/* Notices Table */}
        <Card>
          {notices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No notices published yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Priority</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Audience</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Recipients</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map(notice => (
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
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{notice.targetAudience}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {notice.recipients?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleDeleteNotice(notice._id)}
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

        {/* Create Notice Modal */}
        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)} isOpen={true}>
            <div className="w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Publish Notice</h2>

              <div className="space-y-4">
                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notice title"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter notice content"
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Everyone">Everyone</option>
                      <option value="Students">Students Only</option>
                      <option value="Teachers">Teachers Only</option>
                      <option value="Staff">Staff Only</option>
                    </select>
                  </div>
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
                  onClick={handleCreateNotice}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {saving ? 'Publishing...' : 'Publish Notice'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNoticeManagement;
