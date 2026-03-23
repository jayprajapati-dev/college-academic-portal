import React, { useEffect, useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, LoadingSpinner, Modal, Button, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (value) => {
  const raw = String(value || '').trim();
  if (!TIME_PATTERN.test(raw)) return null;
  const [hour, minute] = raw.split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToDisplayTime = (minutes) => {
  if (!Number.isFinite(minutes)) return '--:--';
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const safeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const TeacherTimetableView = ({ user, token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(user || storedUser);
  const [role, setRole] = useState((user && user.role) || storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const [timetable, setTimetable] = useState([]);
  const [settings, setSettings] = useState({
    dayStartTime: '10:30',
    dayEndTime: '18:00',
    slotMinutes: 60,
    maxSlot: 8,
    breakWindows: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [dayFilter, setDayFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const effectiveToken = token || localStorage.getItem('token');
  const preferredSubjectId = useMemo(
    () => new URLSearchParams(location.search).get('subjectId') || '',
    [location.search]
  );
  const panelLabel = role === 'admin'
    ? 'Admin Panel'
    : role === 'hod'
      ? 'HOD Panel'
      : role === 'coordinator'
        ? 'Coordinator Panel'
        : 'Teacher Panel';

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

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

      if (!effectiveToken) {
        setError('No authentication token found');
        return;
      }

      const [scheduleRes, settingsRes] = await Promise.all([
        axios.get('/api/timetable/my-schedule', {
          headers: { Authorization: `Bearer ${effectiveToken}` }
        }),
        axios.get('/api/timetable/settings', {
          headers: { Authorization: `Bearer ${effectiveToken}` }
        })
      ]);

      if (settingsRes?.data?.success && settingsRes.data.data) {
        setSettings((prev) => ({ ...prev, ...settingsRes.data.data }));
      }

      if (scheduleRes.data.success && Array.isArray(scheduleRes.data.data)) {
        const activeEntries = scheduleRes.data.data.filter((entry) => entry.status === 'active');
        const scopedEntries = preferredSubjectId
          ? activeEntries.filter((entry) => {
            const sid = typeof entry?.subjectId === 'object' ? entry.subjectId?._id : entry?.subjectId;
            return String(sid || '') === String(preferredSubjectId);
          })
          : activeEntries;

        setTimetable(scopedEntries.sort((a, b) => {
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
  }, [effectiveToken, preferredSubjectId, days]);

  useEffect(() => {
    if (effectiveToken) {
      fetchTeacherTimetable();
    }
  }, [effectiveToken, fetchTeacherTimetable]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!effectiveToken) return;
      try {
        const response = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${effectiveToken}` }
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          setProfile(data.data);
          setRole(data.data.role || 'teacher');
          localStorage.setItem('user', JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Teacher timetable profile fetch error:', err);
      }
    };

    loadProfile();
  }, [effectiveToken]);

  const normalizedBreakWindows = useMemo(() => {
    const dayStart = toMinutes(settings?.dayStartTime);
    const dayEnd = toMinutes(settings?.dayEndTime);
    const list = Array.isArray(settings?.breakWindows) ? settings.breakWindows : [];

    return list
      .map((item, idx) => ({
        start: toMinutes(item?.startTime),
        end: toMinutes(item?.endTime),
        label: String(item?.label || `Break ${idx + 1}`),
        index: idx
      }))
      .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
      .filter((item) => (dayStart === null || item.start >= dayStart) && (dayEnd === null || item.end <= dayEnd))
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }, [settings]);

  const SLOT_OPTIONS = useMemo(() => {
    const startMinutes = toMinutes(settings?.dayStartTime) ?? (10 * 60 + 30);
    const slotMinutes = Number(settings?.slotMinutes) || 60;
    const maxSlot = Number(settings?.maxSlot) || 8;
    const list = [];

    const moveToTeachingTime = (value) => {
      let cursor = value;
      let changed = true;
      while (changed) {
        changed = false;
        for (const win of normalizedBreakWindows) {
          if (cursor >= win.start && cursor < win.end) {
            cursor = win.end;
            changed = true;
            break;
          }
        }
      }
      return cursor;
    };

    let pointer = startMinutes;

    for (let slot = 1; slot <= maxSlot; slot += 1) {
      let start = moveToTeachingTime(pointer);
      let shifted = true;

      while (shifted) {
        shifted = false;
        for (const win of normalizedBreakWindows) {
          if (win.start < start + slotMinutes && win.end > start) {
            start = moveToTeachingTime(win.end);
            shifted = true;
            break;
          }
        }
      }

      const end = start + slotMinutes;
      pointer = end;

      list.push({
        value: slot,
        start,
        end,
        label: `Slot ${slot}: ${minutesToDisplayTime(start)} to ${minutesToDisplayTime(end)}`
      });
    }

    return list;
  }, [normalizedBreakWindows, settings]);

  const timelineRows = useMemo(() => {
    if (!SLOT_OPTIONS.length) return [];

    const rows = [];
    SLOT_OPTIONS.forEach((slotMeta, index) => {
      rows.push({
        type: 'slot',
        slot: slotMeta.value,
        start: slotMeta.start,
        end: slotMeta.end
      });

      const nextSlotStart = SLOT_OPTIONS[index + 1]?.start ?? null;
      const betweenBreaks = normalizedBreakWindows.filter((win) => {
        const startsAfterCurrent = win.start >= slotMeta.end;
        const endsBeforeNext = nextSlotStart === null || win.end <= nextSlotStart;
        return startsAfterCurrent && endsBeforeNext;
      });

      betweenBreaks.forEach((win) => {
        rows.push({
          type: 'break',
          start: win.start,
          end: win.end,
          label: win.label || `Break ${win.index + 1}`
        });
      });
    });

    return rows;
  }, [SLOT_OPTIONS, normalizedBreakWindows]);

  const divisionOptions = useMemo(() => {
    const values = Array.from(new Set(
      timetable
        .map((entry) => (entry?.division && entry.division !== 'General' ? entry.division : 'General'))
        .filter(Boolean)
    ));
    return values.sort((a, b) => String(a).localeCompare(String(b)));
  }, [timetable]);

  const filteredTimetable = useMemo(() => {
    return timetable.filter((entry) => {
      const matchesDay = dayFilter === 'All' ? true : entry?.dayOfWeek === dayFilter;
      const entryType = String(entry?.lectureType || 'Theory').toLowerCase();
      const matchesType = typeFilter === 'All' ? true : entryType === typeFilter.toLowerCase();
      const entryDivision = entry?.division && entry.division !== 'General' ? entry.division : 'General';
      const matchesDivision = divisionFilter === 'All' ? true : entryDivision === divisionFilter;
      return matchesDay && matchesType && matchesDivision;
    });
  }, [dayFilter, divisionFilter, timetable, typeFilter]);

  const weekCellModel = useMemo(() => {
    const byDay = {};
    days.forEach((day) => {
      byDay[day] = { startMap: {}, skipRows: new Set() };
      const dayEntries = filteredTimetable.filter((entry) => entry.dayOfWeek === day);

      dayEntries.forEach((entry) => {
        const slot = Number(entry?.slot);
        if (!Number.isFinite(slot) || slot < 1) return;
        const span = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;

        const startRowIndex = timelineRows.findIndex((row) => row.type === 'slot' && row.slot === slot);
        const endRowIndex = timelineRows.findIndex((row) => row.type === 'slot' && row.slot === (slot + span - 1));
        if (startRowIndex < 0 || endRowIndex < startRowIndex) return;

        const rowSpan = endRowIndex - startRowIndex + 1;
        const crossesBreak = timelineRows.slice(startRowIndex, endRowIndex + 1).some((row) => row.type === 'break');
        const canMergeRows = span > 1 && rowSpan > 1 && !crossesBreak;

        if (!byDay[day].startMap[startRowIndex]) {
          byDay[day].startMap[startRowIndex] = [];
        }

        byDay[day].startMap[startRowIndex].push({
          entry,
          rowSpan: canMergeRows ? rowSpan : 1
        });

        if (canMergeRows) {
          for (let i = startRowIndex + 1; i <= endRowIndex; i += 1) {
            byDay[day].skipRows.add(i);
          }
        }
      });
    });

    return byDay;
  }, [days, filteredTimetable, timelineRows]);

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedEntry(null);
  };

  const getSlotLabel = (slot) => {
    const slotMeta = SLOT_OPTIONS.find((s) => s.value === Number(slot));
    if (!slotMeta) return `Slot ${slot}`;
    return `Slot ${slotMeta.value}: ${minutesToDisplayTime(slotMeta.start)} to ${minutesToDisplayTime(slotMeta.end)}`;
  };

  const getEntryTimeRange = (entry) => {
    const explicitStart = toMinutes(entry?.startTime);
    const explicitEnd = toMinutes(entry?.endTime);
    if (explicitStart !== null && explicitEnd !== null && explicitEnd > explicitStart) {
      return `${minutesToDisplayTime(explicitStart)} to ${minutesToDisplayTime(explicitEnd)}`;
    }

    const slot = Number(entry?.slot);
    if (!Number.isFinite(slot) || slot < 1) return '';
    const span = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;
    const startMeta = SLOT_OPTIONS.find((item) => item.value === slot);
    const endMeta = SLOT_OPTIONS.find((item) => item.value === (slot + span - 1));
    if (!startMeta || !endMeta) return getSlotLabel(slot);
    return `${minutesToDisplayTime(startMeta.start)} to ${minutesToDisplayTime(endMeta.end)}`;
  };

  const handleDownloadPdf = () => {
    const gridRows = timelineRows.map((row, rowIndex) => {
      if (row.type === 'break') {
        return `
          <tr>
            <td class="time-col">${safeHtml(minutesToDisplayTime(row.start))} - ${safeHtml(minutesToDisplayTime(row.end))}</td>
            <td class="break-row" colspan="${days.length}">${safeHtml(row.label || 'Break')}</td>
          </tr>
        `;
      }

      const dayCells = days.map((day) => {
        const model = weekCellModel[day];
        if (model?.skipRows?.has(rowIndex)) return '';

        const starts = model?.startMap?.[rowIndex] || [];
        if (!starts.length) {
          return '<td class="empty">-</td>';
        }

        const first = starts[0];
        const rowSpan = starts.length === 1 ? (first.rowSpan || 1) : 1;

        const content = starts.map((item) => {
          const entry = item.entry;
          const subjectObj = typeof entry?.subjectId === 'object' ? entry.subjectId : null;
          const roomObj = typeof entry?.roomId === 'object' ? entry.roomId : null;

          const subjectName = subjectObj
            ? (subjectObj?.shortName || subjectObj?.code || subjectObj?.name || '-')
            : String(entry?.subjectId || '-');
          const room = roomObj
            ? (roomObj?.shortName || roomObj?.roomNo || roomObj?.name || '-')
            : String(entry?.roomId || '-');
          const division = entry?.division && entry.division !== 'General' ? entry.division : 'General';
          const lectureType = entry?.lectureType || 'Theory';

          return `
            <div class="cell-entry">
              <div class="subject">${safeHtml(subjectName)}</div>
              <div class="meta">${safeHtml(lectureType)}${division !== 'General' ? ` | ${safeHtml(division)}` : ''}</div>
              <div class="meta">${safeHtml(room)}</div>
            </div>
          `;
        }).join('');

        return `<td class="slot-cell"${rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''}>${content}</td>`;
      }).join('');

      return `
        <tr>
          <td class="time-col">${safeHtml(minutesToDisplayTime(row.start))} - ${safeHtml(minutesToDisplayTime(row.end))}</td>
          ${dayCells}
        </tr>
      `;
    }).join('');

    const teacherName = profile?.name || user?.name || 'Teacher';

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Teacher Timetable</title><style>
      @page { size: A4 landscape; margin: 8mm; }
      body { font-family: Arial, sans-serif; color:#111; margin:0; }
      .page { padding: 6px; }
      h1 { margin: 0; font-size: 18px; text-align: center; letter-spacing: 0.04em; }
      .teacher-name { margin: 4px 0 10px; text-align:center; font-size: 11px; color:#334155; font-weight:700; }
      table { width:100%; border-collapse:collapse; table-layout: fixed; font-size: 10px; }
      th, td { border:1px solid #cbd5e1; padding:5px; text-align:left; vertical-align: top; word-wrap: break-word; }
      th { background:#e2e8f0; text-align: center; font-size: 10px; }
      .time-col { white-space: nowrap; width: 14%; font-weight: 700; background:#f8fafc; text-align: center; }
      .empty { text-align: center; color:#94a3b8; }
      .slot-cell { padding: 4px; }
      .cell-entry { border-radius: 4px; border:1px solid #e2e8f0; background:#f8fafc; padding:4px; margin-bottom:4px; }
      .cell-entry:last-child { margin-bottom:0; }
      .subject { font-weight:700; color:#0f172a; font-size:10px; line-height:1.25; }
      .meta { color:#334155; font-size:9px; line-height:1.25; margin-top:2px; }
      .break-row { text-align:center; font-weight:700; color:#92400e; background:#fffbeb; }
    </style></head><body><div class="page">
      <h1>Teacher Timetable</h1>
      <div class="teacher-name">${safeHtml(teacherName)}</div>
      <table>
        <thead>
          <tr>
            <th class="time-col">Time</th>
            ${days.map((day) => `<th>${safeHtml(day)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${gridRows}
        </tbody>
      </table>
    </div></body></html>`;

    const printWindow = window.open('', '_blank', 'width=1280,height=900');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to download PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const DetailModal = ({ entry, onClose }) => {
    if (!entry) return null;

    const subject = entry?.subjectId || {};
    const department = entry?.branchId || {};
    const room = entry?.roomId || {};
    const slotLabel = getEntryTimeRange(entry);
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
    <RoleLayout
      title="Teaching Timetable"
      userName={profile?.name || 'Teacher'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#1f2937] via-[#1e40af] to-[#0f766e] text-white p-4 sm:p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-100">My Schedule</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2">Teaching Timetable</h1>
          <p className="text-sky-100 mt-2 text-sm md:text-base">
            View all your assigned classes with subject, room, and schedule information
          </p>
          {preferredSubjectId && (
            <p className="mt-3 inline-flex px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
              Subject-focused mode is active
            </p>
          )}
          <div className="mt-4">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#1e3a8a] text-sm font-bold hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download PDF
            </button>
          </div>
        </section>

        <Card className="border-slate-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filters</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="All">All Days</option>
                {days.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="All">All Types</option>
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
              </select>

              <select
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="All">All Divisions</option>
                {divisionOptions.map((division) => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="max-w-[1200px] mx-auto p-0 sm:p-0 md:p-0">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <Card title="Error" className="border-red-200">
              <div className="text-red-700 dark:text-red-400 text-sm">{error}</div>
            </Card>
          ) : filteredTimetable.length === 0 ? (
            <Card title="No Classes Available" className="border-amber-200">
              <div className="text-amber-700 dark:text-amber-400 text-sm">
                No classes match selected filters.
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
                      {timelineRows.map((row, rowIndex) => {
                        const rowClass = rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50 dark:bg-slate-900';

                        if (row.type === 'break') {
                          return (
                            <tr key={`break-${rowIndex}`} className="bg-amber-50 dark:bg-amber-900/10">
                              <td className="border border-slate-300 dark:border-slate-600 p-2 font-semibold text-xs text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                {`${minutesToDisplayTime(row.start)} to ${minutesToDisplayTime(row.end)}`}
                              </td>
                              <td
                                colSpan={days.length}
                                className="border border-slate-300 dark:border-slate-600 p-2 text-center text-xs font-bold text-amber-700 dark:text-amber-300"
                              >
                                {row.label || 'Break'}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={`slot-${row.slot}`} className={rowClass}>
                            <td className="border border-slate-300 dark:border-slate-600 p-2 font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                              {`${minutesToDisplayTime(row.start)} to ${minutesToDisplayTime(row.end)}`}
                            </td>
                            {days.map((day) => {
                              const model = weekCellModel[day];
                              if (model?.skipRows?.has(rowIndex)) return null;

                              const starts = model?.startMap?.[rowIndex] || [];
                              if (!starts.length) {
                                return (
                                  <td
                                    key={`${day}-${row.slot}`}
                                    className="border border-slate-300 dark:border-slate-600 p-2"
                                  >
                                    <div className="h-full min-h-[60px] flex items-center justify-center text-slate-400 text-xs">-</div>
                                  </td>
                                );
                              }

                              const first = starts[0];
                              const rowSpan = starts.length === 1 ? (first.rowSpan || 1) : 1;

                              return (
                                <td
                                  key={`${day}-${row.slot}`}
                                  rowSpan={rowSpan}
                                  className="border border-slate-300 dark:border-slate-600 p-2 align-top"
                                >
                                  <div className="space-y-1">
                                    {starts.map((item, idx) => {
                                      const entry = item.entry;
                                      return (
                                        <button
                                          key={`${entry._id || day}-${idx}`}
                                          onClick={() => handleViewDetails(entry)}
                                          className={`w-full p-2.5 rounded-lg border border-white/15 text-white text-[10px] sm:text-xs font-bold text-left leading-tight transition shadow-sm ${String(entry?.lectureType || '').toLowerCase() === 'lab' ? 'bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-600 hover:to-blue-800' : 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700'}`}
                                        >
                                          <div className="font-bold truncate">{getTimetableLabel(entry)}</div>
                                          <div className="text-[9px] opacity-90 mt-1 truncate">
                                            {typeof entry.roomId === 'object' ? entry.roomId?.roomNo : entry.roomId}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

            </>
          )}
        </div>
        {/* Detail Modal */}
        {selectedEntry && <DetailModal entry={selectedEntry} onClose={handleCloseDetail} />}
      </div>
    </RoleLayout>
  );
};

export default TeacherTimetableView;
