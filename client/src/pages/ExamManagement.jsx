import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, Button, Card, HodLayout, Input, LoadingSpinner, Pagination, TeacherLayout } from '../components';
import axios from 'axios';

const ExamManagement = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role;
  const Layout = useMemo(() => {
    if (role === 'admin') return AdminLayout;
    if (role === 'hod') return HodLayout;
    return TeacherLayout;
  }, [role]);

  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [filters, setFilters] = useState({ subjectId: '', status: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [totalMarks, setTotalMarks] = useState(100);
  const [formData, setFormData] = useState({
    examName: '',
    examType: 'Internal',
    subjectId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '12:00',
    venue: '',
    instructions: '',
    status: 'scheduled'
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchSubjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = role === 'hod' ? '/api/academic/subjects/hod' : '/api/academic/subjects';
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        let subjectList = res.data.data || [];
        if (role === 'teacher' && storedUser?.assignedSubjects?.length) {
          const allowed = new Set(storedUser.assignedSubjects.map((subject) => String(subject._id || subject)));
          subjectList = subjectList.filter((subject) => allowed.has(String(subject._id)));
        }
        setSubjects(subjectList);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [role, storedUser?.assignedSubjects]);

  const fetchSchedules = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        subjectId: filters.subjectId || undefined,
        status: filters.status
      };

      const res = await axios.get('/api/exams/schedules', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data?.success) {
        setSchedules(res.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
          pages: res.data.pages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchStudents = useCallback(async (subjectId) => {
    try {
      if (!subjectId) return;
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/exams/students', {
        headers: { Authorization: `Bearer ${token}` },
        params: { subjectId }
      });

      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  useEffect(() => {
    if (!role) {
      navigate('/login');
      return;
    }
    const init = async () => {
      setLoading(true);
      await fetchSubjects();
      setLoading(false);
    };
    init();
  }, [role, fetchSubjects, navigate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!selectedScheduleId) {
      setStudents([]);
      setResults({});
      return;
    }

    const schedule = schedules.find((item) => item._id === selectedScheduleId);
    if (schedule?.subjectId?._id) {
      fetchStudents(schedule.subjectId._id);
    }
  }, [selectedScheduleId, schedules, fetchStudents]);

  useEffect(() => {
    if (students.length === 0) return;
    setResults((prev) => {
      const next = { ...prev };
      students.forEach((student) => {
        if (!next[student._id]) {
          next[student._id] = {
            marksObtained: 0,
            totalMarks,
            grade: '',
            status: 'pass'
          };
        }
      });
      return next;
    });
  }, [students, totalMarks]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      examName: '',
      examType: 'Internal',
      subjectId: '',
      date: new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '12:00',
      venue: '',
      instructions: '',
      status: 'scheduled'
    });
    setEditingSchedule(null);
  };

  const handleSaveSchedule = async () => {
    if (!formData.examName || !formData.subjectId || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSavingSchedule(true);
      const token = localStorage.getItem('token');
      const payload = { ...formData };

      if (editingSchedule) {
        const res = await axios.put(`/api/exams/schedules/${editingSchedule._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) alert('Exam schedule updated');
      } else {
        const res = await axios.post('/api/exams/schedules', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) alert('Exam scheduled successfully');
      }

      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error.response?.data?.message || 'Error saving schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      examName: schedule.examName || '',
      examType: schedule.examType || 'Internal',
      subjectId: schedule.subjectId?._id || schedule.subjectId || '',
      date: schedule.date ? schedule.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      startTime: schedule.startTime || '10:00',
      endTime: schedule.endTime || '12:00',
      venue: schedule.venue || '',
      instructions: schedule.instructions || '',
      status: schedule.status || 'scheduled'
    });
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/exams/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        alert('Exam schedule deleted');
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    }
  };

  const handleResultChange = (studentId, field, value) => {
    setResults((prev) => {
      const current = prev[studentId] || { marksObtained: 0, totalMarks, grade: '', status: 'pass' };
      const nextValue = field === 'marksObtained' || field === 'totalMarks' ? Number(value) : value;
      const updated = { ...current, [field]: nextValue };
      if (field === 'marksObtained' || field === 'totalMarks') {
        const percent = updated.totalMarks ? (updated.marksObtained / updated.totalMarks) * 100 : 0;
        updated.status = percent >= 40 ? 'pass' : 'fail';
      }
      return { ...prev, [studentId]: updated };
    });
  };

  const handleSaveResults = async () => {
    if (!selectedScheduleId) {
      alert('Select an exam schedule');
      return;
    }

    const schedule = schedules.find((item) => item._id === selectedScheduleId);
    if (!schedule?.subjectId?._id) {
      alert('Invalid exam schedule');
      return;
    }

    try {
      setSavingResults(true);
      const token = localStorage.getItem('token');
      const payload = {
        examId: selectedScheduleId,
        subjectId: schedule.subjectId._id,
        results: students.map((student) => ({
          studentId: student._id,
          marksObtained: results[student._id]?.marksObtained ?? 0,
          totalMarks: results[student._id]?.totalMarks ?? totalMarks,
          grade: results[student._id]?.grade || '',
          status: results[student._id]?.status || 'pass'
        }))
      };

      const res = await axios.post('/api/exams/results/bulk', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) alert('Results saved successfully');
    } catch (error) {
      console.error('Error saving results:', error);
      alert(error.response?.data?.message || 'Error saving results');
    } finally {
      setSavingResults(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  if (loading) {
    return (
      <Layout title="Exams" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Exams" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-indigo-500">quiz</span>
            Exam Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Schedule exams and record results
          </p>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Input
              label="Exam Name *"
              value={formData.examName}
              onChange={(e) => handleFormChange('examName', e.target.value)}
              placeholder="Mid Sem 1"
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
              <select
                value={formData.examType}
                onChange={(e) => handleFormChange('examType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {['Internal', 'External', 'Mid', 'Final', 'Practical', 'Viva', 'Other'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleFormChange('subjectId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
            <Input label="Date *" type="date" value={formData.date} onChange={(e) => handleFormChange('date', e.target.value)} />
            <Input label="Start Time *" type="time" value={formData.startTime} onChange={(e) => handleFormChange('startTime', e.target.value)} />
            <Input label="End Time *" type="time" value={formData.endTime} onChange={(e) => handleFormChange('endTime', e.target.value)} />
            <Input label="Venue" value={formData.venue} onChange={(e) => handleFormChange('venue', e.target.value)} placeholder="Room 101" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Input label="Instructions" value={formData.instructions} onChange={(e) => handleFormChange('instructions', e.target.value)} placeholder="Bring ID card" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            {editingSchedule && (
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            )}
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Exam Schedules</h2>
              <p className="text-sm text-gray-500">Manage upcoming and completed exams</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.subjectId}
                onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code || 'N/A'})
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No exam schedules found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{schedule.examName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.subjectId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.date?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.startTime} - {schedule.endTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">{schedule.status}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule._id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200"
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

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </Card>

        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Results Entry</h2>
              <p className="text-sm text-gray-500">Select a schedule and record marks</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select schedule</option>
                {schedules.map((schedule) => (
                  <option key={schedule._id} value={schedule._id}>
                    {schedule.examName} - {schedule.subjectId?.name}
                  </option>
                ))}
              </select>
              <Input
                label="Total Marks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Select a schedule to load students.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="number"
                          value={results[student._id]?.marksObtained ?? 0}
                          onChange={(e) => handleResultChange(student._id, 'marksObtained', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="number"
                          value={results[student._id]?.totalMarks ?? totalMarks}
                          onChange={(e) => handleResultChange(student._id, 'totalMarks', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="text"
                          value={results[student._id]?.grade ?? ''}
                          onChange={(e) => handleResultChange(student._id, 'grade', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={results[student._id]?.status ?? 'pass'}
                          onChange={(e) => handleResultChange(student._id, 'status', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveResults} disabled={savingResults || students.length === 0}>
              {savingResults ? 'Saving...' : 'Save Results'}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ExamManagement;
