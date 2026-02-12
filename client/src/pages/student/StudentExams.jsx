import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, Card, LoadingSpinner } from '../../components';
import axios from 'axios';

const StudentExams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [scheduleRes, resultRes] = await Promise.all([
        axios.get('/api/exams/student/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/exams/student/results', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (scheduleRes.data?.success) setSchedules(scheduleRes.data.data || []);
      if (resultRes.data?.success) setResults(resultRes.data.data || []);
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <StudentLayout title="Exams" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Exams" onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Exams</h1>
          <p className="text-gray-600 mt-1">Check schedules and results</p>
        </div>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Schedules</h2>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No exam schedules found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{schedule.examName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.subjectId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.date?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.startTime} - {schedule.endTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.venue || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Results</h2>
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No results available yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result._id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{result.examId?.examName || 'Exam'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{result.subjectId?.name || 'Subject'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {result.marksObtained} / {result.totalMarks}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{result.grade || 'N/A'}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${
                        result.status === 'pass' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {result.status}
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

export default StudentExams;
