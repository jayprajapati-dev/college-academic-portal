import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, Card, Badge, LoadingSpinner, Button, Modal } from '../../components';
import axios from 'axios';

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0
  });

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
        limit: pagination.limit,
        sortBy: filters.sortBy
      };

      if (filters.priority) params.priority = filters.priority;

      const res = await axios.get('/api/notices/board', {
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
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'red';
      case 'Normal':
        return 'blue';
      default:
        return 'green';
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Notice Board" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Notice Board" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-amber-500">notifications_active</span>
            Notice Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Latest announcements and notices from the administration
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
          <select
            value={filters.priority}
            onChange={(e) => { setFilters(prev => ({ ...prev, priority: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => { setFilters(prev => ({ ...prev, sortBy: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">High Priority First</option>
          </select>
        </div>

        {/* Notices Grid */}
        <div className="grid gap-4">
          {notices.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No notices to display</p>
              </div>
            </Card>
          ) : (
            notices.map(notice => (
              <Card
                key={notice._id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                style={{
                  borderLeftColor:
                    notice.priority === 'High'
                      ? '#ef4444'
                      : notice.priority === 'Normal'
                      ? '#3b82f6'
                      : '#10b981'
                }}
                onClick={() => setSelectedNotice(notice)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{notice.title}</h3>
                      <Badge variant={getPriorityColor(notice.priority)}>
                        {notice.priority}
                      </Badge>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {notice.content.substring(0, 200)}
                      {notice.content.length > 200 ? '...' : ''}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">group</span>
                        <span>{notice.targetAudience}</span>
                      </div>
                      {notice.attachments && notice.attachments.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">attachment</span>
                          <span>{notice.attachments.length} file(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNotice(notice);
                    }}
                    variant="secondary"
                    className="text-sm"
                  >
                    Read More
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
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

        {/* Notice Detail Modal */}
        {selectedNotice && (
          <Modal onClose={() => setSelectedNotice(null)}>
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedNotice.title}</h2>
                    <Badge variant={getPriorityColor(selectedNotice.priority)}>
                      {selectedNotice.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Published on {new Date(selectedNotice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Audience</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedNotice.targetAudience}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedNotice.content}</p>
                </div>

                {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attachments</h3>
                    <div className="space-y-2">
                      {selectedNotice.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          <span>{file.originalName}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedNotice(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </StudentLayout>
  );
};

export default NoticeBoard;
