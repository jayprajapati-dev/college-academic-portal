import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Card, LoadingSpinner } from './index';

const SubjectTimetableView = ({ subjectId, subjectName }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch subject timetable
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/timetable/subject/${subjectId}`, {
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

    if (subjectId) {
      fetchTimetable();
    }
  }, [subjectId]);

  // Group timetable by day
  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.dayOfWeek === day).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    return acc;
  }, {});

  if (loading) {
    return <LoadingSpinner />;
  }

  if (timetable.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No timetable found for this subject</p>
      </Card>
    );
  }

  // Day view - show only selected day's classes
  const DayView = () => {
    const dayClasses = groupedByDay[selectedDay] || [];

    if (dayClasses.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No classes scheduled for {selectedDay}
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
            className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {schedule.startTime} - {schedule.endTime}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Room: <span className="font-medium">{schedule.roomNo}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Type: <span className="font-medium">{schedule.lectureType}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Teacher: <span className="font-medium">{schedule.teacherId?.name}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  {schedule.lectureType}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Full table view - all days and classes
  const FullTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Time
              </th>
              {days.map(day => (
                <th
                  key={day}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Get all unique time slots */}
            {Array.from(new Set(timetable.map(t => `${t.startTime}-${t.endTime}`)))
              .sort()
              .map((timeSlot, idx) => {
                const [startTime, endTime] = timeSlot.split('-');
                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {startTime} - {endTime}
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
                          className="border border-gray-300 dark:border-gray-600 px-4 py-3"
                        >
                          {classAtSlot ? (
                            <div
                              onClick={() => {
                                setSelectedSchedule(classAtSlot);
                                setShowDetailModal(true);
                              }}
                              className="bg-blue-100 dark:bg-blue-900 p-2 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                            >
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                {classAtSlot.lectureType}
                              </p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {classAtSlot.roomNo}
                              </p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {classAtSlot.teacherId?.name}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
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
    <Card className="bg-white dark:bg-gray-800 p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📅 {subjectName} - Timetable
        </h3>

        {/* Toggle buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => {
              setShowFullTable(false);
              setSelectedDay(selectedDay || days[0]);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !showFullTable
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            📍 Today/Day View
          </button>
          <button
            onClick={() => setShowFullTable(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              showFullTable
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            📊 Full Schedule
          </button>
        </div>

        {/* Day selector for day view */}
        {!showFullTable && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {showFullTable ? <FullTableView /> : <DayView />}

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
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedSchedule.startTime} - {selectedSchedule.endTime}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Day</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSchedule.dayOfWeek}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Room</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSchedule.roomNo}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSchedule.lectureType}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Teacher</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSchedule.teacherId?.name}
                </p>
              </div>

              {selectedSchedule.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="text-gray-900 dark:text-white">{selectedSchedule.notes}</p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
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
    </Card>
  );
};

export default SubjectTimetableView;
