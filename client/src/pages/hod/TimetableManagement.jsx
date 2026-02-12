import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, Modal, Input, Card, LoadingSpinner, HodLayout } from '../../components';

const HodTeacherTimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    semesterId: '',
    branchId: '',
    subjectId: '',
    teacherId: '',
    roomNo: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    lectureType: 'Theory',
    notes: ''
  });

  const [filters, setFilters] = useState({
    dayOfWeek: ''
  });

  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Get user info and fetch metadata
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    const fetchMetadata = async () => {
      try {
        const token = localStorage.getItem('token');
        const [subjRes] = await Promise.all([
          axios.get('/api/academic/subjects', { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetadata();
  }, []);

  // Fetch timetables
  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};
      if (filters.dayOfWeek) params.dayOfWeek = filters.dayOfWeek;

      const res = await axios.get('/api/timetable/my-schedule', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) setTimetables(res.data.data);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  const handleCreateTimetable = async () => {
    if (
      !formData.semesterId ||
      !formData.branchId ||
      !formData.subjectId ||
      !formData.roomNo ||
      !formData.dayOfWeek ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const res = await axios.post('/api/timetable/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert('Timetable entry created successfully');
        setShowCreateModal(false);
        setFormData({
          semesterId: '',
          branchId: '',
          subjectId: '',
          teacherId: '',
          roomNo: '',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
          lectureType: 'Theory',
          notes: ''
        });
        fetchTimetables();
      }
    } catch (error) {
      console.error('Error creating timetable:', error);
      alert(error.response?.data?.message || 'Error creating timetable entry');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTimetable = async () => {
    if (!selectedTimetable) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const updateData = {
        roomNo: formData.roomNo,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        lectureType: formData.lectureType,
        notes: formData.notes
      };

      const res = await axios.put(
        `/api/timetable/${selectedTimetable._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert('Timetable entry updated successfully');
        setShowEditModal(false);
        setSelectedTimetable(null);
        fetchTimetables();
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      alert(error.response?.data?.message || 'Error updating timetable entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (window.confirm('Are you sure you want to cancel this timetable entry?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`/api/timetable/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          alert('Timetable entry cancelled successfully');
          fetchTimetables();
        }
      } catch (error) {
        console.error('Error deleting timetable:', error);
        alert('Error cancelling timetable entry');
      }
    }
  };

  const openEditModal = (timetable) => {
    setSelectedTimetable(timetable);
    setFormData({
      semesterId: timetable.semesterId?._id || '',
      branchId: timetable.branchId?._id || '',
      subjectId: timetable.subjectId?._id || '',
      teacherId: timetable.teacherId?._id || '',
      roomNo: timetable.roomNo,
      dayOfWeek: timetable.dayOfWeek,
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      lectureType: timetable.lectureType,
      notes: timetable.notes || ''
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <HodLayout title="Timetable Management" userName={user?.name || 'HOD'} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </HodLayout>
    );
  }

  return (
    <HodLayout title="Timetable Management" userName={user?.name || 'HOD'} onLogout={handleLogout}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Timetable Management
            </h2>
            {user && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {user.branch} - {user.name}
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setShowCreateModal(true);
              // Set current user's semester and branch
              if (user) {
                setFormData(prev => ({
                  ...prev,
                  semesterId: user.semester,
                  branchId: user.branch,
                  teacherId: user._id
                }));
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create Timetable Entry
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Day:
              </label>
              <select
                value={filters.dayOfWeek}
                onChange={(e) => setFilters(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Days</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Timetables List */}
        <Card className="bg-white dark:bg-gray-800 p-6">
          {timetables.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No timetable entries found. Create one to get started!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Day</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Room</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.map(tt => (
                    <tr key={tt._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{tt.dayOfWeek}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.startTime} - {tt.endTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.subjectId?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.roomNo}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {tt.lectureType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => openEditModal(tt)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTimetable(tt._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create Timetable Entry
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Number *</label>
                  <Input
                    value={formData.roomNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                    placeholder="e.g., A101, Lab-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day *</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecture Type</label>
                  <select
                    value={formData.lectureType}
                    onChange={(e) => setFormData(prev => ({ ...prev, lectureType: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Lab">Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
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
                onClick={handleCreateTimetable}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTimetable && (
        <Modal onClose={() => {
          setShowEditModal(false);
          setSelectedTimetable(null);
        }}>
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Edit Timetable Entry
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTimetable.subjectId?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Number *</label>
                  <Input
                    value={formData.roomNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day *</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecture Type</label>
                <select
                  value={formData.lectureType}
                  onChange={(e) => setFormData(prev => ({ ...prev, lectureType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTimetable(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTimetable}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Updating...' : 'Update Entry'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </main>
    </HodLayout>
  );
};

export default HodTeacherTimetableManagement;
