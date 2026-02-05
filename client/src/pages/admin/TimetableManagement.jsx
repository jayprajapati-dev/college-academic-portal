import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, Button, Modal, Input, Card, LoadingSpinner } from '../../components';

const AdminTimetableManagement = () => {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
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

  const [grantData, setGrantData] = useState({
    userId: '',
    role: 'teacher'
  });

  const [filters, setFilters] = useState({
    semesterId: '',
    branchId: '',
    dayOfWeek: ''
  });

  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [hodList, setHodList] = useState([]);
  const [saving, setSaving] = useState(false);

  // Check user role on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/admin/dashboard');
      return;
    }
  }, [navigate]);

  // Fetch initial data
  const fetchMetadata = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [semRes, brRes, subjRes, teachRes, hodRes] = await Promise.all([
        axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users?role=teacher', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users?role=hod', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (semRes.data.success) setSemesters(semRes.data.data);
      if (brRes.data.success) setBranches(brRes.data.data);
      if (subjRes.data.success) setSubjects(subjRes.data.data);
      if (teachRes.data.success) setTeachers(teachRes.data.data);
      if (hodRes.data.success) setHodList(hodRes.data.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  }, []);

  // Fetch timetables
  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('No token found. Please login again.');
        navigate('/login');
        return;
      }

      const params = {};
      if (filters.semesterId) params.semesterId = filters.semesterId;
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.dayOfWeek) params.dayOfWeek = filters.dayOfWeek;

      const res = await axios.get('/api/timetable/all', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setTimetables(res.data.data || []);
      } else {
        setTimetables([]);
      }
    } catch (error) {
      console.error('Error fetching timetables:', error);
      if (error.response?.status === 401) {
        alert('Unauthorized. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to access timetables. Admin access required.');
        navigate('/admin/dashboard');
      } else if (error.response?.status === 404) {
        console.error('404 Error - API endpoint not found or data not available');
        setTimetables([]);
      } else {
        alert('Error fetching timetables: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  const handleCreateTimetable = async () => {
    if (
      !formData.semesterId ||
      !formData.branchId ||
      !formData.subjectId ||
      !formData.teacherId ||
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

  const handleGrantPermission = async () => {
    if (!grantData.userId) {
      alert('Please select a user');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const res = await axios.post(
        `/api/timetable/${selectedTimetable._id}/grant-permission`,
        grantData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert('Permission granted successfully');
        setShowGrantModal(false);
        setGrantData({ userId: '', role: 'teacher' });
        fetchTimetables();
      }
    } catch (error) {
      console.error('Error granting permission:', error);
      alert(error.response?.data?.message || 'Error granting permission');
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

  const handleRevokePermission = async (timetableId, userId) => {
    if (window.confirm('Are you sure you want to revoke this user\'s permission?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `/api/timetable/${timetableId}/revoke-permission`,
          { userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          alert('Permission revoked successfully');
          fetchTimetables();
        }
      } catch (error) {
        console.error('Error revoking permission:', error);
        alert('Error revoking permission');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Timetable Management" onLogout={() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }}>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <AdminLayout title="Timetable Management" onLogout={() => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Timetable Management</h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create Timetable Entry
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.semesterId}
              onChange={(e) => setFilters(prev => ({ ...prev, semesterId: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-900 bg-white">All Semesters</option>
              {semesters.map(s => (
                <option
                  key={s._id}
                  value={s._id}
                  className="text-gray-900 bg-white"
                >
                  {s.name || (s.semesterNumber ? `Semester ${s.semesterNumber}` : s.code || s._id)}
                </option>
              ))}
            </select>

            <select
              value={filters.branchId}
              onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-900 bg-white">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id} className="text-gray-900 bg-white">{b.name}</option>
              ))}
            </select>

            <select
              value={filters.dayOfWeek}
              onChange={(e) => setFilters(prev => ({ ...prev, dayOfWeek: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-900 bg-white">All Days</option>
              {days.map(day => (
                <option key={day} value={day} className="text-gray-900 bg-white">{day}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Timetables List */}
        <Card className="bg-white dark:bg-gray-800 p-6">
          {timetables.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No timetable entries found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Day</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Teacher</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Room</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.map(tt => (
                    <tr key={tt._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{tt.dayOfWeek}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.startTime} - {tt.endTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.subjectId?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.teacherId?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.roomNo}</td>
                      <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">{tt.lectureType}</span></td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTimetable(tt);
                            setShowGrantModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Grant Access
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

          {/* Current Permissions */}
          {selectedTimetable && selectedTimetable.canBeModifiedBy?.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Users with Edit Access for {selectedTimetable.subjectId?.name}
              </h3>
              <div className="space-y-2">
                {selectedTimetable.canBeModifiedBy.map(perm => (
                  <div
                    key={perm.userId}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {perm.role === 'hod' ? 'HOD' : 'Teacher'} - Granted {new Date(perm.grantedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleRevokePermission(selectedTimetable._id, perm.userId)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} isOpen={true}>
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Timetable Entry</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fill in class details and schedule</p>
              </div>
              <div className="shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/40 px-3 py-2 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                Timetable
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Academic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Semester *</label>
                  <select
                    value={formData.semesterId}
                    onChange={(e) => setFormData(prev => ({ ...prev, semesterId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="" className="text-gray-900 bg-white">Select Semester</option>
                    {semesters.map(s => (
                      <option
                        key={s._id}
                        value={s._id}
                        className="text-gray-900 bg-white"
                      >
                        {s.name || (s.semesterNumber ? `Semester ${s.semesterNumber}` : s.code || s._id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Branch *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="" className="text-gray-900 bg-white">Select Branch</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id} className="text-gray-900 bg-white">{b.name}</option>
                    ))}
                  </select>
                </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Class Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="" className="text-gray-900 bg-white">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id} className="text-gray-900 bg-white">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Teacher *</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="" className="text-gray-900 bg-white">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id} className="text-gray-900 bg-white">{t.name}</option>
                    ))}
                  </select>
                </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Day *</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day} className="text-gray-900 bg-white">{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Room Number *</label>
                  <Input
                    value={formData.roomNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                    placeholder="e.g., A101, Lab-1"
                  />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Start Time *</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Lecture Type</label>
                    <select
                      value={formData.lectureType}
                      onChange={(e) => setFormData(prev => ({ ...prev, lectureType: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Theory" className="text-gray-900 bg-white">Theory</option>
                      <option value="Practical" className="text-gray-900 bg-white">Practical</option>
                      <option value="Tutorial" className="text-gray-900 bg-white">Tutorial</option>
                      <option value="Lab" className="text-gray-900 bg-white">Lab</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
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
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                {saving ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Grant Permission Modal */}
      {showGrantModal && selectedTimetable && (
        <Modal onClose={() => {
          setShowGrantModal(false);
          setSelectedTimetable(null);
        }} isOpen={true}>
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Grant Edit Access - {selectedTimetable.subjectId?.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Role *</label>
                <select
                  value={grantData.role}
                  onChange={(e) => setGrantData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="teacher" className="text-gray-900 bg-white">Teacher</option>
                  <option value="hod" className="text-gray-900 bg-white">HOD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Select User *</label>
                <select
                  value={grantData.userId}
                  onChange={(e) => setGrantData(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="" className="text-gray-900 bg-white">Select {grantData.role === 'hod' ? 'HOD' : 'Teacher'}</option>
                  {(grantData.role === 'hod' ? hodList : teachers).map(u => (
                    <option key={u._id} value={u._id} className="text-gray-900 bg-white">{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedTimetable(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGrantPermission}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Granting...' : 'Grant Access'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default AdminTimetableManagement;
