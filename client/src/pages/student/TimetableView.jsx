import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Card, LoadingSpinner, Modal, StudentLayout } from '../../components';
import SubjectTimetableView from '../../components/SubjectTimetableView';

const StudentTimetableView = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubjectTimetable, setShowSubjectTimetable] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const days = useMemo(() => (
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  ), []);

  useEffect(() => {
    // Get user info
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Fetch timetable
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const semesterId = userData?.semester?._id || userData?.semesterId || userData?.semester;

        if (!semesterId) {
          console.error('Semester not found in user data');
          setLoading(false);
          return;
        }

        const res = await axios.get(`/api/timetable/semester/${semesterId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setTimetable(res.data.data);
          
          // Auto-set today's day if available
          const today = new Date();
          const dayName = days[today.getDay() === 0 ? 6 : today.getDay() - 1];
          if (res.data.data.some(t => t.dayOfWeek === dayName)) {
            setSelectedDay(dayName);
          }
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [days]);

  // Group timetable by day
  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.dayOfWeek === day).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    return acc;
  }, {});

  // Get unique subjects
  const subjects = Array.from(
    new Map(timetable.map(t => [t.subjectId?._id, t.subjectId])).values()
  ).filter(Boolean);

  const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  const semesterDisplayRaw = user?.semester?.name || user?.semesterName || user?.semesterLabel || timetable[0]?.semesterId?.name || user?.semester;
  const branchDisplayRaw = user?.branch?.name || user?.branchName || user?.branchLabel || timetable[0]?.branchId?.name || user?.branch;
  const semesterDisplay = isObjectId(semesterDisplayRaw) ? null : semesterDisplayRaw;
  const branchDisplay = isObjectId(branchDisplayRaw) ? null : branchDisplayRaw;

  if (loading) {
    return (
      <StudentLayout title="My Timetable" onLogout={handleLogout} userName={user?.name || 'Student'}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </StudentLayout>
    );
  }

  // Day view
  const DayView = () => {
    const dayClasses = groupedByDay[selectedDay] || [];

    if (dayClasses.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-semibold">No classes scheduled for {selectedDay}</p>
          <p className="text-sm mt-2">Enjoy your free time.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {dayClasses.map((schedule, idx) => (
          <div
            key={idx}
            onClick={() => {
              setSelectedSchedule(schedule);
              setShowDetailModal(true);
            }}
            className="bg-gradient-to-r from-[#EFF6FF] to-[#EEF2FF] p-5 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-[#2563EB]"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {schedule.startTime}
                </p>
                <p className="text-sm text-gray-600">
                  → {schedule.endTime}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-xs font-bold text-white ${
                schedule.lectureType === 'Theory'
                  ? 'bg-blue-600'
                  : schedule.lectureType === 'Practical'
                  ? 'bg-purple-600'
                  : schedule.lectureType === 'Lab'
                  ? 'bg-red-600'
                  : 'bg-green-600'
              }`}>
                {schedule.lectureType}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {schedule.subjectId?.name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>📍 Room {schedule.roomNo}</span>
                <span>👨‍🏫 {schedule.teacherId?.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Full table view
  const FullTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#2563EB]">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-white">
                Time
              </th>
              {days.map(day => (
                <th
                  key={day}
                  className="border border-gray-300 px-4 py-3 text-left font-semibold text-white"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(timetable.map(t => `${t.startTime}-${t.endTime}`)))
              .sort()
              .map((timeSlot, idx) => {
                const [startTime, endTime] = timeSlot.split('-');
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 whitespace-nowrap bg-gray-50">
                      {startTime}<br />{endTime}
                    </td>
                    {days.map(day => {
                      const classAtSlot = timetable.find(
                        t =>
                          t.dayOfWeek === day &&
                          t.startTime === startTime &&
                          t.endTime === endTime
                      );

                      return (
                        <td
                          key={day}
                          className="border border-gray-300 px-4 py-3"
                        >
                          {classAtSlot ? (
                            <div
                              onClick={() => {
                                setSelectedSchedule(classAtSlot);
                                setShowDetailModal(true);
                              }}
                              className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded cursor-pointer hover:shadow-md transition"
                            >
                              <p className="text-xs font-bold text-gray-900">
                                {classAtSlot.subjectId?.name}
                              </p>
                              <p className="text-xs text-gray-700 mt-1">
                                {classAtSlot.lectureType}
                              </p>
                              <p className="text-xs text-gray-700">
                                Room {classAtSlot.roomNo}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <StudentLayout title="My Timetable" onLogout={handleLogout} userName={user?.name || 'Student'}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e40af] to-[#0284c7] text-white p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Schedule Hub</p>
              <h1 className="text-2xl md:text-3xl font-black mt-1">My Class Timetable</h1>
              <p className="text-sm text-sky-100 mt-1">
                {semesterDisplay || branchDisplay
                  ? `${semesterDisplay || ''}${semesterDisplay && branchDisplay ? ' • ' : ''}${branchDisplay || ''}`
                  : 'Track your day, full schedule, and subject-wise classes.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-white/15">Classes: {timetable.length}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Subjects: {subjects.length}</span>
            </div>
          </div>
        </section>

        {timetable.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs text-[#6B7280]">Total Classes</p>
              <p className="text-2xl font-black text-[#1D4ED8] mt-1">{timetable.length}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs text-[#6B7280]">Teaching Days</p>
              <p className="text-2xl font-black text-[#4338ca] mt-1">
                {days.filter(day => groupedByDay[day]?.length > 0).length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs text-[#6B7280]">Unique Subjects</p>
              <p className="text-2xl font-black text-[#0f766e] mt-1">{subjects.length}</p>
            </div>
          </div>
        )}

        {timetable.length === 0 ? (
          <Card className="bg-white p-8 text-center border border-[#E5E7EB]">
            <p className="text-gray-500 text-lg">
              No timetable scheduled yet
            </p>
          </Card>
        ) : (
          <>
            {/* View Toggle & Filters */}
            <Card className="bg-white p-6 border border-[#E5E7EB]">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      setShowFullTable(false);
                      setShowSubjectTimetable(false);
                      setSelectedDay(selectedDay || days[0]);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      !showFullTable && !showSubjectTimetable
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 border border-[#E5E7EB]'
                    }`}
                  >
                    📍 Day View
                  </button>
                  <button
                    onClick={() => {
                      setShowFullTable(true);
                      setShowSubjectTimetable(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      showFullTable && !showSubjectTimetable
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 border border-[#E5E7EB]'
                    }`}
                  >
                    📊 Full Schedule
                  </button>
                </div>

                {/* Day selector for day view */}
                {!showFullTable && !showSubjectTimetable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Day:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {days.map(day => (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            selectedDay === day
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800 border border-[#E5E7EB] hover:bg-gray-200'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Main Content */}
            {showSubjectTimetable && selectedSubject ? (
              <SubjectTimetableView 
                subjectId={selectedSubject._id} 
                subjectName={selectedSubject.name}
              />
            ) : showFullTable ? (
              <Card className="bg-white p-6 border border-[#E5E7EB]">
                <FullTableView />
              </Card>
            ) : (
              <Card className="bg-white p-6 border border-[#E5E7EB]">
                <DayView />
              </Card>
            )}

            {/* Subject Timetables Section */}
            {subjects.length > 0 && (
              <Card className="bg-white p-6 border border-[#E5E7EB]">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  📚 Subject-wise Timetables
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(subject => {
                    const subjectClasses = timetable.filter(
                      t => t.subjectId?._id === subject._id
                    );
                    return (
                      <div
                        key={subject._id}
                        onClick={() => {
                          setSelectedSubject(subject);
                          setShowSubjectTimetable(true);
                        }}
                        className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow border border-indigo-200"
                      >
                        <p className="font-semibold text-gray-900 mb-2">
                          {subject.name}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Code: {subject.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {subjectClasses.length} classes this week
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Click to view timetable →
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <Modal onClose={() => {
            setShowDetailModal(false);
            setSelectedSchedule(null);
          }}>
            <div className="w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Class Details
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedSchedule.subjectId?.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSchedule.startTime}
                    </p>
                    <p className="text-xs text-gray-600">
                      to {selectedSchedule.endTime}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Day</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSchedule.dayOfWeek}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSchedule.roomNo}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSchedule.lectureType}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Teacher</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedSchedule.teacherId?.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedSchedule.teacherId?.email}
                  </p>
                </div>

                {selectedSchedule.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-gray-900">{selectedSchedule.notes}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedSchedule.duration} minutes
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSchedule(null);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
      </main>
    </StudentLayout>
  );
};

export default StudentTimetableView;
