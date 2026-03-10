import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import { StatsCard } from '../../components/Card';
import Button from '../../components/Button';

const ContactManagement = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/contact/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? '/api/contact/all'
        : `/api/contact/all?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStats();
    fetchMessages();
  }, [filter, fetchMessages]);

  const handleReply = async (messageId, content) => {
    const finalReply = (content ?? replyMessage ?? '').trim();
    if (!finalReply) {
      alert('Please enter a reply message');
      return;
    }

    setReplyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/contact/${messageId}/reply`,
        { replyMessage: finalReply },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Reply sent successfully!');
        setSelectedMessage(null);
        setReplyMessage('');
        fetchMessages();
        fetchStats();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    savedSelectionRef.current = selection.getRangeAt(0);
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  };

  const applyFormatting = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    editorRef.current.focus();
  };

  const getEditorContent = () => {
    return editorRef.current?.innerHTML || '';
  };

  const handleSendReply = () => {
    const content = getEditorContent().trim();
    setReplyMessage(content);
    handleReply(selectedMessage._id, content);
  };

  const getRoleBadge = (role) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      teacher: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hod: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'pending' 
      ? <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold rounded-full">Pending</span>
      : <span className="px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold rounded-full">Replied</span>;
  };

  const isReadOnlyReply = selectedMessage?.status === 'replied' && !!selectedMessage?.reply?.message;

  return (
    <AdminLayout title="Contact Requests" onLogout={handleLogout}>
      <div className="space-y-4 sm:space-y-5">
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Contact Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Manage user inquiries, track status, and send professional replies.</p>
            </div>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-indigo-700 border border-indigo-100 dark:bg-gray-700 dark:text-indigo-200 dark:border-gray-600">
              Admin Workspace
            </span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatsCard
            icon="mail"
            label="Total Messages"
            value={stats.total}
            bgColor="bg-blue-500"
            compact
          />
          <StatsCard
            icon="pending"
            label="Pending"
            value={stats.pending}
            bgColor="bg-yellow-500"
            compact
          />
          <StatsCard
            icon="check_circle"
            label="Replied"
            value={stats.replied}
            bgColor="bg-green-500"
            compact
          />
        </div>

        {/* Filter Tabs */}
        <Card>
          <div className="flex flex-nowrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('replied')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border whitespace-nowrap ${
                filter === 'replied'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Replied
            </button>
          </div>

          {/* Messages List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">mail_outline</span>
              <p className="text-gray-600 dark:text-gray-400">No messages found</p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-[980px]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">Name</th>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">Email</th>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">Date</th>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">Subject</th>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">Message</th>
                    <th className="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-gray-600">Status</th>
                    <th className="px-3 py-2.5 text-right text-xs font-black uppercase tracking-wide text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {messages.map((msg, index) => (
                    <tr key={msg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors align-top">
                      <td className="px-3 py-2.5 text-sm font-bold text-primary">#{index + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{msg.userId?.name || 'User'}</p>
                          {getRoleBadge(msg.userId?.role)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 break-all">{msg.userId?.email || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[220px]">
                        <p className="truncate">{msg.subject || '-'}</p>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 max-w-[280px]">
                        <p className="line-clamp-2 whitespace-pre-wrap">{msg.message || '-'}</p>
                      </td>
                      <td className="px-3 py-2.5">{getStatusBadge(msg.status)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-2">
                          {msg.status === 'replied' && msg.reply ? (
                            <button
                              onClick={() => {
                                setSelectedMessage(msg);
                                setReplyMessage(msg.reply?.message || '');
                                savedSelectionRef.current = null;
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700"
                            >
                              View Reply
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedMessage(msg);
                                setReplyMessage('');
                                if (editorRef.current) editorRef.current.innerHTML = '';
                                savedSelectionRef.current = null;
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white border border-primary hover:opacity-90"
                            >
                              Reply
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-cyan-500">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Reply to Message</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-white/90 hover:text-white"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]">
              {/* Original Message */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Original Message from {selectedMessage.userId?.name}:</p>
                <p className="text-sm mb-2"><strong>Subject:</strong> {selectedMessage.subject}</p>
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {isReadOnlyReply ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border-l-4 border-emerald-500">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                    Reply from {selectedMessage.reply?.repliedBy?.name || 'Admin'}:
                  </p>
                  <div
                    className="text-sm prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.reply?.message || '' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedMessage.reply?.repliedAt
                      ? new Date(selectedMessage.reply.repliedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : ''}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold mb-2">Your Reply:</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 flex flex-wrap gap-1 border-b border-gray-300 dark:border-gray-600">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('bold')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xs sm:text-sm"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('italic')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 italic text-xs sm:text-sm"
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('underline')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 underline text-xs sm:text-sm"
                        title="Underline"
                      >
                        U
                      </button>
                      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('insertUnorderedList')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-xs sm:text-sm"
                        title="Bullet List"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('insertOrderedList')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-xs sm:text-sm"
                        title="Numbered List"
                      >
                        1. List
                      </button>
                      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('formatBlock', 'H3')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xs sm:text-sm"
                        title="Heading"
                      >
                        H
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormatting('formatBlock', 'P')}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-xs sm:text-sm"
                        title="Paragraph"
                      >
                        P
                      </button>
                      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (editorRef.current) {
                            editorRef.current.innerHTML = '';
                            setReplyMessage('');
                            savedSelectionRef.current = null;
                          }
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded hover:bg-red-100 dark:hover:bg-red-900 text-xs sm:text-sm text-red-600"
                        title="Clear"
                      >
                        Clear
                      </button>
                    </div>

                    <div
                      ref={editorRef}
                      contentEditable
                      onMouseUp={saveSelection}
                      onKeyUp={saveSelection}
                      onInput={() => setReplyMessage(getEditorContent())}
                      className="p-4 min-h-[180px] max-h-[360px] overflow-y-auto focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      style={{ whiteSpace: 'pre-wrap' }}
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedMessage(null)}
                  disabled={replyLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                {!isReadOnlyReply && (
                  <Button
                    onClick={handleSendReply}
                    disabled={replyLoading}
                    className="w-full sm:w-auto"
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                    <span className="material-symbols-outlined text-sm ml-2">send</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ContactManagement;
