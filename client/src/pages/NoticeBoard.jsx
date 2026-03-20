import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, Card, Badge, LoadingSpinner, Button, Modal } from '../components';
import axios from 'axios';

const PRIORITY_RANK = {
  High: 3,
  Normal: 2,
  Low: 1
};

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [notificationFeed, setNotificationFeed] = useState([]);
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
  const authRedirectedRef = useRef(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAuthError = useCallback((error) => {
    if (authRedirectedRef.current) return true;

    if (error?.response?.status === 401 || error?.message?.includes('401')) {
      authRedirectedRef.current = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
      return true;
    }

    return false;
  }, [navigate]);

  // Fetch notices
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        handleAuthError({ response: { status: 401 } });
        return;
      }
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy
      };

      if (filters.priority) params.priority = filters.priority;

      const [noticeRes, notificationRes] = await Promise.all([
        axios.get('/api/notices/board', {
          headers: { Authorization: `Bearer ${token}` },
          params
        }),
        axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (noticeRes.data.success) {
        setNotices(noticeRes.data.data);
        setPagination(prev => ({
          ...prev,
          total: noticeRes.data.total
        }));
      }

      if (notificationRes.data?.success && Array.isArray(notificationRes.data.data)) {
        setNotificationFeed(notificationRes.data.data);
      } else {
        setNotificationFeed([]);
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, handleAuthError, pagination.limit, pagination.page]);

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

  const normalizedNotifications = useMemo(() => (
    notificationFeed
      .filter((item) => !item?.isNotice && item?.type !== 'Notice')
      .map((item) => ({
        ...item,
        sourceType: 'notification',
        content: item.message,
        targetAudience: `${item.type || 'General'} Alert`,
        priority: (item.isRead ?? item.read) ? 'Low' : 'Normal',
        attachments: []
      }))
  ), [notificationFeed]);

  const hasOfficialNotices = notices.length > 0;

  const fallbackItems = useMemo(() => {
    const items = [...normalizedNotifications];

    const filtered = filters.priority
      ? items.filter((item) => item.priority === filters.priority)
      : items;

    filtered.sort((left, right) => {
      if (filters.sortBy === 'oldest') {
        return new Date(left.createdAt) - new Date(right.createdAt);
      }

      if (filters.sortBy === 'priority') {
        const rankDelta = (PRIORITY_RANK[right.priority] || 0) - (PRIORITY_RANK[left.priority] || 0);
        if (rankDelta !== 0) return rankDelta;
      }

      return new Date(right.createdAt) - new Date(left.createdAt);
    });

    return filtered;
  }, [filters.priority, filters.sortBy, normalizedNotifications]);

  const totalItems = hasOfficialNotices ? pagination.total : fallbackItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  const boardItems = useMemo(() => {
    if (hasOfficialNotices) {
      return notices.map((notice) => ({ ...notice, sourceType: 'notice' }));
    }

    const startIndex = (pagination.page - 1) * pagination.limit;
    return fallbackItems.slice(startIndex, startIndex + pagination.limit);
  }, [fallbackItems, hasOfficialNotices, notices, pagination.limit, pagination.page]);

  useEffect(() => {
    if (pagination.page > totalPages) {
      setPagination((prev) => ({ ...prev, page: totalPages }));
    }
  }, [pagination.page, totalPages]);

  const unreadAlerts = normalizedNotifications.filter((item) => !(item.isRead ?? item.read)).length;

  const getItemBadgeText = (item) => (
    item?.sourceType === 'notification' ? (item?.type || 'Alert') : (item?.priority || 'Normal')
  );

  const getItemBadgeVariant = (item) => {
    if (item?.sourceType === 'notification') {
      return (item?.isRead ?? item?.read) ? 'green' : 'blue';
    }
    return getPriorityColor(item?.priority);
  };

  const getItemAudience = (item) => (
    item?.sourceType === 'notification' ? 'Personal Alert' : item?.targetAudience
  );

  const getItemPreview = (item) => {
    const text = item?.content || item?.message || '';
    return text.length > 200 ? `${text.substring(0, 200)}...` : text;
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
        <section className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#194ce6] to-[#0ea5e9] px-5 py-5 sm:px-6 sm:py-6 text-white shadow-[0_28px_60px_-28px_rgba(25,76,230,0.65)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-blue-100">Student Alerts Center</p>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[30px] sm:text-[34px] text-amber-300">notifications_active</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Notice Board</h1>
                  <p className="text-sm text-blue-100">Compact notice and notification view with faster scanning.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 xl:min-w-[360px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100">Visible</p>
                <p className="mt-1 text-xl font-black">{totalItems}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100">Unread</p>
                <p className="mt-1 text-xl font-black">{unreadAlerts}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100">Source</p>
                <p className="mt-1 text-sm sm:text-base font-black">{hasOfficialNotices ? 'Official' : 'Alerts'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E2E8F0] bg-white/95 backdrop-blur shadow-[0_20px_55px_-35px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#EAEFF6] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">{hasOfficialNotices ? 'Official Notices' : 'Personal Notifications'}</h2>
              <p className="text-xs sm:text-sm text-[#64748B]">Dense table view for quicker reading and less scrolling.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[420px]">
          <select
            value={filters.priority}
            onChange={(e) => { setFilters(prev => ({ ...prev, priority: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 h-11 px-4 rounded-xl border border-[#D7E0EC] bg-[#F8FAFC] text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => { setFilters(prev => ({ ...prev, sortBy: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 h-11 px-4 rounded-xl border border-[#D7E0EC] bg-[#F8FAFC] text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">High Priority First</option>
          </select>
            </div>
          </div>

          {boardItems.length === 0 ? (
            <Card className="m-4 sm:m-5 border border-dashed border-[#D8E1EC] shadow-none">
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No notices to display</p>
              </div>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] sm:min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#EAEFF6] bg-[#F8FAFC] text-[11px] uppercase tracking-[0.18em] text-[#64748B]">
                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-bold">Title</th>
                    <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">Type</th>
                    <th className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-3 font-bold">Audience</th>
                    <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">Date</th>
                    <th className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-3 font-bold">Files</th>
                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {boardItems.map((notice) => (
                    <tr
                      key={notice._id}
                      className="border-b border-[#EEF2F7] hover:bg-[#FAFCFF] transition-colors"
                    >
                      <td className="px-3 sm:px-5 py-2.5 sm:py-3 align-top">
                        <button
                          onClick={() => {
                            if (notice.sourceType === 'notification' && notice.actionUrl) {
                              navigate(notice.actionUrl);
                              return;
                            }
                            setSelectedNotice(notice);
                          }}
                          className="text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notice.sourceType === 'notification' ? ((notice.isRead ?? notice.read) ? 'bg-emerald-500' : 'bg-blue-500') : notice.priority === 'High' ? 'bg-rose-500' : notice.priority === 'Normal' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#194ce6] transition-colors">{notice.title}</p>
                              <p className="mt-1 max-w-[220px] sm:max-w-[380px] text-[11px] sm:text-xs text-[#64748B] line-clamp-1 sm:line-clamp-2">{getItemPreview(notice)}</p>
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 align-top">
                        <Badge variant={getItemBadgeVariant(notice)}>
                          {getItemBadgeText(notice)}
                        </Badge>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-3 align-top text-sm font-semibold text-[#475569]">{getItemAudience(notice)}</td>
                      <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 align-top text-xs sm:text-sm text-[#475569] whitespace-nowrap">{new Date(notice.createdAt).toLocaleDateString()}</td>
                      <td className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-3 align-top text-sm text-[#475569] whitespace-nowrap">{notice.attachments?.length || 0} files</td>
                      <td className="px-3 sm:px-5 py-2.5 sm:py-3 align-top text-right">
                        <Button
                          onClick={() => {
                            if (notice.sourceType === 'notification' && notice.actionUrl) {
                              navigate(notice.actionUrl);
                              return;
                            }
                            setSelectedNotice(notice);
                          }}
                          variant="secondary"
                          className="text-xs sm:text-sm px-2.5 sm:px-3"
                        >
                          {notice.sourceType === 'notification' && notice.actionUrl ? 'Open' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {boardItems.length > 0 && totalItems > pagination.limit && (
            <div className="flex flex-col gap-3 border-t border-[#EAEFF6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm font-semibold text-[#64748B]">
                Showing page {pagination.page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-xl border border-[#D7E0EC] bg-white text-sm font-semibold text-[#334155] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= totalPages}
                  className="px-4 py-2 rounded-xl border border-[#D7E0EC] bg-[#0F172A] text-sm font-semibold text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Notice Detail Modal */}
        {selectedNotice && (
          <Modal onClose={() => setSelectedNotice(null)}>
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedNotice.title}</h2>
                    <Badge variant={getItemBadgeVariant(selectedNotice)}>
                      {getItemBadgeText(selectedNotice)}
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
                  <p className="text-gray-600 dark:text-gray-400">{getItemAudience(selectedNotice)}</p>
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
                          <span>{file.name || 'Attachment'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                {selectedNotice?.sourceType === 'notification' && selectedNotice?.actionUrl && (
                  <Button
                    onClick={() => navigate(selectedNotice.actionUrl)}
                  >
                    Open Related Page
                  </Button>
                )}
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
