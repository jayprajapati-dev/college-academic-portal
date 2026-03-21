import React, { useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Card, LoadingSpinner, Modal, StudentLayout } from '../../components';

const StudentTimetableView = () => {
  const location = useLocation();
  const preselectedSubjectId = useMemo(
    () => new URLSearchParams(location.search).get('subjectId') || '',
    [location.search]
  );
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    dayStartTime: '10:30',
    dayEndTime: '18:00',
    slotMinutes: 60,
    maxSlot: 7,
    breakSlots: [],
    breakWindows: [
      { startTime: '12:30', endTime: '13:00', label: 'Lunch Break' },
      { startTime: '16:00', endTime: '16:10', label: 'Short Break' }
    ]
  });

  const [filters, setFilters] = useState({
    day: 'All',
    subjectId: preselectedSubjectId,
    lectureType: 'All',
    division: 'All'
  });

  const [showGrid, setShowGrid] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

  const getId = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return String(value._id || value.id || value);
  }, []);

  const toMinutes = useCallback((timeValue) => {
    const value = String(timeValue || '');
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) return null;
    return (Number(match[1]) * 60) + Number(match[2]);
  }, []);

  const minutesToHHMM = useCallback((value) => {
    const total = Number(value);
    if (!Number.isFinite(total) || total < 0) return '00:00';
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }, []);

  const slotOptions = useMemo(() => {
    const startMinutes = toMinutes(settings.dayStartTime) ?? (10 * 60 + 30);
    const slotMinutes = Number(settings.slotMinutes) || 60;
    const maxSlot = Number(settings.maxSlot) || 8;
    const breakSet = new Set((settings.breakSlots || []).map((item) => Number(item)));
    const breakWindows = Array.isArray(settings.breakWindows) ? settings.breakWindows : [];

    return Array.from({ length: maxSlot }, (_, index) => {
      const slot = index + 1;
      const start = startMinutes + (index * slotMinutes);
      const end = start + slotMinutes;
      const overlapsBreakWindow = breakWindows.some((item) => {
        const bwStart = toMinutes(item?.startTime);
        const bwEnd = toMinutes(item?.endTime);
        if (bwStart === null || bwEnd === null || bwEnd <= bwStart) return false;
        return start < bwEnd && bwStart < end;
      });
      return {
        value: slot,
        isBreak: breakSet.has(slot) || overlapsBreakWindow,
        start,
        end,
        label: `${minutesToHHMM(start)} - ${minutesToHHMM(end)}`
      };
    });
  }, [minutesToHHMM, settings, toMinutes]);

  const breakWindowText = useMemo(() => {
    const windows = Array.isArray(settings.breakWindows) ? settings.breakWindows : [];
    if (!windows.length) return 'None';
    return windows.map((item) => `${item.startTime}-${item.endTime}`).join(', ');
  }, [settings.breakWindows]);

  const getSlotRange = useCallback((entry) => {
    const slot = Number(entry?.slot) || 1;
    const span = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;
    const slotMeta = slotOptions.find((item) => item.value === slot);
    if (!slotMeta) return `Slot ${slot}`;
    if (span === 1) return slotMeta.label;
    const endSlotMeta = slotOptions.find((item) => item.value === (slot + span - 1));
    if (!endSlotMeta) return `${slotMeta.label} (${span} slots)`;
    return `${slotMeta.label.split(' - ')[0]} - ${endSlotMeta.label.split(' - ')[1]}`;
  }, [slotOptions]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      subjectId: preselectedSubjectId || prev.subjectId
    }));
  }, [preselectedSubjectId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const [profileReq, subjectsReq, timetableReq, settingsReq] = await Promise.allSettled([
          axios.get('/api/profile/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/subjects/student', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/timetable/my-schedule', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/timetable/settings', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (profileReq.status === 'rejected' || subjectsReq.status === 'rejected' || timetableReq.status === 'rejected') {
          throw (profileReq.reason || subjectsReq.reason || timetableReq.reason);
        }

        const profileRes = profileReq.value;
        const subjectsRes = subjectsReq.value;
        const timetableRes = timetableReq.value;

        const profileData = profileRes?.data?.data || JSON.parse(localStorage.getItem('user') || '{}');
        setUser(profileData);

        const subjectList = Array.isArray(subjectsRes?.data?.data) ? subjectsRes.data.data : [];
        setSubjects(subjectList);

        if (settingsReq.status === 'fulfilled' && settingsReq.value?.data?.success) {
          const data = settingsReq.value.data.data || {};
          setSettings((prev) => ({
            ...prev,
            dayStartTime: String(data.dayStartTime || prev.dayStartTime),
            dayEndTime: String(data.dayEndTime || prev.dayEndTime),
            slotMinutes: Number(data.slotMinutes) || prev.slotMinutes,
            maxSlot: Number(data.maxSlot) || prev.maxSlot,
            breakSlots: Array.isArray(data.breakSlots) ? data.breakSlots : prev.breakSlots,
            breakWindows: Array.isArray(data.breakWindows) ? data.breakWindows : prev.breakWindows
          }));
        } else if (settingsReq.status === 'rejected') {
          setError('Timetable settings are temporarily unavailable. Showing schedule with default time window.');
        }

        const allowedSubjectIds = new Set(subjectList.map((subject) => getId(subject)).filter(Boolean));
        const scopedTimetable = (Array.isArray(timetableRes?.data?.data) ? timetableRes.data.data : [])
          .filter((entry) => allowedSubjectIds.has(getId(entry?.subjectId)));

        setTimetable(scopedTimetable);
      } catch (fetchError) {
        console.error('Error fetching student timetable:', fetchError);
        if (fetchError?.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        setError(fetchError?.response?.data?.message || 'Unable to load timetable data right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getId]);

  const filteredTimetable = useMemo(() => {
    return timetable.filter((entry) => {
      const dayMatch = filters.day === 'All' || entry.dayOfWeek === filters.day;
      const subjectMatch = !filters.subjectId || getId(entry.subjectId) === filters.subjectId;
      const lectureMatch = filters.lectureType === 'All' || String(entry.lectureType) === filters.lectureType;
      const divisionMatch = filters.division === 'All' || String(entry.division || 'General') === filters.division;
      return dayMatch && subjectMatch && lectureMatch && divisionMatch;
    });
  }, [filters.day, filters.division, filters.lectureType, filters.subjectId, getId, timetable]);

  const slotMap = useMemo(() => {
    const map = {};
    filteredTimetable.forEach((entry) => {
      const baseSlot = Number(entry?.slot) || 1;
      const span = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;
      for (let offset = 0; offset < span; offset += 1) {
        const key = `${entry.dayOfWeek}|${baseSlot + offset}`;
        if (!map[key]) map[key] = [];
        map[key].push(entry);
      }
    });
    return map;
  }, [filteredTimetable]);

  const divisions = useMemo(
    () => Array.from(new Set(timetable.map((entry) => String(entry.division || 'General')))).sort(),
    [timetable]
  );

  const dailyList = useMemo(() => {
    return days.reduce((acc, day) => {
      acc[day] = filteredTimetable
        .filter((entry) => entry.dayOfWeek === day)
        .sort((a, b) => Number(a.slot || 1) - Number(b.slot || 1));
      return acc;
    }, {});
  }, [days, filteredTimetable]);

  if (loading) {
    return (
      <StudentLayout title="My Timetable" onLogout={handleLogout} userName={user?.name || 'Student'}>
        <div className="min-h-[55vh] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Timetable" onLogout={handleLogout} userName={user?.name || 'Student'}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e40af] to-[#0284c7] text-white p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Student Schedule</p>
              <h1 className="text-2xl md:text-3xl font-black mt-1">Real Timetable View</h1>
              <p className="text-sm text-sky-100 mt-1">Working time: {settings.dayStartTime} to {settings.dayEndTime} | Slot: {settings.slotMinutes} min | Breaks: {breakWindowText}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-white/15">Classes: {filteredTimetable.length}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Subjects: {subjects.length}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Divisions: {divisions.length || 1}</span>
            </div>
          </div>
        </section>

        {error && (
          <Card className="border border-red-200 bg-red-50 text-red-700">
            <p className="text-sm font-semibold">{error}</p>
          </Card>
        )}

        <Card className="bg-white p-5 border border-[#E5E7EB]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={filters.day}
              onChange={(e) => setFilters((prev) => ({ ...prev, day: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="All">All Days</option>
              {days.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <select
              value={filters.subjectId}
              onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
            </select>
            <select
              value={filters.lectureType}
              onChange={(e) => setFilters((prev) => ({ ...prev, lectureType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="All">All Types</option>
              <option value="Theory">Theory</option>
              <option value="Lab">Lab</option>
            </select>
            <select
              value={filters.division}
              onChange={(e) => setFilters((prev) => ({ ...prev, division: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="All">All Sections</option>
              {divisions.map((division) => <option key={division} value={division}>{division}</option>)}
            </select>
            <button
              onClick={() => setShowGrid((prev) => !prev)}
              className="px-3 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold"
            >
              {showGrid ? 'Switch to List' : 'Switch to Grid'}
            </button>
          </div>
        </Card>

        {filteredTimetable.length === 0 ? (
          <Card className="bg-white p-8 text-center border border-[#E5E7EB]">
            <p className="text-gray-600 font-semibold">No timetable found for current filters.</p>
            <p className="text-sm text-gray-500 mt-1">Try changing day/subject/type/section filters.</p>
          </Card>
        ) : showGrid ? (
          <Card className="bg-white p-4 border border-[#E5E7EB] overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700 bg-gray-100 rounded-xl">Time</th>
                  {days.map((day) => (
                    <th key={day} className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700 bg-gray-100 rounded-xl">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slotOptions.map((slotOption) => {
                  if (slotOption.isBreak) {
                    return (
                      <tr key={slotOption.value}>
                        <td className="px-2 py-3 text-xs font-bold text-amber-800 bg-amber-100 rounded-xl">{slotOption.label}</td>
                        <td colSpan={days.length} className="px-2 py-3">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-center text-xs font-semibold py-2">Break</div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slotOption.value}>
                      <td className="px-2 py-3 text-xs font-semibold text-gray-800 bg-gray-50 rounded-xl whitespace-nowrap">{slotOption.label}</td>
                      {days.map((day) => {
                        const key = `${day}|${slotOption.value}`;
                        const entries = slotMap[key] || [];
                        return (
                          <td key={key} className="align-top px-1">
                            {entries.length === 0 ? (
                              <div className="min-h-[88px] rounded-xl border border-dashed border-gray-200 bg-gray-50/40" />
                            ) : (
                              <div className="space-y-2">
                                {entries.map((entry) => (
                                  <button
                                    key={`${entry._id}-${slotOption.value}`}
                                    onClick={() => setSelectedSchedule(entry)}
                                    className="w-full text-left rounded-xl border border-blue-100 bg-blue-50 p-2 hover:bg-blue-100"
                                  >
                                    <p className="text-xs font-bold text-gray-900">{entry.subjectId?.name || 'Subject'}</p>
                                    <p className="text-[11px] text-gray-600">{entry.division || 'General'} | {entry.lectureType}</p>
                                    <p className="text-[11px] text-gray-600">Room: {entry.roomId?.roomNo || '-'}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <Card key={day} className="bg-white border border-[#E5E7EB]">
                <h3 className="text-sm font-bold text-gray-900 mb-3">{day}</h3>
                {dailyList[day]?.length ? (
                  <div className="space-y-2">
                    {dailyList[day].map((entry) => (
                      <button
                        key={entry._id}
                        onClick={() => setSelectedSchedule(entry)}
                        className="w-full text-left rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-3 hover:bg-[#dbeafe]"
                      >
                        <p className="text-sm font-bold text-gray-900">{entry.subjectId?.name || 'Subject'}</p>
                        <p className="text-xs text-gray-600 mt-1">{getSlotRange(entry)} | {entry.division || 'General'} | {entry.lectureType}</p>
                        <p className="text-xs text-gray-600">Room {entry.roomId?.roomNo || '-'} | {entry.teacherId?.name || '-'}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No classes</p>
                )}
              </Card>
            ))}
          </div>
        )}

        {selectedSchedule && (
          <Modal onClose={() => setSelectedSchedule(null)}>
            <div className="w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Class Details</h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Subject:</span> {selectedSchedule.subjectId?.name || '-'}</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Code:</span> {selectedSchedule.subjectId?.code || '-'}</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Day/Time:</span> {selectedSchedule.dayOfWeek} | {getSlotRange(selectedSchedule)}</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Section:</span> {selectedSchedule.division || 'General'}</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Type:</span> {selectedSchedule.lectureType || '-'}</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Room:</span> {selectedSchedule.roomId?.roomNo || '-'}</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Teacher:</span> {selectedSchedule.teacherId?.name || '-'}</div>
                {selectedSchedule.notes ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><span className="font-semibold">Notes:</span> {selectedSchedule.notes}</div>
                ) : null}
              </div>
            </div>
          </Modal>
        )}
      </main>
    </StudentLayout>
  );
};

export default StudentTimetableView;
