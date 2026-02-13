import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, LoadingSpinner, Modal, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleTimetable = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const isAdmin = role === 'admin';
  const isHod = role === 'hod';
  const isTeacher = role === 'teacher';

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const token = localStorage.getItem('token');
  const panelLabel = isAdmin ? 'Admin Panel' : isHod ? 'HOD Panel' : 'Teacher Panel';
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getId = (value) => (typeof value === 'string' ? value : value?._id || '');
  const getLabel = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || value.code || '';
  };

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
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    }
  }, [navigate, token]);

  const fetchMetadata = useCallback(async () => {
    try {
      if (!token) return;

      if (isAdmin) {
        const [semRes, brRes, subjRes, teachRes, hodRes] = await Promise.all([
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=teacher', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=hod', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (semRes.data.success) setSemesters(semRes.data.data || []);
        if (brRes.data.success) setBranches(brRes.data.data || []);
        if (subjRes.data.success) setSubjects(subjRes.data.data || []);
        if (teachRes.data.success) setTeachers(teachRes.data.data || []);
        if (hodRes.data.success) setHodList(hodRes.data.data || []);
        return;
      }

      if (isHod) {
        const [subjRes, semRes] = await Promise.all([
          axios.get('/api/academic/subjects/hod', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.data || []);
        if (semRes.data.success) setSemesters(semRes.data.data || []);
        return;
      }

      if (isTeacher && user?._id) {
        const [subjRes, semRes] = await Promise.all([
          axios.get(`/api/academic/teacher/${user._id}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.subjects || []);
        if (semRes.data.success) setSemesters(semRes.data.data || []);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching metadata:', error);
      }
    }
  }, [handleAuthError, isAdmin, isHod, isTeacher, token, user]);

  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);

      if (isAdmin) {
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
        }
      } else {
        const res = await axios.get('/api/timetable/my-schedule', {
          headers: { Authorization: `Bearer ${token}` },
          params: filters.dayOfWeek ? { dayOfWeek: filters.dayOfWeek } : undefined
        });

        if (res.data.success) {
          setTimetables(res.data.data || []);
        }
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching timetables:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, handleAuthError, isAdmin, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [fetchProfile, navigate, token]);

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
      if (!handleAuthError(error)) {
        console.error('Error creating timetable:', error);
        alert(error.response?.data?.message || 'Error creating timetable entry');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTimetable = async () => {
    if (!selectedTimetable) return;

    try {
      setSaving(true);
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
      if (!handleAuthError(error)) {
        console.error('Error updating timetable:', error);
        alert(error.response?.data?.message || 'Error updating timetable entry');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (window.confirm('Are you sure you want to cancel this timetable entry?')) {
      try {
        const res = await axios.delete(`/api/timetable/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          alert('Timetable entry cancelled successfully');
          fetchTimetables();
        }
      } catch (error) {
        if (!handleAuthError(error)) {
          console.error('Error deleting timetable:', error);
          alert('Error cancelling timetable entry');
        }
      }
    }
  };

  const handleGrantPermission = async () => {
    if (!grantData.userId || !selectedTimetable) {
      alert('Please select a user');
      return;
    }

    try {
      setSaving(true);
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
      if (!handleAuthError(error)) {
        console.error('Error granting permission:', error);
        alert(error.response?.data?.message || 'Error granting permission');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRevokePermission = async (timetableId, userId) => {
    if (window.confirm('Are you sure you want to revoke this user\'s permission?')) {
      try {
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
        if (!handleAuthError(error)) {
          console.error('Error revoking permission:', error);
          alert('Error revoking permission');
        }
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
      <RoleLayout
        title="Timetable Management"
        userName={user?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={panelLabel}
        profileLinks={isAdmin ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Timetable Management"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={isAdmin ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Timetable Management</h2>
            {user && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {getLabel(user.branch || user.department)} {user.name ? `- ${user.name}` : ''}
              </p>
            )}
          </div>
          {(isAdmin || isHod) && (
            <Button
              onClick={() => {
                setShowCreateModal(true);
                if (isHod && user) {
                  setFormData((prev) => ({
                    ...prev,
                    semesterId: getId(user.semester) || prev.semesterId,
                    branchId: getId(user.branch) || prev.branchId,
                    teacherId: user._id
                  }));
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Create Timetable Entry
            </Button>
          )}
        </div>

        <Card className="bg-white dark:bg-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAdmin && (
              <select
                value={filters.semesterId}
                onChange={(e) => setFilters(prev => ({ ...prev, semesterId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" className="text-gray-900 bg-white">All Semesters</option>
                {semesters.map(s => (
                  <option key={s._id} value={s._id} className="text-gray-900 bg-white">
                    {s.name || (s.semesterNumber ? `Semester ${s.semesterNumber}` : s.code || s._id)}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && (
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
            )}

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
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Teacher</th>
                    )}
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Room</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                    {(isAdmin || isHod) && (
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {timetables.map(tt => (
                    <tr key={tt._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{tt.dayOfWeek}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.startTime} - {tt.endTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.subjectId?.name}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.teacherId?.name}</td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tt.roomNo}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {tt.lectureType}
                        </span>
                      </td>
                      {(isAdmin || isHod) && (
                        <td className="px-6 py-4 text-sm space-x-2">
                          {isAdmin ? (
                            <>
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
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTimetable && selectedTimetable.canBeModifiedBy?.length > 0 && isAdmin && (
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

      {showCreateModal && (isAdmin || isHod) && (
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

            {isAdmin ? (
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
                          <option key={s._id} value={s._id} className="text-gray-900 bg-white">
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
                        {hodList.map(h => (
                          <option key={h._id} value={h._id} className="text-gray-900 bg-white">{h.name}</option>
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
                    placeholder="Optional notes"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Number *</label>
                    <Input
                      value={formData.roomNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                      placeholder="e.g., A101, Lab-1"
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
                    placeholder="Optional notes"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

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

      {showEditModal && selectedTimetable && isHod && (
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
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showGrantModal && selectedTimetable && isAdmin && (
        <Modal onClose={() => setShowGrantModal(false)}>
          <div className="w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Grant Timetable Access</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={grantData.role}
                  onChange={(e) => setGrantData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="teacher">Teacher</option>
                  <option value="hod">HOD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                <select
                  value={grantData.userId}
                  onChange={(e) => setGrantData((prev) => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select user</option>
                  {(grantData.role === 'teacher' ? teachers : hodList).map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowGrantModal(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleGrantPermission} disabled={saving}>
                  {saving ? 'Granting...' : 'Grant Access'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </RoleLayout>
  );
};

export default RoleTimetable;
