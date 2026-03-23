import React, { useEffect, useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, LoadingSpinner, Modal, Button } from '../../components';

const TeacherTimetableView = ({ user, token }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);
  const SLOT_OPTIONS = useMemo(() => [
    { value: 1, label: 'Slot 1: 09:00 - 10:00' },
    { value: 2, label: 'Slot 2: 10:00 - 11:00' },
    { value: 3, label: 'Slot 3: 11:00 - 12:00' },
    { value: 4, label: 'Slot 4: 12:00 - 01:00' },
    { value: 5, label: 'Slot 5: 01:00 - 02:00' },
    { value: 6, label: 'Slot 6: 02:00 - 03:00' }
  ], []);

  const getTimetableLabel = useCallback((entry) => {
    const subject = entry?.subjectId;
    const subjectName = typeof subject === 'string' ? subject : subject?.name || 'N/A';
    const subjectCode = typeof subject === 'object' ? subject?.code || '' : '';
    const division = entry?.division && entry.division !== 'General' ? ` - ${entry.division}` : '';
    return `${subjectCode || subjectName}${division}`;
  }, []);

  const fetchTeacherTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get('/api/timetable/my-schedule', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        const activeEntries = response.data.data.filter(entry => entry.status === 'active');
        setTimetable(activeEntries.sort((a, b) => {
          const dayOrder = days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
          if (dayOrder !== 0) return dayOrder;
          return (a.slot || 0) - (b.slot || 0);
        }));
      }
    } catch (err) {
      console.error('Fetch timetable error:', err);
      setError(err?.response?.data?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    if (token) {
      fetchTeacherTimetable();
    }
  }, [token, fetchTeacherTimetable]);

  // Group timetable by day
  const timetableByDay = useMemo(() => {
    const grouped = {};
    days.forEach(day => {
      grouped[day] = timetable.filter(entry => entry.dayOfWeek === day);
    });
    return grouped;
  }, [timetable, days]);

  // Get week overview grid data
  const weekOverview = useMemo(() => {
    const slots = Array.from({ length: 6 }, (_, i) => i + 1);
    const grid = [];
    
    slots.forEach(slot => {
      const row = { slot };
      days.forEach(day => {
        const entry = timetable.find(
          t => t.dayOfWeek === day && Number(t.slot) === slot
        );
        row[day] = entry;
      });
      grid.push(row);
    });
    return grid;
  }, [timetable, days]);

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedEntry(null);
  };

  const getSlotLabel = (slot) => {
    const slotMeta = SLOT_OPTIONS.find(s => s.value === Number(slot));
    return slotMeta ? slotMeta.label : `Slot ${slot}`;
  };

  const DetailModal = ({ entry, onClose }) => {
    if (!entry) return null;

    const subject = entry?.subjectId || {};
    const department = entry?.branchId || {};
    const room = entry?.roomId || {};
    const slotLabel = getSlotLabel(entry.slot);
    const div = entry?.division && entry.division !== 'General' ? entry.division : 'General';
    const typeInfo = entry?.lectureType === 'Lab' ? `Lab (${entry?.slotSpan || 1} slots)` : 'Theory';

    return (
      <Modal
        isOpen={showDetail}
        onClose={onClose}
        title={`Class Details`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
              {typeof subject === 'object' ? subject?.name : subject}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {typeof subject === 'object' ? subject?.code : ''}
            </p>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Day & Time */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Day & Time</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{entry.dayOfWeek}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">{slotLabel}</p>
            </div>

            {/* Room */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Room</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {typeof room === 'object' ? room?.roomNo : room}
              </p>
            </div>

            {/* Division */}
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3">
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Division/Section</p>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-1">{div}</p>
            </div>

            {/* Type */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Class Type</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">{typeInfo}</p>
            </div>

            {/* Branch */}
            <div className="rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 p-3">
              <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">Department</p>
              <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300 mt-1">
                {typeof department === 'object' ? department?.name : department}
              </p>
            </div>

            {/* Semester */}
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-3">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Semester</p>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                {typeof entry?.semesterId === 'object' ? entry.semesterId?.name : entry?.semesterId}
              </p>
            </div>
          </div>

          {/* Close */}
          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1"
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <section className="rounded-b-3xl bg-gradient-to-r from-[#1f2937] via-[#1e40af] to-[#0f766e] text-white p-4 sm:p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-100">My Schedule</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2">Teaching Timetable</h1>
          <p className="text-sky-100 mt-2 text-sm md:text-base">
            View all your assigned classes with subject, room, and schedule information
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 md:p-8">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <Card title="Error" className="border-red-200">
            <div className="text-red-700 dark:text-red-400 text-sm">{error}</div>
          </Card>
        ) : timetable.length === 0 ? (
          <Card title="No Classes Available" className="border-amber-200">
            <div className="text-amber-700 dark:text-amber-400 text-sm">
              You have no assigned classes at this time. Check back later or contact your department.
            </div>
          </Card>
        ) : (
          <>
            {/* Week Overview Grid */}
            <Card title="Weekly Schedule Grid" subtitle="Click any class for details" className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border border-slate-300 dark:border-slate-600 p-2 text-left font-bold text-slate-900 dark:text-slate-100">Time Slot</th>
                      {days.map(day => (
                        <th
                          key={day}
                          className="border border-slate-300 dark:border-slate-600 p-2 text-center font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weekOverview.map((row, idx) => (
                      <tr key={`slot-${row.slot}`} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50 dark:bg-slate-900'}>
                        <td className="border border-slate-300 dark:border-slate-600 p-2 font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                          {getSlotLabel(row.slot).split(':')[0]}
                        </td>
                        {days.map(day => {
                          const entry = row[day];
                          return (
                            <td
                              key={`${day}-${row.slot}`}
                              className="border border-slate-300 dark:border-slate-600 p-2"
                            >
                              {entry ? (
                                <button
                                  onClick={() => handleViewDetails(entry)}
                                  className="w-full h-full min-h-[60px] p-2 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-[10px] sm:text-xs font-bold text-left leading-tight transition"
                                >
                                  <div className="font-bold truncate">{getTimetableLabel(entry)}</div>
                                  <div className="text-[9px] opacity-90 mt-1 truncate">
                                    {typeof entry.roomId === 'object' ? entry.roomId?.roomNo : entry.roomId}
                                  </div>
                                </button>
                              ) : (
                                <div className="h-full min-h-[60px] flex items-center justify-center text-slate-400 text-xs">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Daily Breakdown */}
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Daily Breakdown</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {days.map(day => {
                  const dayClasses = timetableByDay[day];
                  return (
                    <Card key={day} title={day} subtitle={`${dayClasses.length} class(es)`} className="border-slate-200 dark:border-slate-700">
                      {dayClasses.length === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">No classes scheduled</p>
                      ) : (
                        <div className="space-y-2">
                          {dayClasses.map((entry, idx) => (
                            <button
                              key={`daily-${day}-${idx}`}
                              onClick={() => handleViewDetails(entry)}
                              className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                                    {getTimetableLabel(entry)}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                    {getSlotLabel(entry.slot)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 truncate">
                                    {typeof entry.roomId === 'object' ? entry.roomId?.roomNo : entry.roomId}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {entry.lectureType === 'Lab' ? 'Lab' : 'Theory'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && <DetailModal entry={selectedEntry} onClose={handleCloseDetail} />}
    </div>
  );
};

export default TeacherTimetableView;
