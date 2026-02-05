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

  const handleReply = async (messageId) => {
    if (!replyMessage.trim()) {
      alert('Please enter a reply message');
      return;
    }

    setReplyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/contact/${messageId}/reply`,
        { replyMessage },
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

  const applyFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const getEditorContent = () => {
    return editorRef.current?.innerHTML || '';
  };

  const handleSendReply = () => {
    const content = getEditorContent();
    setReplyMessage(content);
    
    // Use timeout to ensure state is updated
    setTimeout(() => {
      handleReply(selectedMessage._id);
    }, 100);
  };

  const getRoleBadge = (role) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      teacher: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hod: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'pending' 
      ? <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold rounded-full">Pending</span>
      : <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold rounded-full">Replied</span>;
  };

  return (
    <AdminLayout title="Contact Requests" onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Contact Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user inquiries and contact requests</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon="mail"
            label="Total Messages"
            value={stats.total}
            bgColor="bg-blue-500"
          />
          <StatsCard
            icon="pending"
            label="Pending"
            value={stats.pending}
            bgColor="bg-yellow-500"
          />
          <StatsCard
            icon="check_circle"
            label="Replied"
            value={stats.replied}
            bgColor="bg-green-500"
          />
        </div>

        {/* Filter Tabs */}
        <Card>
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'pending'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('replied')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'replied'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
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
            <div className="space-y-4 mt-6">
              {messages.map((msg, index) => (
                <div key={msg._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-primary">#{index + 1}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{msg.userId?.name}</h3>
                          {getRoleBadge(msg.userId?.role)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{msg.userId?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(msg.status)}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Subject:</p>
                    <p className="font-bold">{msg.subject}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Message:</p>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {msg.status === 'replied' && msg.reply ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                        Reply from {msg.reply.repliedBy?.name}:
                      </p>
                      <div 
                        className="text-sm prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: msg.reply.message }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(msg.reply.repliedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedMessage(msg);
                        setReplyMessage('');
                        if (editorRef.current) {
                          editorRef.current.innerHTML = '';
                        }
                      }}
                      className="w-full"
                    >
                      <span className="material-symbols-outlined text-sm mr-2">reply</span>
                      Reply to this message
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Reply to Message</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Original Message from {selectedMessage.userId?.name}:</p>
                <p className="text-sm mb-2"><strong>Subject:</strong> {selectedMessage.subject}</p>
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {/* Rich Text Editor Toolbar */}
              <div>
                <label className="block text-sm font-bold mb-2">Your Reply:</label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 flex flex-wrap gap-1 border-b border-gray-300 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-sm"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('italic')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 italic text-sm"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('underline')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 underline text-sm"
                      title="Underline"
                    >
                      U
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormatting('insertUnorderedList')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                      title="Bullet List"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('insertOrderedList')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                      title="Numbered List"
                    >
                      1. List
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormatting('formatBlock', '<h3>')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-sm"
                      title="Heading"
                    >
                      H
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('formatBlock', '<p>')}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                      title="Paragraph"
                    >
                      P
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        if (editorRef.current) {
                          editorRef.current.innerHTML = '';
                        }
                      }}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded hover:bg-red-100 dark:hover:bg-red-900 text-sm text-red-600"
                      title="Clear"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Editor Content */}
                  <div
                    ref={editorRef}
                    contentEditable
                    className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    style={{ whiteSpace: 'pre-wrap' }}
                    suppressContentEditableWarning
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedMessage(null)}
                  disabled={replyLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={replyLoading}
                >
                  {replyLoading ? 'Sending...' : 'Send Reply'}
                  <span className="material-symbols-outlined text-sm ml-2">send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ContactManagement;
