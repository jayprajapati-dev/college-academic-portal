import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, Card, LoadingSpinner } from '../../components';
import axios from 'axios';

const StudentAttendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [history, setHistory] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/attendance/student/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setSummary((prev) => res.data.summary || prev);
        setSubjects(res.data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
    }
  }, []);

  const fetchHistory = useCallback(async (subjectId) => {
    if (!subjectId) {
      setHistory([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/attendance/student/subject/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setHistory(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchSummary();
      setLoading(false);
    };

    load();
  }, [fetchSummary]);

  useEffect(() => {
    fetchHistory(selectedSubjectId);
  }, [selectedSubjectId, fetchHistory]);

  if (loading) {
    return (
      <StudentLayout title="Attendance" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Attendance" onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Attendance Overview</h1>
          <p className="text-gray-600 mt-1">Track your attendance across subjects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-sm text-gray-500">Total Sessions</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">Present</div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">{summary.present}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">Absent</div>
            <div className="text-3xl font-bold text-red-500 mt-2">{summary.absent}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">Attendance %</div>
            <div className={`text-3xl font-bold mt-2 ${summary.percentage < 75 ? 'text-amber-600' : 'text-blue-600'}`}>
              {summary.percentage}%
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Subject Summary</h2>
              <p className="text-sm text-gray-500">Select a subject to view detailed history</p>
            </div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.subjectId?._id || subject.subjectId} value={subject.subjectId?._id || subject.subjectId}>
                  {subject.subjectId?.name || 'Subject'} ({subject.subjectId?.code || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendance data available yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Present</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Absent</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Late</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.subjectId?._id || subject.subjectId} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {subject.subjectId?.name || 'Subject'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{subject.total}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{subject.present}</td>
                      <td className="px-4 py-3 text-sm text-red-500 font-semibold">{subject.absent}</td>
                      <td className="px-4 py-3 text-sm text-amber-500 font-semibold">{subject.late}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${subject.percentage < 75 ? 'text-amber-600' : 'text-blue-600'}`}>
                        {subject.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
            {selectedSubjectId && (
              <span className="text-sm text-gray-500">{history.length} records</span>
            )}
          </div>

          {!selectedSubjectId ? (
            <div className="text-center py-8 text-gray-500">Select a subject to view history.</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Session</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.dateKey}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.session}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${
                        item.status === 'present'
                          ? 'text-emerald-600'
                          : item.status === 'late'
                          ? 'text-amber-600'
                          : 'text-red-500'
                      }`}>
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentAttendance;
