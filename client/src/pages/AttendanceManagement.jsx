import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, Button, Card, HodLayout, Input, LoadingSpinner, Pagination, TeacherLayout } from '../components';
import axios from 'axios';

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role;
  const Layout = useMemo(() => {
    if (role === 'admin') return AdminLayout;
    if (role === 'hod') return HodLayout;
    return TeacherLayout;
  }, [role]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionName, setSessionName] = useState('Regular');
  const [existingSessionId, setExistingSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/profile/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data?.success) {
      return res.data.data;
    }
    return null;
  }, []);

  const fetchSubjects = useCallback(async (teacherSubjects = []) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = role === 'hod' ? '/api/academic/subjects/hod' : '/api/academic/subjects';
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        let subjectList = res.data.data || [];
        if (role === 'teacher' && teacherSubjects.length > 0) {
          const allowed = new Set(teacherSubjects.map((subject) => String(subject._id || subject)));
          subjectList = subjectList.filter((subject) => allowed.has(String(subject._id)));
        }
        setSubjects(subjectList);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [role]);

  const fetchStudents = useCallback(async (subjectId) => {
    try {
      if (!subjectId) return;
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/attendance/students', {
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

  const fetchExistingSession = useCallback(async () => {
    if (!selectedSubjectId || !sessionDate || !sessionName) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/attendance/sessions', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          subjectId: selectedSubjectId,
          dateKey: sessionDate,
          session: sessionName,
          limit: 1,
          page: 1
        }
      });

      const session = res.data?.data?.[0] || null;
      if (session) {
        setExistingSessionId(session._id);
        const nextRecords = {};
        session.records?.forEach((record) => {
          if (record.studentId) nextRecords[String(record.studentId)] = record.status;
        });
        setRecords((prev) => ({ ...prev, ...nextRecords }));
      } else {
        setExistingSessionId(null);
      }
    } catch (error) {
      console.error('Error fetching attendance session:', error);
    }
  }, [selectedSubjectId, sessionDate, sessionName]);

  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (selectedSubjectId) params.subjectId = selectedSubjectId;

      const res = await axios.get('/api/attendance/sessions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data?.success) {
        setSessions(res.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
          pages: res.data.pages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [pagination.page, pagination.limit, selectedSubjectId]);

  useEffect(() => {
    if (!role) {
      navigate('/login');
      return;
    }

    const init = async () => {
      setLoading(true);
      const profileData = await fetchProfile();
      await fetchSubjects(profileData?.assignedSubjects || []);
      setLoading(false);
    };

    init();
  }, [role, fetchProfile, fetchSubjects, navigate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setStudents([]);
      return;
    }
    fetchStudents(selectedSubjectId);
  }, [selectedSubjectId, fetchStudents]);

  useEffect(() => {
    if (students.length === 0) return;
    setRecords((prev) => {
      const nextRecords = {};
      students.forEach((student) => {
        nextRecords[student._id] = prev[student._id] || 'present';
      });
      return nextRecords;
    });
  }, [students]);

  useEffect(() => {
    fetchExistingSession();
  }, [fetchExistingSession]);

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const nextRecords = {};
    students.forEach((student) => {
      nextRecords[student._id] = status;
    });
    setRecords(nextRecords);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubjectId) {
      alert('Please select a subject');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const payload = {
        subjectId: selectedSubjectId,
        date: sessionDate,
        session: sessionName,
        records: students.map((student) => ({
          studentId: student._id,
          status: records[student._id] || 'present'
        }))
      };

      const res = await axios.post('/api/attendance/sessions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        alert('Attendance saved successfully');
        fetchSessions();
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert(error.response?.data?.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSession = (session) => {
    setSelectedSubjectId(session.subjectId?._id || session.subjectId);
    setSessionDate(session.dateKey || new Date(session.date).toISOString().slice(0, 10));
    setSessionName(session.session || 'Regular');
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  if (loading) {
    return (
      <Layout title="Attendance" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Attendance" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-blue-500">fact_check</span>
              Attendance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Mark and review daily attendance by subject
            </p>
          </div>
          {existingSessionId && (
            <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
              You are updating an existing session
            </div>
          )}
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
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
            <Input
              label="Date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Session</label>
              <select
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="Regular">Regular</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button variant="secondary" onClick={() => handleMarkAll('present')}>Mark All Present</Button>
            <Button variant="secondary" onClick={() => handleMarkAll('absent')}>Mark All Absent</Button>
            <Button variant="secondary" onClick={() => handleMarkAll('late')}>Mark All Late</Button>
          </div>

          <div className="mt-6">
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No students found for this subject</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrollment</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.enrollmentNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={records[student._id] || 'present'}
                            onChange={(e) => handleStatusChange(student._id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            <span className="text-sm text-gray-500">{pagination.total} total</span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendance sessions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Session</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Present</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Absent</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Late</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">{session.dateKey}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{session.subjectId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{session.session}</td>
                      <td className="px-4 py-3 text-sm text-emerald-700 font-semibold">{session.summary?.presentCount ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-semibold">{session.summary?.absentCount ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-amber-600 font-semibold">{session.summary?.lateCount ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <button
                          onClick={() => handleLoadSession(session)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200"
                        >
                          Load
                        </button>
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
      </div>
    </Layout>
  );
};

export default AttendanceManagement;
