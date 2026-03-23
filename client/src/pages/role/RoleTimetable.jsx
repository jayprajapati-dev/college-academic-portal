import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Card, LoadingSpinner, Modal, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleTimetable = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const isAdmin = role === 'admin' || user?.adminAccess === true;
  const isHod = role === 'hod';
  const isTeacher = role === 'teacher';

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalMode, setEditModalMode] = useState('edit');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const createEmptyRow = useCallback((overrides = {}) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subjectId: '',
    teacherId: '',
    roomId: '',
    division: 'General',
    dayOfWeek: 'Monday',
    startTime: '10:30',
    endTime: '11:30',
    lectureType: 'Theory',
    ...overrides
  }), []);

  const [createMeta, setCreateMeta] = useState({
    semesterId: '',
    branchId: '',
    splitCount: '1'
  });
  const [createRows, setCreateRows] = useState(() => [createEmptyRow()]);
  const [formData, setFormData] = useState({
    semesterId: '',
    branchId: '',
    subjectId: '',
    teacherId: '',
    roomId: '',
    division: 'General',
    dayOfWeek: 'Monday',
    startTime: '10:30',
    endTime: '11:30',
    lectureType: 'Theory',
    notes: ''
  });

  const [grantData, setGrantData] = useState({
    userId: '',
    role: 'teacher'
  });
  const [settingsData, setSettingsData] = useState({
    dayStartTime: '10:30',
    dayEndTime: '18:00',
    slotMinutes: 60,
    maxSlot: 8,
    breakSlots: [],
    breakWindows: [],
    teacherMaxHoursPerDay: 6
  });
  const [settingsForm, setSettingsForm] = useState({
    dayStartTime: '10:30',
    dayEndTime: '18:00',
    teacherMaxHoursPerDay: '6',
    breakWindows: []
  });

  const [filters, setFilters] = useState({
    semesterIds: [],
    branchId: '',
    subjectId: '',
    dayOfWeek: '',
    status: 'all'
  });

  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjectShortNameMap, setSubjectShortNameMap] = useState(() => {
    try {
      const raw = localStorage.getItem('timetableSubjectShortNames');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  });
  const [teacherShortNameMap, setTeacherShortNameMap] = useState(() => {
    try {
      const raw = localStorage.getItem('timetableTeacherShortNames');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  });
  const [hodList, setHodList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeHodBranchId, setActiveHodBranchId] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [authFailed, setAuthFailed] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [statusUpdatingIds, setStatusUpdatingIds] = useState([]);
  const [mobileWeekDay, setMobileWeekDay] = useState('Monday');
  const [notification, setNotification] = useState(null);
  const [createResult, setCreateResult] = useState(null);
  const [rowErrorMap, setRowErrorMap] = useState({});
  const [highlightCreateRowId, setHighlightCreateRowId] = useState('');
  const [shortNameEditor, setShortNameEditor] = useState({
    isOpen: false,
    type: 'subject',
    entityId: '',
    entityLabel: '',
    value: ''
  });

  const token = localStorage.getItem('token');
  const canCreateTimetable = isAdmin || isHod;
  const panelLabel = isAdmin ? 'Admin Panel' : isHod ? 'HOD Panel' : 'Teacher Panel';
  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);
  const mobileDays = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
  const realTodayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);
  const todayWeekDay = useMemo(() => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(realTodayName) ? realTodayName : 'Monday';
  }, [realTodayName]);
  const todayAutoLabel = useMemo(() => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(realTodayName)
      ? realTodayName
      : `${realTodayName} (Holiday)`;
  }, [realTodayName]);
  const notify = useCallback((type, message) => {
    setNotification({
      id: Date.now(),
      type,
      message
    });
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
  const minutesToDisplayTime = useCallback((value) => {
    const total = Number(value);
    if (!Number.isFinite(total) || total < 0) return '12:00 AM';
    const hour24 = Math.floor(total / 60) % 24;
    const minute = total % 60;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${String(hour12)}:${String(minute).padStart(2, '0')} ${suffix}`;
  }, []);

  const breaksOverlap = useCallback((startA, endA, startB, endB) => startA < endB && endA > startB, []);

  const SLOT_OPTIONS = useMemo(() => {
    const startMinutes = toMinutes(settingsData.dayStartTime) ?? (10 * 60 + 30);
    const slotMinutes = Number(settingsData.slotMinutes) || 60;
    const maxSlot = Number(settingsData.maxSlot) || 8;
    const breakWindows = Array.isArray(settingsData.breakWindows) ? settingsData.breakWindows : [];
    const list = [];

    for (let slot = 1; slot <= maxSlot; slot += 1) {
      const start = startMinutes + ((slot - 1) * slotMinutes);
      const end = start + slotMinutes;
      const isBreak = breakWindows.some((window) => {
        const breakStart = toMinutes(window?.startTime);
        const breakEnd = toMinutes(window?.endTime);
        if (breakStart === null || breakEnd === null || breakEnd <= breakStart) return false;
        return breaksOverlap(start, end, breakStart, breakEnd);
      });
      list.push({
        value: slot,
        isBreak,
        label: `Slot ${slot} (${minutesToDisplayTime(start)} - ${minutesToDisplayTime(end)})`
      });
    }

    return list;
  }, [breaksOverlap, minutesToDisplayTime, settingsData.breakWindows, settingsData.dayStartTime, settingsData.maxSlot, settingsData.slotMinutes, toMinutes]);
  const DIVISION_OPTIONS = useMemo(() => {
    const splitCount = Math.min(6, Math.max(1, Number(createMeta.splitCount) || 1));
    const toId = (value) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      return String(value._id || value.id || value);
    };
    const selectedBranch = branches.find((branch) => toId(branch) === createMeta.branchId);
    const rawCode = String(selectedBranch?.code || selectedBranch?.name || 'GROUP')
      .replace(/\s+/g, '')
      .toUpperCase();
    const baseCode = rawCode.slice(0, 6) || 'GROUP';

    const options = [];
    for (let part = 1; part <= splitCount; part += 1) {
      options.push(`${baseCode}${part}`);
    }
    return options;
  }, [branches, createMeta.branchId, createMeta.splitCount]);

  const getRangeWarning = useCallback((startTime, endTime, lectureType = 'Theory') => {
    const dayStart = toMinutes(settingsData.dayStartTime);
    const dayEnd = toMinutes(settingsData.dayEndTime);
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    const slotMinutes = Number(settingsData.slotMinutes) || 60;

    if (dayStart === null || dayEnd === null || start === null || end === null) {
      return 'Invalid time format. Use HH:MM.';
    }
    if (end <= start) return 'End time must be after start time.';
    if (start < dayStart || end > dayEnd) {
      return `Time must stay inside working day (${settingsData.dayStartTime} to ${settingsData.dayEndTime}).`;
    }
    if ((start - dayStart) % slotMinutes !== 0 || (end - dayStart) % slotMinutes !== 0) {
      return `Start/end must align to ${slotMinutes}-minute boundaries from ${settingsData.dayStartTime}.`;
    }

    const duration = end - start;
    const normalizedType = String(lectureType || 'Theory').toLowerCase();

    const breakWindows = Array.isArray(settingsData.breakWindows) ? settingsData.breakWindows : [];
    let breakOverlapMinutes = 0;
    const overlapsBreak = breakWindows.some((window) => {
      const breakStart = toMinutes(window?.startTime);
      const breakEnd = toMinutes(window?.endTime);
      if (breakStart === null || breakEnd === null || breakEnd <= breakStart) return false;
      if (!breaksOverlap(start, end, breakStart, breakEnd)) return false;
      const overlapStart = Math.max(start, breakStart);
      const overlapEnd = Math.min(end, breakEnd);
      breakOverlapMinutes += Math.max(0, overlapEnd - overlapStart);
      return true;
    });

    if (normalizedType === 'lab') {
      const effectiveTeachingMinutes = duration - breakOverlapMinutes;
      if (effectiveTeachingMinutes !== 120) {
        return 'Lab must contain 2 hours of teaching time (break in between is allowed).';
      }
      return '';
    }

    if (duration !== 60) {
      return 'Theory duration must be exactly 1 hour.';
    }

    if (overlapsBreak) {
      return 'Class timing overlaps with a configured break window.';
    }

    return '';
  }, [breaksOverlap, settingsData.breakWindows, settingsData.dayEndTime, settingsData.dayStartTime, settingsData.slotMinutes, toMinutes]);

  const mapTimeRangeToSlot = useCallback((startTime, endTime, lectureType = 'Theory') => {
    const warning = getRangeWarning(startTime, endTime, lectureType);
    if (warning) return { error: warning };

    const dayStart = toMinutes(settingsData.dayStartTime);
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    const slotMinutes = Number(settingsData.slotMinutes) || 60;

    if (dayStart === null || start === null || end === null) {
      return { error: 'Invalid time range.' };
    }

    const slot = Math.floor((start - dayStart) / slotMinutes) + 1;
    const slotSpan = Math.floor((end - start) / slotMinutes);
    return { slot, slotSpan };
  }, [getRangeWarning, settingsData.dayStartTime, settingsData.slotMinutes, toMinutes]);

  useEffect(() => {
    if (!DIVISION_OPTIONS.length) return;
    setCreateRows((prev) => prev.map((row, index) => {
      if (DIVISION_OPTIONS.includes(row.division)) return row;
      return { ...row, division: DIVISION_OPTIONS[index % DIVISION_OPTIONS.length] };
    }));
  }, [DIVISION_OPTIONS]);

  const getId = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const idValue = value?._id || value?.id || value;
    return String(idValue);
  }, []);

  const hodBranchIds = useMemo(() => {
    if (!isHod) return [];

    return Array.from(new Set([
      getId(user?.branch),
      getId(user?.department),
      ...((Array.isArray(user?.branches) ? user.branches : []).map((branch) => getId(branch)))
    ].filter(Boolean)));
  }, [getId, isHod, user]);

  const scopedBranches = useMemo(() => {
    if (!isHod) return branches;
    if (hodBranchIds.length === 0) return [];
    return branches.filter((branch) => hodBranchIds.includes(getId(branch)));
  }, [branches, getId, hodBranchIds, isHod]);

  const activeHodBranch = useMemo(() => {
    if (!isHod || !activeHodBranchId) return null;
    return scopedBranches.find((b) => getId(b) === activeHodBranchId) || null;
  }, [activeHodBranchId, getId, isHod, scopedBranches]);

  const teacherOptions = useMemo(() => {
    const map = new Map();

    teachers.forEach((teacher) => {
      const teacherId = getId(teacher);
      if (teacherId) map.set(teacherId, teacher);
    });

    if (isAdmin) {
      hodList.forEach((hod) => {
        const hodId = getId(hod);
        if (hodId) map.set(hodId, hod);
      });
    }

    return Array.from(map.values());
  }, [getId, hodList, isAdmin, teachers]);

  const getEntryStatus = (entry) => {
    const status = String(entry?.status || 'active').toLowerCase();
    if (status === 'cancelled' || status === 'archived') return status;
    return 'active';
  };
  const isStatusUpdating = useCallback((entryId) => {
    return statusUpdatingIds.includes(String(entryId));
  }, [statusUpdatingIds]);
  const getLabel = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || value.code || '';
  }, []);

  const compactByWords = useCallback((value = '', limit = 4) => {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '-';
    if (words.length === 1) return words[0].slice(0, 12).toUpperCase();
    return words.slice(0, limit).map((word) => word[0].toUpperCase()).join('');
  }, []);

  const compactTeacherName = useCallback((value = '') => {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '-';
    if (words.length === 1) return words[0].slice(0, 12).toUpperCase();
    return `${words[0][0].toUpperCase()}. ${words.slice(1).join(' ')}`.trim();
  }, []);

  const getSubjectByRef = useCallback((subjectRef) => {
    const subjectId = getId(subjectRef);
    if (!subjectId) return null;
    if (subjectRef && typeof subjectRef === 'object') return subjectRef;
    return subjects.find((subject) => getId(subject) === subjectId) || null;
  }, [getId, subjects]);

  const getTeacherByRef = useCallback((teacherRef) => {
    const teacherId = getId(teacherRef);
    if (!teacherId) return null;
    if (teacherRef && typeof teacherRef === 'object') return teacherRef;
    return teacherOptions.find((teacher) => getId(teacher) === teacherId) || null;
  }, [getId, teacherOptions]);

  const getSubjectShortLabel = useCallback((subjectRef) => {
    const subjectId = getId(subjectRef);
    const custom = subjectId ? String(subjectShortNameMap[subjectId] || '').trim() : '';
    if (custom) return custom;
    const subjectObj = getSubjectByRef(subjectRef);
    if (subjectObj?.code) return String(subjectObj.code).trim().toUpperCase();
    return compactByWords(subjectObj?.name || 'Subject', 5);
  }, [compactByWords, getId, getSubjectByRef, subjectShortNameMap]);

  const getTeacherShortLabel = useCallback((teacherRef) => {
    const teacherId = getId(teacherRef);
    const custom = teacherId ? String(teacherShortNameMap[teacherId] || '').trim() : '';
    if (custom) return custom;
    const teacherObj = getTeacherByRef(teacherRef);
    return compactTeacherName(teacherObj?.name || 'Teacher');
  }, [compactTeacherName, getId, getTeacherByRef, teacherShortNameMap]);

  const handleEditShortName = useCallback((type, entityRef) => {
    const entityId = getId(entityRef);
    if (!entityId) {
      notify('warning', `Please select a ${type} first.`);
      return;
    }

    if (type === 'subject') {
      const subjectObj = getSubjectByRef(entityRef);
      const current = String(subjectShortNameMap[entityId] || '').trim();
      const suggested = current || getSubjectShortLabel(entityRef);
      setShortNameEditor({
        isOpen: true,
        type: 'subject',
        entityId,
        entityLabel: subjectObj?.name || 'Selected Subject',
        value: suggested
      });
      return;
    }

    const teacherObj = getTeacherByRef(entityRef);
    const current = String(teacherShortNameMap[entityId] || '').trim();
    const suggested = current || getTeacherShortLabel(entityRef);
    setShortNameEditor({
      isOpen: true,
      type: 'teacher',
      entityId,
      entityLabel: teacherObj?.name || 'Selected Teacher',
      value: suggested
    });
  }, [getId, getSubjectByRef, getSubjectShortLabel, getTeacherByRef, getTeacherShortLabel, notify, subjectShortNameMap, teacherShortNameMap]);

  const handleSaveShortName = useCallback(() => {
    const entityId = String(shortNameEditor.entityId || '').trim();
    if (!entityId) {
      setShortNameEditor((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const normalized = String(shortNameEditor.value || '').trim();

    if (shortNameEditor.type === 'subject') {
      setSubjectShortNameMap((prev) => {
        const next = { ...prev };
        if (normalized) {
          next[entityId] = normalized;
        } else {
          delete next[entityId];
        }
        return next;
      });
      notify('success', normalized ? 'Subject short name updated.' : 'Subject short name reset to auto.');
    } else {
      setTeacherShortNameMap((prev) => {
        const next = { ...prev };
        if (normalized) {
          next[entityId] = normalized;
        } else {
          delete next[entityId];
        }
        return next;
      });
      notify('success', normalized ? 'Teacher short name updated.' : 'Teacher short name reset to auto.');
    }

    setShortNameEditor((prev) => ({ ...prev, isOpen: false }));
  }, [notify, shortNameEditor]);

  const formatTime = (time = '00:00') => {
    const parts = String(time).split(':');
    const hour = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
    const minute = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const getSlotValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    return Math.floor(numeric);
  };

  const getSlotRange = (entry) => {
    const slot = getSlotValue(entry?.slot);
    const span = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;
    const slotMeta = SLOT_OPTIONS.find((item) => item.value === slot);

    if (slotMeta) {
      const rangeText = slotMeta.label.replace(`Slot ${slot} `, '');
      if (span === 2) {
        return rangeText.replace(')', ' + next slot)');
      }
      return rangeText;
    }

    const fallbackStart = formatTime(entry?.startTime || '08:00');
    const fallbackEnd = formatTime(entry?.endTime || '09:00');
    return `(${fallbackStart} - ${fallbackEnd})`;
  };

  const getRoomLabel = (entry) => {
    return entry?.roomId?.roomNo || entry?.roomNo || '-';
  };

  const canDirectlyControlEntry = useCallback((entry) => {
    if (!entry) return false;
    const userId = getId(user?._id);
    if (isAdmin) return true;
    if (isHod) {
      const entryBranchId = getId(entry.branchId);
      return hodBranchIds.includes(entryBranchId);
    }
    return (entry.canBeModifiedBy || []).some((perm) => getId(perm.userId) === userId);
  }, [getId, hodBranchIds, isAdmin, isHod, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUnauthorized = useCallback(() => {
    if (authFailed) return true;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthFailed(true);
    alert('Session expired. Please login again.');
    navigate('/login');
    return true;
  }, [authFailed, navigate]);

  const handleAuthError = useCallback((error) => {
    if (error?.response?.status === 401) {
      return handleUnauthorized();
    }
    return false;
  }, [handleUnauthorized]);

  const fetchProfile = useCallback(async () => {
    try {
      if (authFailed) return;
      if (!token) {
        navigate('/login');
        return;
      }

      const profileRes = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.status === 401) {
        handleUnauthorized();
        return;
      }
      const profileData = await profileRes.json();

      if (!profileData.success) {
        navigate('/login');
        return;
      }

      setUser(profileData.data);
      setRole(profileData.data.role);
      setProfileReady(true);
    } catch (error) {
      console.error('Profile error:', error);
      if (!handleAuthError(error)) {
        navigate('/login');
      }
    }
  }, [authFailed, handleAuthError, handleUnauthorized, navigate, token]);

  const fetchMetadata = useCallback(async () => {
    try {
      if (!token || authFailed) return;

      if (isAdmin) {
        const [semRes, brRes, subjRes, teachRes, hodRes, roomRes] = await Promise.all([
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=teacher', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=hod', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/room', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (semRes.data.success) setSemesters(semRes.data.data || []);
        if (brRes.data.success) setBranches(brRes.data.data || []);
        if (subjRes.data.success) setSubjects(subjRes.data.data || []);
        if (teachRes.data.success) setTeachers(teachRes.data.data || []);
        if (hodRes.data.success) setHodList(hodRes.data.data || []);
        if (roomRes.data.success) setRooms(roomRes.data.data || []);
        return;
      }

      if (isHod) {
        const [subjRes, semRes, teachRes, brRes, roomRes] = await Promise.all([
          axios.get('/api/academic/subjects/hod', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=teacher', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/room', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.data || []);
        if (semRes.data.success) setSemesters(semRes.data.data || []);
        if (teachRes.data.success) setTeachers(teachRes.data.data || []);
        if (brRes?.data?.success) setBranches(brRes.data.data || []);
        if (roomRes?.data?.success) setRooms(roomRes.data.data || []);
        return;
      }

      if (isTeacher && user?._id) {
        const [subjRes, semRes, roomRes] = await Promise.all([
          axios.get(`/api/academic/teacher/${user._id}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/room', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.subjects || []);
        if (semRes.data.success) setSemesters(semRes.data.data || []);
        if (roomRes.data.success) setRooms(roomRes.data.data || []);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching metadata:', error);
      }
    }
  }, [authFailed, handleAuthError, isAdmin, isHod, isTeacher, token, user]);

  const fetchTimetableSettings = useCallback(async () => {
    try {
      if (!token || authFailed) return;
      const res = await axios.get('/api/timetable/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        const dayStartTime = String(res.data.data?.dayStartTime || '10:30');
        const dayEndTime = String(res.data.data?.dayEndTime || '18:00');
        const slotMinutes = 60;
        const explicitMaxSlot = Number(res.data.data?.maxSlot);
        const dayStart = toMinutes(dayStartTime);
        const dayEnd = toMinutes(dayEndTime);
        const computedMaxSlot = dayStart !== null && dayEnd !== null && dayEnd > dayStart
          ? Math.max(1, Math.floor((dayEnd - dayStart) / slotMinutes))
          : 8;
        const maxSlot = Number.isInteger(explicitMaxSlot) && explicitMaxSlot > 0 ? explicitMaxSlot : computedMaxSlot;
        const breakSlots = Array.isArray(res.data.data?.breakSlots)
          ? res.data.data.breakSlots.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
          : [];
        const breakWindows = Array.isArray(res.data.data?.breakWindows)
          ? res.data.data.breakWindows
            .map((window) => ({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              startTime: String(window?.startTime || ''),
              endTime: String(window?.endTime || '')
            }))
            .filter((window) => window.startTime && window.endTime)
          : [];
        const teacherMaxHoursPerDay = Number(res.data.data?.teacherMaxHoursPerDay) || 6;

        setSettingsData({ dayStartTime, dayEndTime, slotMinutes, maxSlot, breakSlots, breakWindows, teacherMaxHoursPerDay });
        setSettingsForm({
          dayStartTime,
          dayEndTime,
          teacherMaxHoursPerDay: String(teacherMaxHoursPerDay),
          breakWindows: breakWindows.length ? breakWindows : [{ id: `break-${Date.now()}`, startTime: '', endTime: '' }]
        });
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching timetable settings:', error);
      }
    }
  }, [authFailed, handleAuthError, toMinutes, token]);

  const fetchTimetables = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!token || authFailed) {
        if (!silent) setLoading(false);
        return;
      }
      if (!silent) setLoading(true);

      if (isAdmin) {
        const params = {};
        if (filters.branchId) params.branchId = filters.branchId;
        if (filters.dayOfWeek) params.dayOfWeek = filters.dayOfWeek;
        if (filters.status) params.status = filters.status;
        params.limit = 500;

        const res = await axios.get('/api/timetable/all', {
          headers: { Authorization: `Bearer ${token}` },
          params
        });

        if (res.data.success) {
          setTimetables(res.data.data || []);
          setLastUpdatedAt(new Date());
        }
      } else if (isHod) {
        // For HOD, fetch all timetables but filter by their assigned branches
        const res = await axios.get('/api/timetable/all', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 500 }
        });

        if (res.data.success) {
          // Filter timetables to only show HOD's assigned branches
          const hodTimetables = (res.data.data || []).filter(entry => 
            hodBranchIds.includes(String(entry.branchId?._id || entry.branchId))
          );
          setTimetables(hodTimetables);
          setLastUpdatedAt(new Date());
        }
      } else {
        // Teacher view - only their schedule
        const res = await axios.get('/api/timetable/my-schedule', {
          headers: { Authorization: `Bearer ${token}` },
          params: filters.dayOfWeek ? { dayOfWeek: filters.dayOfWeek } : undefined
        });

        if (res.data.success) {
          setTimetables(res.data.data || []);
          setLastUpdatedAt(new Date());
        }
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching timetables:', error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFailed, filters, handleAuthError, isAdmin, isHod, token, hodBranchIds]);

  // Auto-select first HOD branch when branches are loaded
  useEffect(() => {
    if (isHod && hodBranchIds.length > 0 && !activeHodBranchId) {
      setActiveHodBranchId(hodBranchIds[0]);
    }
  }, [activeHodBranchId, hodBranchIds, isHod]);

  useEffect(() => {
    if (!token || authFailed) {
      navigate('/login');
      return;
    }

    setProfileReady(false);
    fetchProfile();
  }, [authFailed, fetchProfile, navigate, token]);

  useEffect(() => {
    if (authFailed || !profileReady) return;
    fetchMetadata();
  }, [authFailed, fetchMetadata, profileReady]);

  useEffect(() => {
    if (authFailed || !profileReady) return;
    fetchTimetableSettings();
  }, [authFailed, fetchTimetableSettings, profileReady]);

  useEffect(() => {
    if (authFailed || !profileReady) return;
    if (isHod && hodBranchIds.length === 0) return;
    fetchTimetables();
  }, [authFailed, fetchTimetables, hodBranchIds.length, isHod, profileReady]);

  useEffect(() => {
    if (!token || authFailed || !profileReady) return undefined;
    const intervalId = setInterval(() => {
      fetchTimetables({ silent: true });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [authFailed, fetchTimetables, profileReady, token]);

  useEffect(() => {
    setMobileWeekDay(mobileDays.includes(realTodayName) ? realTodayName : todayWeekDay);
  }, [mobileDays, realTodayName, todayWeekDay]);

  useEffect(() => {
    if (filters.dayOfWeek && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(filters.dayOfWeek)) {
      setMobileWeekDay(filters.dayOfWeek);
    }
  }, [filters.dayOfWeek]);

  useEffect(() => {
    localStorage.setItem('timetableSubjectShortNames', JSON.stringify(subjectShortNameMap));
  }, [subjectShortNameMap]);

  useEffect(() => {
    localStorage.setItem('timetableTeacherShortNames', JSON.stringify(teacherShortNameMap));
  }, [teacherShortNameMap]);

  useEffect(() => {
    if (!notification?.id) return undefined;
    const timeoutId = setTimeout(() => {
      setNotification((current) => (current?.id === notification.id ? null : current));
    }, 3200);
    return () => clearTimeout(timeoutId);
  }, [notification]);

  useEffect(() => {
    if (!highlightCreateRowId) return undefined;
    const timeoutId = setTimeout(() => {
      setHighlightCreateRowId('');
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [highlightCreateRowId]);

  const filteredTimetables = useMemo(() => {
    return timetables.filter((entry) => {
      const selectedSemesterIds = Array.isArray(filters.semesterIds) ? filters.semesterIds : [];
      const semMatch = selectedSemesterIds.length === 0 || selectedSemesterIds.includes(getId(entry.semesterId));
      const subjectMatch = !filters.subjectId || getId(entry.subjectId) === filters.subjectId;
      // HOD: filter by the currently selected branch tab; Admin: use filter dropdown
      const branchMatch = isHod
        ? (!activeHodBranchId || getId(entry.branchId) === activeHodBranchId)
        : (!filters.branchId || getId(entry.branchId) === filters.branchId);
      const dayMatch = !filters.dayOfWeek || entry.dayOfWeek === filters.dayOfWeek;
      const statusMatch = filters.status === 'all' || getEntryStatus(entry) === filters.status;
      return semMatch && subjectMatch && branchMatch && dayMatch && statusMatch;
    });
  }, [activeHodBranchId, filters.branchId, filters.dayOfWeek, filters.semesterIds, filters.status, filters.subjectId, getId, isHod, timetables]);

  const managementFilteredTimetables = useMemo(() => {
    return timetables.filter((entry) => {
      const selectedSemesterIds = Array.isArray(filters.semesterIds) ? filters.semesterIds : [];
      const semMatch = selectedSemesterIds.length === 0 || selectedSemesterIds.includes(getId(entry.semesterId));
      const branchMatch = isHod
        ? (!activeHodBranchId || getId(entry.branchId) === activeHodBranchId)
        : (!filters.branchId || getId(entry.branchId) === filters.branchId);
      return semMatch && branchMatch;
    });
  }, [activeHodBranchId, filters.branchId, filters.semesterIds, getId, isHod, timetables]);

  const timetableStats = useMemo(() => {
    const visibleRows = filteredTimetables;
    const total = visibleRows.length;
    const theory = visibleRows.filter((t) => String(t.lectureType || '').toLowerCase() === 'theory').length;
    const practical = visibleRows.filter((t) => {
      const type = String(t.lectureType || '').toLowerCase();
      return type === 'practical' || type === 'lab';
    }).length;
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayCount = visibleRows.filter((t) => t.dayOfWeek === todayName).length;
    return { total, theory, practical, todayCount };
  }, [filteredTimetables]);

  const timeSlots = useMemo(() => SLOT_OPTIONS.map((item) => item.value), [SLOT_OPTIONS]);

  const breakSlotOrder = useMemo(() => {
    const map = {};
    let order = 0;
    SLOT_OPTIONS.forEach((item) => {
      if (item.isBreak) {
        order += 1;
        map[item.value] = order;
      }
    });
    return map;
  }, [SLOT_OPTIONS]);

  const dayOrderMap = useMemo(() => {
    const map = {};
    days.forEach((day, index) => {
      map[day] = index;
    });
    return map;
  }, [days]);

  const managementRows = useMemo(() => {
    return [...managementFilteredTimetables].sort((a, b) => {
      const dayDiff = (dayOrderMap[a.dayOfWeek] ?? 99) - (dayOrderMap[b.dayOfWeek] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return getSlotValue(a?.slot) - getSlotValue(b?.slot);
    });
  }, [dayOrderMap, managementFilteredTimetables]);
  const slotMap = useMemo(() => {
    const map = {};
    filteredTimetables.forEach((entry) => {
      const baseSlot = getSlotValue(entry?.slot);
      const slotSpan = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;
      for (let offset = 0; offset < slotSpan; offset += 1) {
        const key = `${entry.dayOfWeek}|${baseSlot + offset}`;
        if (!map[key]) map[key] = [];
        map[key].push(entry);
      }
    });
    return map;
  }, [filteredTimetables]);

  const conflictCount = useMemo(() => {
    return Object.values(slotMap).filter((entries) => entries.length > 1).length;
  }, [slotMap]);

  const divisionCountByScope = useMemo(() => {
    const scopeMap = {};
    filteredTimetables.forEach((entry) => {
      const scopeKey = `${getId(entry?.semesterId)}|${getId(entry?.branchId)}`;
      if (!scopeMap[scopeKey]) {
        scopeMap[scopeKey] = new Set();
      }

      const division = String(entry?.division || '').trim();
      if (!division || division.toLowerCase() === 'general') return;
      scopeMap[scopeKey].add(division.toLowerCase());
    });

    const counts = {};
    Object.entries(scopeMap).forEach(([key, value]) => {
      counts[key] = value.size;
    });
    return counts;
  }, [filteredTimetables, getId]);

  const shouldShowSectionBadge = useCallback((entry) => {
    const scopeKey = `${getId(entry?.semesterId)}|${getId(entry?.branchId)}`;
    return (divisionCountByScope[scopeKey] || 0) >= 2;
  }, [divisionCountByScope, getId]);

  const getLectureTone = (entry) => {
    const type = (entry.lectureType || '').toLowerCase();
    if (type === 'lab' || type === 'practical') {
      return 'bg-[#dbeafe] border-[#93c5fd]';
    }
    return 'bg-white border-[#e5e7eb]';
  };

  const handleDownloadPdf = () => {
    const selectedSemesterIds = Array.isArray(filters.semesterIds) ? filters.semesterIds : [];
    const pdfTimetables = timetables.filter((entry) => {
      const semMatch = selectedSemesterIds.length === 0 || selectedSemesterIds.includes(getId(entry.semesterId));
      const subjectMatch = !filters.subjectId || getId(entry.subjectId) === filters.subjectId;
      const branchMatch = isHod
        ? (!activeHodBranchId || getId(entry.branchId) === activeHodBranchId)
        : (!filters.branchId || getId(entry.branchId) === filters.branchId);
      const dayMatch = !filters.dayOfWeek || entry.dayOfWeek === filters.dayOfWeek;
      const statusMatch = getEntryStatus(entry) === 'active';
      return semMatch && subjectMatch && branchMatch && dayMatch && statusMatch;
    });

    if (!pdfTimetables.length) {
      alert('No timetable data available for current filters.');
      return;
    }

    const safe = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const instituteName = 'Government Polytechnic, Palanpur';
    const departmentName = 'Department of Information Technology';

    const formatDate = (value) => {
      if (!value) return '';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const semMap = new Map();
    pdfTimetables.forEach((entry) => {
      const semId = getId(entry?.semesterId);
      if (!semId) return;
      if (!semMap.has(semId)) {
        const semObj = semesters.find((s) => getId(s) === semId) || entry?.semesterId || {};
        semMap.set(semId, {
          id: semId,
          name: semObj?.name || semObj?.code || `Semester ${semObj?.semesterNumber || ''}`.trim(),
          startDate: semObj?.startDate,
          endDate: semObj?.endDate,
          entries: []
        });
      }
      semMap.get(semId).entries.push(entry);
    });

    const semesterGroups = Array.from(semMap.values()).slice(0, 3);
    if (!semesterGroups.length) {
      alert('No semester data available for PDF export.');
      return;
    }

    const termText = semesterGroups
      .map((group) => {
        const start = formatDate(group.startDate);
        const end = formatDate(group.endDate);
        if (!start || !end) return '';
        return `${group.name}: ${start} to ${end}`;
      })
      .filter(Boolean)
      .join(' | ') || 'Term dates not available';

    const dayHead = days.map((day) => `<th>${safe(day)}</th>`).join('');

    const semesterTablesHtml = semesterGroups.map((group) => {
      const bodyRows = timeSlots.map((slot) => {
        const slotMeta = SLOT_OPTIONS.find((item) => item.value === slot);
        const timeLabel = slotMeta ? slotMeta.label.replace(`Slot ${slot} `, '') : `Slot ${slot}`;

        const dayCells = days.map((day) => {
          const slotEntries = group.entries.filter((entry) => entry.dayOfWeek === day && getSlotValue(entry?.slot) === slot);
          if (!slotEntries.length) return '<td class="entry-cell">-</td>';

          const text = slotEntries.map((entry) => {
            const subjectShort = getSubjectShortLabel(entry?.subjectId);
            const teacherShort = getTeacherShortLabel(entry?.teacherId);
            const hasPart = !!entry?.division && String(entry.division).toLowerCase() !== 'general';
            const part = hasPart ? ` Part-${safe(entry.division)}` : '';
            return `${safe(subjectShort)}${part}<br/>${safe(teacherShort)}`;
          }).join('<hr style="border:0;border-top:1px dotted #ddd;margin:2px 0;"/>');

          return `<td class="entry-cell">${text}</td>`;
        }).join('');

        return `<tr><td class="time-cell">${safe(timeLabel)}</td>${dayCells}</tr>`;
      }).join('');

      return `
        <section class="sem-section">
          <div class="sem-title">${safe(group.name)}</div>
          <table>
            <thead>
              <tr>
                <th style="width:86px;">TIME</th>
                ${dayHead}
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </section>
      `;
    }).join('');
    const generatedAt = new Date().toLocaleString();
    const subjectLabel = filters.subjectId
      ? getLabel(subjects.find((s) => getId(s) === filters.subjectId))
      : 'All Subjects';
    const statusLabel = 'Active Only';

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Weekly Timetable</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111111;
            font-family: Arial, Helvetica, sans-serif;
            background: #ffffff;
          }
          .top {
            text-align: center;
            margin-bottom: 6px;
          }
          .college { font-size: 15px; font-weight: 700; margin: 0; }
          .dept { font-size: 13px; font-weight: 700; margin: 2px 0 0; }
          .term { font-size: 10px; font-weight: 700; margin: 4px 0 0; }
          .meta { font-size: 9px; margin-top: 3px; }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #222;
            padding: 3px 3px;
            vertical-align: middle;
          }
          thead th {
            text-align: center;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            background: #f5f5f5;
          }
          .sem-section { margin-top: 8px; }
          .sem-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0 0 4px;
            padding: 3px 4px;
            border: 1px solid #222;
            background: #f8fafc;
          }
          .time-cell {
            width: 86px;
            min-width: 86px;
            text-align: center;
            font-size: 9px;
            font-weight: 700;
            background: #fcfcfc;
          }
          .entry-cell {
            text-align: center;
            font-size: 9px;
            line-height: 1.18;
            height: 22px;
          }
        </style>
      </head>
      <body>
        <div class="top">
          <p class="college">${safe(instituteName)}</p>
          <p class="dept">${safe(departmentName)}</p>
          <p class="term">TIME TABLE TERM DATES - ${safe(termText)}</p>
          <p class="meta">Generated: ${safe(generatedAt)} | Subject Filter: ${safe(subjectLabel)} | Status: ${safe(statusLabel)}</p>
        </div>

        ${semesterTablesHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1400,height=900');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to download PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const resetCreateForm = useCallback((overrides = {}) => {
    const preferredBranchId = overrides.branchId || (isHod ? (activeHodBranchId || hodBranchIds[0] || getId(user?.branch)) : '');
    const preferredTeacherId = isHod ? getId(user?._id) : '';
    setCreateMeta({
      semesterId: overrides.semesterId || getId(user?.semester) || '',
      branchId: preferredBranchId || '',
      splitCount: overrides.splitCount || '1'
    });
    setCreateRows([createEmptyRow({ teacherId: preferredTeacherId || '', division: 'General' })]);
  }, [activeHodBranchId, createEmptyRow, getId, hodBranchIds, isHod, user]);

  const handleCreateTimetable = async () => {
    setCreateResult(null);
    setRowErrorMap({});

    if (!createMeta.semesterId || !createMeta.branchId) {
      notify('warning', 'Please select semester and branch first.');
      setCreateResult({
        type: 'warning',
        title: 'Create Not Started',
        message: 'Semester and branch are required before creating timetable entries.'
      });
      return;
    }

    if (!createRows.length) {
      notify('warning', 'Please add at least one timetable row.');
      setCreateResult({
        type: 'warning',
        title: 'Create Not Started',
        message: 'No rows found. Add at least one row and try again.'
      });
      return;
    }

    const invalidRows = createRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => (
        !row.subjectId ||
        !row.teacherId ||
        !row.roomId ||
        !row.division ||
        !row.dayOfWeek ||
        !row.startTime ||
        !row.endTime
      ));

    if (invalidRows.length) {
      notify('warning', `Please fill all required fields in row(s): ${invalidRows.map((item) => item.index + 1).join(', ')}`);
      setCreateResult({
        type: 'warning',
        title: 'Create Not Started',
        message: `Required fields missing in row(s): ${invalidRows.map((item) => item.index + 1).join(', ')}.`
      });
      return;
    }

    const createdIds = [];
    const createdEntries = [];
    const failedRows = [];
    let restoredCount = 0;

    try {
      setSaving(true);

      for (let index = 0; index < createRows.length; index += 1) {
        const row = createRows[index];
        const mapped = mapTimeRangeToSlot(row.startTime, row.endTime, row.lectureType);
        if (mapped.error) {
          failedRows.push({
            rowId: row.id,
            rowNumber: index + 1,
            message: mapped.error
          });
          continue;
        }

        const payload = {
          semesterId: createMeta.semesterId,
          branchId: createMeta.branchId,
          subjectId: row.subjectId,
          teacherId: row.teacherId,
          roomId: row.roomId,
          division: row.division,
          dayOfWeek: row.dayOfWeek,
          slot: mapped.slot,
          slotSpan: mapped.slotSpan,
          lectureType: row.lectureType
        };

        try {
          const res = await axios.post('/api/timetable/create', payload, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.success) {
            createdIds.push(row.id);
            if (res.data?.restored) restoredCount += 1;
            if (res.data?.data) {
              createdEntries.push(res.data.data);
            }
          } else {
            failedRows.push({
              rowId: row.id,
              rowNumber: index + 1,
              message: res.data?.message || 'Unknown error while creating entry'
            });
          }
        } catch (error) {
          if (handleAuthError(error)) {
            return;
          }

          const apiMessage = error.response?.data?.message;
          const conflicts = error.response?.data?.conflicts;
          let message = apiMessage || 'Error creating timetable entry';

          if (error.response?.status === 400 && Array.isArray(conflicts) && conflicts.length > 0) {
            message = conflicts.map((conflict) => conflict.message).join(' | ');
          }

          failedRows.push({
            rowId: row.id,
            rowNumber: index + 1,
            message
          });
        }
      }

      if (createdIds.length > 0) {
        if (isHod && createMeta.branchId) {
          setActiveHodBranchId(createMeta.branchId);
        }

        // Keep local view in sync immediately, then re-fetch authoritative data.
        if (createdEntries.length > 0) {
          setTimetables((prev) => {
            const existing = new Set(prev.map((item) => getId(item)));
            const fresh = createdEntries.filter((item) => !existing.has(getId(item)));
            return fresh.length ? [...fresh, ...prev] : prev;
          });
        }
      }

      setFilters((prev) => ({
        ...prev,
        semesterIds: createMeta.semesterId ? [createMeta.semesterId] : prev.semesterIds,
        branchId: createMeta.branchId || prev.branchId,
        dayOfWeek: '',
        subjectId: '',
        status: 'all'
      }));

      // Always refresh list so failed attempts also show current rows outside modal.
      await fetchTimetables();

      if (failedRows.length === 0) {
        const createdCount = Math.max(0, createdIds.length - restoredCount);
        const summary = `Requested: ${createRows.length} | Created: ${createdCount} | Failed: 0 | Updated: ${restoredCount}`;
        notify('success', `Create complete. ${summary}`);
        setCreateResult({
          type: 'success',
          title: 'Create Complete',
          message: `${summary}. Existing archived rows were restored where possible.`
        });
        setRowErrorMap({});
        setShowCreateModal(false);
        resetCreateForm();
        return;
      }

      const rowErrorLookup = {};
      failedRows.forEach((item) => {
        rowErrorLookup[item.rowId] = item.message;
      });
      setRowErrorMap(rowErrorLookup);

      const firstFailed = failedRows[0];
      if (firstFailed?.rowId) {
        setHighlightCreateRowId(firstFailed.rowId);
        setTimeout(() => {
          const target = document.getElementById(`create-row-${firstFailed.rowId}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
      }

      const failedRowIdSet = new Set(failedRows.map((item) => item.rowId));
      setCreateRows((prev) => {
        const pendingRows = prev.filter((row) => failedRowIdSet.has(row.id));
        return pendingRows.length ? pendingRows : [createEmptyRow()];
      });

      const createdCount = Math.max(0, createdIds.length - restoredCount);
      const summary = `Requested: ${createRows.length} | Created: ${createdCount} | Failed: ${failedRows.length} | Updated: ${restoredCount}`;

      notify(
        'warning',
        `Create finished with issues. ${summary}`
      );
      setCreateResult({
        type: 'warning',
        title: 'Create Finished With Issues',
        message: `${summary}. Failed rows are kept for correction and retry.`,
        details: failedRows
          .slice(0, 6)
          .map((item) => ({
            rowNumber: item.rowNumber,
            message: item.message
          }))
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTimetable = async () => {
    if (!selectedTimetable) return;

    const selectedTimetableId = getId(selectedTimetable);
    if (!selectedTimetableId) {
      alert('Invalid timetable entry ID');
      return;
    }

    if (
      !formData.semesterId ||
      !formData.branchId ||
      !formData.subjectId ||
      !formData.teacherId ||
      !formData.roomId ||
      !formData.dayOfWeek ||
      !formData.division ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert('Please fill all required fields');
      return;
    }

    const mapped = mapTimeRangeToSlot(formData.startTime, formData.endTime, formData.lectureType);
    if (mapped.error) {
      alert(mapped.error);
      return;
    }

    try {
      setSaving(true);
      const res = await axios.put(
        `/api/timetable/${selectedTimetableId}`,
        {
          roomId: formData.roomId,
          division: formData.division,
          dayOfWeek: formData.dayOfWeek,
          slot: mapped.slot,
          slotSpan: mapped.slotSpan,
          lectureType: formData.lectureType,
          status: formData.status
        },
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
        
        // Handle conflicts with detailed messages
        if (error.response?.status === 400 && error.response?.data?.conflicts) {
          const conflicts = error.response.data.conflicts;
          let conflictMessage = '⚠️ TIMETABLE CONFLICTS DETECTED:\n\n';
          
          conflicts.forEach((conflict, index) => {
            conflictMessage += `${index + 1}. ${conflict.message}\n`;
            if (conflict.details) {
              conflictMessage += `   📍 Room: ${conflict.details.room}\n`;
              conflictMessage += `   👨‍🏫 Teacher: ${conflict.details.teacher}\n`;
              conflictMessage += `   📚 Subject: ${conflict.details.subject}\n`;
              conflictMessage += `   🏢 Branch: ${conflict.details.branch}\n`;
              conflictMessage += `   📖 Semester: ${conflict.details.semester}\n`;
              conflictMessage += `   🕐 Time: Slot ${conflict.details.slot}, ${conflict.details.day}\n`;
              conflictMessage += `   👤 Added by: ${conflict.details.addedBy}\n`;
            }
            conflictMessage += '\n';
          });
          
          conflictMessage += 'Please choose a different room or time slot.';
          alert(conflictMessage);
        } else {
          alert(error.response?.data?.message || 'Error updating timetable entry');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!id) {
      notify('warning', 'Invalid timetable entry ID.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        const res = await axios.delete(`/api/timetable/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          notify('success', 'Timetable entry deleted successfully.');
          fetchTimetables();
        }
      } catch (error) {
        if (!handleAuthError(error)) {
          console.error('Error deleting timetable:', error);
          notify('error', error.response?.data?.message || 'Error deleting timetable entry.');
        }
      }
    }
  };

  const handleToggleStatus = async (entry) => {
    const entryId = getId(entry);
    if (!entryId) {
      notify('warning', 'Invalid timetable entry ID.');
      return;
    }

    if (isStatusUpdating(entryId)) return;

    const currentStatus = getEntryStatus(entry);
    const nextStatus = currentStatus === 'active' ? 'cancelled' : 'active';
    const prevStatus = currentStatus;

    const rowWillDisappearInCurrentFilter = (
      (filters.status === 'active' && nextStatus !== 'active')
      || (filters.status === 'cancelled' && nextStatus !== 'cancelled')
      || (filters.status === 'archived' && nextStatus !== 'archived')
    );

    if (rowWillDisappearInCurrentFilter) {
      setFilters((prev) => ({ ...prev, status: 'all' }));
      notify('info', 'Status filter switched to All so the updated subject stays visible.');
    }

    setStatusUpdatingIds((prev) => [...prev, String(entryId)]);

    // Optimistic UI update for immediate toggle feedback.
    setTimetables((prev) => prev.map((item) => (
      getId(item) === entryId
        ? { ...item, status: nextStatus }
        : item
    )));

    try {
      const res = await axios.put(
        `/api/timetable/${entryId}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const updatedStatus = String(res.data?.data?.status || nextStatus).toLowerCase();
        const finalStatus = updatedStatus === prevStatus ? nextStatus : updatedStatus;

        // Keep UI state authoritative immediately after toggle.
        setTimetables((prev) => prev.map((item) => {
          const itemId = getId(item);
          if (itemId !== entryId) return item;
          return {
            ...item,
            status: finalStatus
          };
        }));
        setLastUpdatedAt(new Date());

      }
    } catch (error) {
      // Revert optimistic update on failure.
      setTimetables((prev) => prev.map((item) => (
        getId(item) === entryId
          ? { ...item, status: prevStatus }
          : item
      )));

      if (!handleAuthError(error)) {
        const apiMessage = error.response?.data?.message;
        const statusCode = error.response?.status;
        notify('error', apiMessage || `Error changing timetable status${statusCode ? ` (HTTP ${statusCode})` : ''}`);
      }
    } finally {
      setStatusUpdatingIds((prev) => prev.filter((id) => id !== String(entryId)));
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    const normalizedTargetStatus = String(targetStatus || '').toLowerCase() === 'active' ? 'active' : 'cancelled';

    const eligibleEntries = managementRows.filter((entry) => (
      canDirectlyControlEntry(entry) && getEntryStatus(entry) !== normalizedTargetStatus
    ));

    if (eligibleEntries.length === 0) {
      notify('info', `No entries need to be set ${normalizedTargetStatus === 'active' ? 'Active' : 'Inactive'} for selected branch/semester.`);
      return;
    }

    const eligibleIds = eligibleEntries
      .map((entry) => String(getId(entry) || ''))
      .filter(Boolean);

    const previousStatusById = {};
    eligibleEntries.forEach((entry) => {
      const id = String(getId(entry) || '');
      if (!id) return;
      previousStatusById[id] = getEntryStatus(entry);
    });

    setStatusUpdatingIds((prev) => [...new Set([...prev, ...eligibleIds])]);

    // Optimistically update all selected rows for a responsive bulk action.
    setTimetables((prev) => prev.map((item) => {
      const itemId = String(getId(item) || '');
      if (!eligibleIds.includes(itemId)) return item;
      return { ...item, status: normalizedTargetStatus };
    }));

    const updateResults = await Promise.allSettled(
      eligibleEntries.map((entry) => {
        const id = getId(entry);
        return axios.put(
          `/api/timetable/${id}`,
          { status: normalizedTargetStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      })
    );

    const failedIds = [];
    const failedMessages = [];

    updateResults.forEach((result, index) => {
      if (result.status === 'fulfilled') return;
      const failedId = String(getId(eligibleEntries[index]) || '');
      if (failedId) failedIds.push(failedId);
      const message = result.reason?.response?.data?.message || result.reason?.message;
      if (message) failedMessages.push(message);
    });

    if (failedIds.length > 0) {
      // Revert only failed rows; keep successful updates in-place.
      setTimetables((prev) => prev.map((item) => {
        const itemId = String(getId(item) || '');
        if (!failedIds.includes(itemId)) return item;
        return { ...item, status: previousStatusById[itemId] || item.status };
      }));
    }

    setLastUpdatedAt(new Date());

    const successCount = eligibleEntries.length - failedIds.length;
    if (successCount > 0 && failedIds.length === 0) {
      notify('success', `${successCount} entries set ${normalizedTargetStatus === 'active' ? 'Active' : 'Inactive'} successfully.`);
    } else if (successCount > 0 && failedIds.length > 0) {
      notify('warning', `${successCount} entries updated, ${failedIds.length} failed. ${failedMessages[0] || ''}`.trim());
    } else {
      notify('error', failedMessages[0] || 'Bulk status update failed.');
    }

    setStatusUpdatingIds((prev) => prev.filter((id) => !eligibleIds.includes(id)));
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

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const slotMinutes = 60;
      const dayStart = toMinutes(settingsForm.dayStartTime);
      const dayEnd = toMinutes(settingsForm.dayEndTime);
      if (dayStart === null || dayEnd === null || dayEnd <= dayStart) {
        alert('Please set a valid day start/end time.');
        return;
      }

      const maxSlot = Math.max(1, Math.floor((dayEnd - dayStart) / slotMinutes));
      const teacherMaxHoursPerDay = Number(settingsForm.teacherMaxHoursPerDay);
      if (!Number.isInteger(teacherMaxHoursPerDay) || teacherMaxHoursPerDay < 1 || teacherMaxHoursPerDay > 12) {
        alert('Teacher max hours per day must be between 1 and 12.');
        return;
      }

      const breakWindows = (settingsForm.breakWindows || [])
        .map((window) => ({
          startTime: String(window?.startTime || '').trim(),
          endTime: String(window?.endTime || '').trim()
        }))
        .filter((window) => window.startTime && window.endTime);

      const res = await axios.put('/api/timetable/settings', {
        dayStartTime: settingsForm.dayStartTime,
        dayEndTime: settingsForm.dayEndTime,
        slotMinutes,
        maxSlot,
        breakSlots: [],
        breakWindows,
        teacherMaxHoursPerDay
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        alert('Timetable settings updated successfully');
        fetchTimetableSettings();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Unable to update timetable settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (timetable, mode = 'edit') => {
    const entrySlot = Number(timetable?.slot) || 1;
    const entrySpan = Number(timetable?.slotSpan) > 1 ? Number(timetable.slotSpan) : 1;
    const dayStart = toMinutes(settingsData.dayStartTime) ?? (10 * 60 + 30);
    const slotMinutes = Number(settingsData.slotMinutes) || 60;
    const startValue = minutesToHHMM(dayStart + ((entrySlot - 1) * slotMinutes));
    const endValue = minutesToHHMM(dayStart + ((entrySlot - 1 + entrySpan) * slotMinutes));

    setSelectedTimetable(timetable);
    setEditModalMode(mode === 'view' ? 'view' : 'edit');
    setFormData({
      semesterId: timetable.semesterId?._id || '',
      branchId: timetable.branchId?._id || '',
      subjectId: timetable.subjectId?._id || '',
      teacherId: timetable.teacherId?._id || '',
      roomId: timetable.roomId?._id || '',
      division: timetable.division || 'General',
      dayOfWeek: timetable.dayOfWeek,
      startTime: startValue,
      endTime: endValue,
      lectureType: timetable.lectureType,
      notes: timetable.notes || ''
    });
    setShowEditModal(true);
  };

  const isEditReadOnly = editModalMode === 'view';

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
        {notification && (
          <div
            className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
              notification.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : notification.type === 'warning'
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : notification.type === 'error'
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-sky-300 bg-sky-50 text-sky-900'
            }`}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wide">
                {notification.type === 'success'
                  ? 'Success'
                  : notification.type === 'warning'
                    ? 'Warning'
                    : notification.type === 'error'
                      ? 'Error'
                      : 'Info'}
              </p>
              <p className="text-sm font-semibold mt-0.5">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-xs font-bold px-2 py-1 rounded-md border border-current/30 hover:bg-white/60"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="rounded-3xl bg-gradient-to-r from-[#1f2937] via-[#1e40af] to-[#0f766e] text-white p-4 sm:p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-100">Schedule Control</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2">Timetable Management</h1>
              <p className="text-sky-100 mt-2 text-sm md:text-base">
                Plan classes, assign faculty, and keep weekly schedule execution consistent.
              </p>
              {user && (
                <p className="text-xs text-sky-100 mt-3">
                  {isHod && activeHodBranch
                    ? `${activeHodBranch.name || activeHodBranch.code || ''} - ${user.name || ''}`
                    : `${getLabel(user.branch || user.department)}${user.name ? ` - ${user.name}` : ''}`
                  }
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-white/15">Total Slots: {timetableStats.total}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Theory: {timetableStats.theory}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Practical/Lab: {timetableStats.practical}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Today: {timetableStats.todayCount}</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch sm:items-start lg:items-end gap-2">
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin/rooms')}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                >
                  Manage Rooms
                </Button>
              )}
              <Button
                onClick={() => {
                  if (!canCreateTimetable) return;
                  setShowCreateModal(true);
                  setCreateResult(null);
                  setRowErrorMap({});
                  setHighlightCreateRowId('');
                  const preferredBranchId = isHod ? (activeHodBranchId || hodBranchIds[0] || getId(user?.branch)) : '';
                  resetCreateForm({
                    semesterId: getId(user?.semester) || '',
                    branchId: preferredBranchId || ''
                  });
                }}
                disabled={!canCreateTimetable}
                variant="secondary"
                className="!bg-white [background-image:none] !text-[#0f172a] border border-white/70 hover:!bg-[#F1F5F9] disabled:!bg-white/60 disabled:!text-[#475569] w-full sm:w-auto"
              >
                + Create Timetable Entry
              </Button>
              {!canCreateTimetable && (
                <p className="text-[11px] text-sky-100">Only Admin/HOD can create timetable entries</p>
              )}
            </div>
          </div>
        </section>

        {/* Branch switcher — only show for multi-branch HODs */}
        {isHod && scopedBranches.length > 1 && (
          <div className="px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Branch:</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {scopedBranches.map((branch) => {
                const bId = getId(branch);
                const isActive = bId === activeHodBranchId;
                return (
                  <button
                    key={bId}
                    onClick={() => setActiveHodBranchId(bId)}
                    className={`px-4 py-2 text-sm font-bold rounded-full border-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#111827] text-white border-[#111827] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#111827] hover:text-gray-900'
                    }`}
                  >
                    {branch.name || branch.code || bId}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Card className="bg-white dark:bg-gray-800 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Table View Controls</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Set branch, multiple semesters, day, subject, and status filters.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs text-gray-500">Updated at: {lastUpdatedAt.toLocaleTimeString()}</span>
              <Button
                type="button"
                onClick={handleDownloadPdf}
                title="Download current filtered weekly timetable as PDF"
                className="bg-[#111827] hover:bg-[#1f2937] text-white w-full sm:w-auto"
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isAdmin || isHod) && (
              <select
                value={isHod ? activeHodBranchId : filters.branchId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isHod) {
                    setActiveHodBranchId(value);
                  } else {
                    setFilters((prev) => ({ ...prev, branchId: value }));
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" className="text-gray-900 bg-white">{isHod ? 'Select Branch' : 'All Branches'}</option>
                {(isHod ? scopedBranches : branches).map((b) => (
                  <option key={b._id} value={b._id} className="text-gray-900 bg-white">{b.name || b.code || b._id}</option>
                ))}
              </select>
            )}

            <select
              value={(filters.semesterIds && filters.semesterIds[0]) || ''}
              onChange={(e) => {
                const value = String(e.target.value || '').trim();
                setFilters((prev) => ({ ...prev, semesterIds: value ? [value] : [] }));
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-900 bg-white">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id} className="text-gray-900 bg-white">
                  {semester.name || (semester.semesterNumber ? `Semester ${semester.semesterNumber}` : semester.code || semester._id)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Manage Timetable Entries</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {managementRows.length} rows
                </span>
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  disabled={managementRows.length === 0}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-bold ${managementRows.length === 0 ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                >
                  Set All Active
                </button>
                <button
                  onClick={() => handleBulkStatusChange('cancelled')}
                  disabled={managementRows.length === 0}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-bold ${managementRows.length === 0 ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-amber-300 bg-amber-50 text-amber-700'}`}
                >
                  Set All Inactive
                </button>
              </div>
            </div>

            {managementRows.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No entries for selected branch/semester.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[980px] text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                      <th className="px-2.5 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Subject</th>
                      <th className="px-2.5 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Teacher</th>
                      <th className="px-2.5 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Day</th>
                      <th className="px-2.5 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Time</th>
                      <th className="px-2.5 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Status</th>
                      <th className="px-2.5 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managementRows.map((entry, index) => {
                      const entryId = getId(entry) || `m-row-${index}`;
                      const statusBusy = isStatusUpdating(entryId);
                      const canControl = canDirectlyControlEntry(entry);
                      const statusValue = getEntryStatus(entry);
                      return (
                        <tr key={entryId} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-2.5 py-2 font-bold text-gray-900 dark:text-gray-100">{getSubjectShortLabel(entry.subjectId)}</td>
                          <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{getTeacherShortLabel(entry.teacherId)}</td>
                          <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{entry.dayOfWeek || '-'}</td>
                          <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{getSlotRange(entry)}</td>
                          <td className="px-2.5 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              statusValue === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {statusValue === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-2.5 py-2">
                            {canControl ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleStatus(entry)}
                                  disabled={statusBusy}
                                  className={`px-2 py-1 rounded-md border text-[11px] font-bold ${statusBusy ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-slate-300 bg-white text-slate-700'}`}
                                >
                                  {statusBusy ? 'Updating...' : (statusValue === 'active' ? 'Set Inactive' : 'Set Active')}
                                </button>
                                <button
                                  onClick={() => openEditModal(entry, 'edit')}
                                  className="px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-bold"
                                >
                                  Modify
                                </button>
                                <button
                                  onClick={() => handleDeleteTimetable(getId(entry))}
                                  className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 text-[11px] font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-gray-500">No direct control</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
        <Card className="hidden bg-white dark:bg-gray-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timetable Grid</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Final timetable matrix with time slots on left and days on top.</p>
            </div>
            {conflictCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {conflictCount} conflicting slots
              </span>
            )}
          </div>

          {filteredTimetables.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No timetable entries found
            </p>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Choose Day (Auto: {todayAutoLabel})</p>
                    <button
                      type="button"
                      onClick={() => setMobileWeekDay(realTodayName)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-300 bg-white text-slate-700"
                    >
                      Today
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scroll-px-1">
                    {mobileDays.map((day) => {
                      const dayCount = filteredTimetables.filter((entry) => entry.dayOfWeek === day).length;
                      const active = mobileWeekDay === day;
                      return (
                        <button
                          key={`mobile-tab-${day}`}
                          onClick={() => setMobileWeekDay(day)}
                          className={`shrink-0 snap-start px-3 py-2 rounded-xl border text-xs font-bold transition ${
                            active
                              ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {day} ({dayCount})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const isSundayHoliday = mobileWeekDay === 'Sunday';
                  const dayEntries = filteredTimetables
                    .filter((entry) => entry.dayOfWeek === mobileWeekDay)
                    .sort((a, b) => getSlotValue(a?.slot) - getSlotValue(b?.slot));
                  const firstSlot = dayEntries.length ? getSlotValue(dayEntries[0]?.slot) : null;
                  const lastSlot = dayEntries.length ? getSlotValue(dayEntries[dayEntries.length - 1]?.slot) : null;

                  return (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="text-sm font-extrabold text-slate-900">{mobileWeekDay}</h4>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {dayEntries.length} class{dayEntries.length === 1 ? '' : 'es'}
                        </span>
                      </div>
                      {!!dayEntries.length && (
                        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-slate-600">
                              Slot flow: {firstSlot} to {lastSlot}
                            </p>
                            {dayEntries.length >= 6 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Busy Day
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                            {dayEntries.map((entry, index) => {
                              const slotValue = getSlotValue(entry?.slot);
                              const jumpId = `mobile-day-card-${mobileWeekDay}-${slotValue}-${index}`;
                              return (
                                <button
                                  key={`jump-${jumpId}`}
                                  type="button"
                                  onClick={() => {
                                    const target = document.getElementById(jumpId);
                                    if (target) {
                                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }}
                                  className="shrink-0 px-2 py-1 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-700"
                                >
                                  S{slotValue}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isSundayHoliday ? (
                        <div className="rounded-xl border border-dashed border-red-300 bg-red-50 text-center py-5 text-xs text-red-700 font-semibold">
                          Today is Holiday (Sunday)
                        </div>
                      ) : dayEntries.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center py-5 text-xs text-slate-500">
                          No classes scheduled.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[66vh] overflow-y-auto pr-0.5">
                          {dayEntries.map((entry, index) => {
                            const slotValue = getSlotValue(entry?.slot);
                            const jumpId = `mobile-day-card-${mobileWeekDay}-${slotValue}-${index}`;
                            const entryKey = getId(entry) || `${slotValue}-${index}`;
                            const statusBusy = isStatusUpdating(entryKey);
                            const slotMeta = SLOT_OPTIONS.find((item) => item.value === slotValue);
                            return (
                            <div id={jumpId} key={`mobile-entry-${entryKey}`} className={`rounded-xl border p-2.5 shadow-sm ${getLectureTone(entry)}`}>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black text-slate-900">{getSlotRange(entry)}</p>
                                  <p className="text-[10px] text-slate-600 font-semibold">
                                    Slot {slotValue}{slotMeta?.isBreak ? ' • Break overlap' : ''}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                  getEntryStatus(entry) === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {getEntryStatus(entry) === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div
                                className="text-[15px] font-extrabold text-slate-900 leading-snug break-words"
                                title={entry.subjectId?.name || 'Subject'}
                              >
                                {getSubjectShortLabel(entry.subjectId)}
                              </div>
                              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600 leading-tight">
                                <p className="truncate">Code: {entry.subjectId?.code || '-'}</p>
                                <p className="truncate">Section: {entry.division || 'General'}</p>
                                <p className="col-span-2 truncate">Teacher: {getTeacherShortLabel(entry.teacherId)}</p>
                                <p className="col-span-2 truncate">Room: {getRoomLabel(entry)}</p>
                              </div>

                              <details className="mt-2">
                                <summary className="cursor-pointer list-none text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white">
                                  Actions
                                </summary>
                                {canDirectlyControlEntry(entry) ? (
                                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                                    <button
                                      onClick={() => handleToggleStatus(entry)}
                                      disabled={statusBusy}
                                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-md border ${
                                        statusBusy
                                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : getEntryStatus(entry) === 'active'
                                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      {statusBusy ? 'Updating status...' : (getEntryStatus(entry) === 'active' ? 'Set Inactive' : 'Set Active')}
                                    </button>
                                    <button
                                      onClick={() => openEditModal(entry, 'view')}
                                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => openEditModal(entry, 'edit')}
                                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700"
                                    >
                                      Modify
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTimetable(getId(entry))}
                                      className="col-span-2 text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : (
                                  <div className="mt-2.5 rounded-md border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2.5 py-1.5">
                                    No direct control
                                  </div>
                                )}
                              </details>
                            </div>
                          );})}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full min-w-[1240px] table-auto border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-30 min-w-[170px] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-700 bg-gray-100 rounded-xl">Time</th>
                    {days.map((day) => (
                      <th key={day} className="min-w-[175px] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-700 bg-gray-100 rounded-xl">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    const slotMeta = SLOT_OPTIONS.find((item) => item.value === slot);
                    if (slotMeta?.isBreak) {
                      const breakNumber = breakSlotOrder[slot] || 1;
                      return (
                        <tr key={slot}>
                          <td className="sticky left-0 z-20 align-middle px-3 py-3 text-xs font-bold text-amber-800 bg-amber-100 rounded-xl whitespace-nowrap text-center">
                            {slotMeta.label.replace(`Slot ${slot} `, '')}
                          </td>
                          <td colSpan={days.length} className="align-middle px-3 py-3">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-center text-xs font-semibold py-3">
                              Break {breakNumber}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={slot}>
                        <td className="sticky left-0 z-20 align-middle px-3 py-3 text-xs font-bold text-gray-800 bg-gray-50 rounded-xl whitespace-nowrap text-center">
                          {slotMeta ? slotMeta.label.replace(`Slot ${slot} `, '') : `Slot ${slot}`}
                        </td>
                        {days.map((day) => {
                          const key = `${day}|${slot}`;
                          const entries = slotMap[key] || [];
                          return (
                            <td key={key} className="align-top px-1.5 py-1 min-w-[185px]">
                              {entries.length === 0 ? (
                                <div className="min-h-[96px] rounded-xl border border-gray-200 bg-white" />
                              ) : (
                                <div className="space-y-2">
                                  {entries.map((entry) => {
                                    const entryId = getId(entry);
                                    const statusBusy = isStatusUpdating(entryId);
                                    return (
                                    <div
                                      key={entry._id}
                                      className={`rounded-xl border border-gray-300 p-2 bg-white shadow-sm ${getLectureTone(entry)}`}
                                    >
                                      <div className="mb-1.5">
                                        <div
                                          className="text-[14px] font-extrabold text-gray-900 leading-snug break-words whitespace-normal min-h-[34px]"
                                          title={entry.subjectId?.name || 'Subject'}
                                        >
                                          {getSubjectShortLabel(entry.subjectId)}
                                        </div>
                                      </div>
                                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[10px] text-gray-700">
                                        <div className="grid grid-cols-[52px_1fr] gap-x-1 gap-y-0.5">
                                          <span className="font-semibold text-gray-500">Code</span>
                                          <span className="font-bold text-gray-800 truncate">{entry.subjectId?.code || '-'}</span>
                                          {shouldShowSectionBadge(entry) && (
                                            <>
                                              <span className="font-semibold text-gray-500">Section</span>
                                              <span className="font-bold text-gray-800 truncate">{entry.division || '-'}</span>
                                            </>
                                          )}
                                          <span className="font-semibold text-gray-500">Teacher</span>
                                          <span className="font-bold text-gray-800 truncate">{getTeacherShortLabel(entry.teacherId)}</span>
                                          <span className="font-semibold text-gray-500">Room</span>
                                          <span className="font-bold text-gray-800 truncate">{getRoomLabel(entry)}</span>
                                        </div>
                                      </div>
                                      {canDirectlyControlEntry(entry) ? (
                                        <div className="grid grid-cols-4 gap-1 mt-1.5 pt-1.5 border-t border-gray-200">
                                          <button
                                            onClick={() => handleToggleStatus(entry)}
                                            disabled={statusBusy}
                                            className={`inline-flex items-center justify-center gap-1 text-[10px] font-bold rounded-md border px-2 py-1.5 ${
                                              statusBusy
                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : getEntryStatus(entry) === 'active'
                                                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                            title={getEntryStatus(entry) === 'active' ? 'Turn OFF' : 'Turn ON'}
                                            aria-label={getEntryStatus(entry) === 'active' ? 'Turn OFF' : 'Turn ON'}
                                          >
                                            {statusBusy ? 'Updating...' : (getEntryStatus(entry) === 'active' ? 'Set Inactive' : 'Set Active')}
                                          </button>
                                          <button
                                            onClick={() => openEditModal(entry, 'view')}
                                            className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                          >
                                            View
                                          </button>
                                          <button
                                            onClick={() => openEditModal(entry, 'edit')}
                                            className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                          >
                                            Modify
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTimetable(getId(entry))}
                                            className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="mt-1.5 flex flex-col items-start gap-1 pt-1.5 border-t border-gray-200">
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                            No Direct Control
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
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
              </div>
            </>
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
        <Modal onClose={() => {
          setShowCreateModal(false);
          setCreateResult(null);
          setRowErrorMap({});
          setHighlightCreateRowId('');
        }} isOpen={true}>
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a0f0b] rounded-2xl shadow-xl border border-[#e6dedb] dark:border-[#3a2a24] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#181311] dark:text-white">Create Timetable Entry</h2>
                <p className="text-sm text-[#896b61] dark:text-[#c4b0a9] mt-1">Add one or more rows and create all entries together</p>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 px-3 py-2 text-primary text-xs font-semibold">
                Timetable
              </div>
            </div>

            <div className="space-y-5">
              {createResult && (
                <div
                  className={`rounded-xl border px-3.5 py-3 text-sm ${
                    createResult.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : createResult.type === 'warning'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <p className="font-bold">{createResult.title}</p>
                  <p className="mt-0.5">{createResult.message}</p>
                  {Array.isArray(createResult.details) && createResult.details.length > 0 && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/70 px-2 py-1.5">
                      {createResult.details.map((item, index) => (
                        <div key={`create-result-top-detail-${index}`} className="text-xs leading-5">
                          <span>- Row {item.rowNumber}: {item.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                <h3 className="text-sm font-semibold text-[#181311] dark:text-white mb-4">Academic Context</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Semester *</label>
                    <select
                      value={createMeta.semesterId}
                      onChange={(e) => setCreateMeta((prev) => ({ ...prev, semesterId: e.target.value }))}
                      className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                    >
                      <option value="" className="text-gray-900 bg-white">Select Semester</option>
                      {semesters.map((semester) => (
                        <option key={semester._id} value={semester._id} className="text-gray-900 bg-white">
                          {semester.name || (semester.semesterNumber ? `Semester ${semester.semesterNumber}` : semester.code || semester._id)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Branch *</label>
                    {isHod && scopedBranches.length === 1 ? (
                      <div className="h-11 px-3.5 rounded-lg border border-[#e6dedb] dark:border-[#3a2a24] bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white flex items-center font-semibold">
                        {scopedBranches[0]?.name || scopedBranches[0]?.code || 'Assigned Branch'}
                      </div>
                    ) : (
                      <select
                        value={createMeta.branchId}
                        onChange={(e) => setCreateMeta((prev) => ({ ...prev, branchId: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      >
                        <option value="" className="text-gray-900 bg-white">Select Branch</option>
                        {scopedBranches.map((branch) => (
                          <option key={branch._id} value={branch._id} className="text-gray-900 bg-white">
                            {branch.name || branch.code || branch._id}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Class Split Count (1-6)</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={createMeta.splitCount}
                      onChange={(e) => {
                        const value = Math.min(6, Math.max(1, Number(e.target.value) || 1));
                        setCreateMeta((prev) => ({ ...prev, splitCount: String(value) }));
                        setCreateRows((prev) => prev.map((row, idx) => ({
                          ...row,
                          division: DIVISION_OPTIONS[idx % Math.max(1, DIVISION_OPTIONS.length)] || 'General'
                        })));
                      }}
                      className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                    />
                    <p className="text-[11px] text-[#8a766f] mt-1">Example: IT + split 2 = IT1, IT2</p>
                  </div>
                </div>
              </div>

              <details className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#181311] dark:text-white">Setup & Settings</h3>
                    <p className="text-xs text-[#8a766f] dark:text-[#b79f96]">Working hours, break windows, and teacher max load.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Default Off</span>
                </summary>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Working Hours</label>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <input
                        type="time"
                        value={settingsForm.dayStartTime}
                        onChange={(e) => setSettingsForm((prev) => ({ ...prev, dayStartTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      />
                      <span className="text-xs font-bold text-[#8a766f] uppercase tracking-wide">to</span>
                      <input
                        type="time"
                        value={settingsForm.dayEndTime}
                        onChange={(e) => setSettingsForm((prev) => ({ ...prev, dayEndTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Teacher Max Hours / Day</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={settingsForm.teacherMaxHoursPerDay}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, teacherMaxHoursPerDay: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5">
                      <label className="block text-sm font-medium text-[#181311] dark:text-white">Break Windows</label>
                      <button
                        type="button"
                        onClick={() => setSettingsForm((prev) => ({
                          ...prev,
                          breakWindows: [...(prev.breakWindows || []), { id: `break-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, startTime: '', endTime: '' }]
                        }))}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 w-full sm:w-auto"
                      >
                        + Add Break
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(settingsForm.breakWindows || []).map((window, index) => (
                        <div key={window.id || `break-${index}`} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                          <input
                            type="time"
                            value={window.startTime || ''}
                            onChange={(e) => setSettingsForm((prev) => ({
                              ...prev,
                              breakWindows: (prev.breakWindows || []).map((item, itemIndex) => (
                                itemIndex === index ? { ...item, startTime: e.target.value } : item
                              ))
                            }))}
                            className="w-full px-3 py-2 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          />
                          <span className="text-[11px] font-bold text-[#8a766f] uppercase tracking-wide">to</span>
                          <input
                            type="time"
                            value={window.endTime || ''}
                            onChange={(e) => setSettingsForm((prev) => ({
                              ...prev,
                              breakWindows: (prev.breakWindows || []).map((item, itemIndex) => (
                                itemIndex === index ? { ...item, endTime: e.target.value } : item
                              ))
                            }))}
                            className="w-full px-3 py-2 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setSettingsForm((prev) => ({
                              ...prev,
                              breakWindows: (prev.breakWindows || []).filter((_, itemIndex) => itemIndex !== index)
                            }))}
                            aria-label={`Remove break window ${index + 1}`}
                            title="Remove break"
                            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shrink-0"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-[#8a766f]">
                    Fixed slot size: 60 min | Max slots/day: {settingsData.maxSlot} | Teacher limit: {settingsData.teacherMaxHoursPerDay || 6}h/day
                  </p>
                  <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </details>

              <details className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#181311] dark:text-white">Weekly Preview</h3>
                    <p className="text-xs text-[#8a766f] dark:text-[#b79f96]">Draft preview only. It appears in Weekly Table View after Create/Save.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Default Off</span>
                </summary>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <p className="text-xs text-[#8a766f]">Check week-wise rows, then Modify entries or Save from bottom button.</p>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Draft (Not Saved)
                  </span>
                  <Button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="bg-[#111827] hover:bg-[#1f2937] text-white w-full sm:w-auto"
                  >
                    Download PDF
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {days.map((day) => {
                    const dayRows = createRows.filter((row) => (
                      row.dayOfWeek === day
                      && row.subjectId
                      && row.teacherId
                      && row.roomId
                      && row.startTime
                      && row.endTime
                    ));
                    return (
                      <div key={`preview-${day}`} className="rounded-lg border border-[#e6dedb] dark:border-[#3a2a24] bg-white/80 dark:bg-[#2b1d17] p-2.5">
                        <div className="text-xs font-bold text-[#181311] dark:text-white mb-1">{day} ({dayRows.length})</div>
                        {dayRows.length === 0 ? (
                          <p className="text-[11px] text-[#8a766f]">No rows</p>
                        ) : (
                          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {dayRows.map((row) => (
                              <div key={`preview-row-${row.id}`} className="text-[11px] text-[#4a3f3a] dark:text-[#d5c3bb] border border-[#eee5e2] dark:border-[#3a2a24] rounded-md px-2 py-1 bg-[#fff7f3] dark:bg-[#261913]">
                                {row.startTime} to {row.endTime} | {row.lectureType} | {getSubjectShortLabel(row.subjectId)} | {getTeacherShortLabel(row.teacherId)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>

              <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-[#181311] dark:text-white">Entry Rows</h3>
                  <Button
                    type="button"
                    onClick={() => setCreateRows((prev) => {
                      const nextDivision = DIVISION_OPTIONS[prev.length % Math.max(1, DIVISION_OPTIONS.length)] || 'General';
                      return [...prev, createEmptyRow({ division: nextDivision })];
                    })}
                    className="bg-[#111827] hover:bg-[#1f2937] text-white w-full sm:w-auto"
                  >
                    + Add More Row
                  </Button>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[980px] border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Subject *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Teacher *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Day *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Room *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Section *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Start Time *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">End Time *</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Type</th>
                        <th className="text-center text-xs font-bold uppercase tracking-wide text-[#6b5b54] px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createRows.map((row, index) => (
                        <tr
                          id={`create-row-${row.id}`}
                          key={row.id}
                          className={`bg-[#f8f4f2] dark:bg-[#2a1c17] ${
                            highlightCreateRowId === row.id
                              ? 'ring-2 ring-amber-400 ring-inset'
                              : ''
                          }`}
                        >
                          <td className="p-2 align-top">
                            <select
                              value={row.subjectId}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, subjectId: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map((subject) => (
                                <option key={subject._id} value={subject._id}>{subject.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleEditShortName('subject', row.subjectId)}
                              disabled={!row.subjectId}
                              className="mt-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border border-[#d6cbc6] text-[#6b5b54] bg-white hover:bg-[#f9f4f2] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Short Name
                            </button>
                          </td>
                          <td className="p-2 align-top">
                            <select
                              value={row.teacherId}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, teacherId: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            >
                              <option value="">Select Teacher</option>
                              {teacherOptions.map((teacher) => (
                                <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleEditShortName('teacher', row.teacherId)}
                              disabled={!row.teacherId}
                              className="mt-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border border-[#d6cbc6] text-[#6b5b54] bg-white hover:bg-[#f9f4f2] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Short Name
                            </button>
                          </td>
                          <td className="p-2 align-top">
                            <select
                              value={row.dayOfWeek}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, dayOfWeek: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            >
                              {days.map((day) => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 align-top">
                            <select
                              value={row.roomId}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, roomId: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            >
                              <option value="">Select Room</option>
                              {rooms.map((room) => (
                                <option key={room._id} value={room._id}>{room.roomNo} ({room.type})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 align-top">
                            <select
                              value={row.division}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, division: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            >
                              {DIVISION_OPTIONS.map((division) => (
                                <option key={division} value={division}>{division}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 align-top">
                            <input
                              type="time"
                              value={row.startTime}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, startTime: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            />
                          </td>
                          <td className="p-2 align-top">
                            <input
                              type="time"
                              value={row.endTime}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, endTime: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            />
                            {getRangeWarning(row.startTime, row.endTime, row.lectureType) && (
                              <p className="text-[10px] text-red-600 mt-1">{getRangeWarning(row.startTime, row.endTime, row.lectureType)}</p>
                            )}
                          </td>
                          <td className="p-2 align-top">
                            <select
                              value={row.lectureType}
                              onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, lectureType: e.target.value } : item))}
                              className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                            >
                              <option value="Theory">Theory</option>
                              <option value="Lab">Lab</option>
                            </select>
                          </td>
                          <td className="p-2 align-top text-center">
                            <button
                              type="button"
                              onClick={() => setCreateRows((prev) => {
                                if (prev.length === 1) return [createEmptyRow()];
                                return prev.filter((item) => item.id !== row.id);
                              })}
                              className="px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              {createRows.length === 1 ? 'Reset' : 'Remove'}
                            </button>
                            <p className="text-[10px] text-[#8a766f] mt-1">Row {index + 1}</p>
                            {rowErrorMap[row.id] && (
                              <p className="mt-1 text-[10px] font-semibold text-red-700 break-words">
                                {rowErrorMap[row.id]}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {createRows.map((row, index) => (
                    <div
                      id={`create-row-${row.id}`}
                      key={row.id}
                      className={`rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fff7f3] dark:bg-[#271a14] p-3 ${
                        highlightCreateRowId === row.id
                          ? 'ring-2 ring-amber-400'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-[#6b5b54]">Row {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => setCreateRows((prev) => {
                            if (prev.length === 1) return [createEmptyRow()];
                            return prev.filter((item) => item.id !== row.id);
                          })}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-red-200 bg-red-50 text-red-700"
                        >
                          {createRows.length === 1 ? 'Reset' : 'Remove'}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <select
                          value={row.subjectId}
                          onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, subjectId: e.target.value } : item))}
                          className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                        >
                          <option value="">Select Subject *</option>
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>{subject.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleEditShortName('subject', row.subjectId)}
                          disabled={!row.subjectId}
                          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-md border border-[#d6cbc6] text-[#6b5b54] bg-white hover:bg-[#f9f4f2] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Subject Short Name
                        </button>

                        <select
                          value={row.teacherId}
                          onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, teacherId: e.target.value } : item))}
                          className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                        >
                          <option value="">Select Teacher *</option>
                          {teacherOptions.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleEditShortName('teacher', row.teacherId)}
                          disabled={!row.teacherId}
                          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-md border border-[#d6cbc6] text-[#6b5b54] bg-white hover:bg-[#f9f4f2] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Teacher Short Name
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={row.dayOfWeek}
                            onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, dayOfWeek: e.target.value } : item))}
                            className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          >
                            {days.map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                          <select
                            value={row.roomId}
                            onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, roomId: e.target.value } : item))}
                            className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          >
                            <option value="">Select Room *</option>
                            {rooms.map((room) => (
                              <option key={room._id} value={room._id}>{room.roomNo} ({room.type})</option>
                            ))}
                          </select>
                          <select
                            value={row.division}
                            onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, division: e.target.value } : item))}
                            className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          >
                            {DIVISION_OPTIONS.map((division) => (
                              <option key={division} value={division}>{division}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, startTime: e.target.value } : item))}
                            className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          />
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, endTime: e.target.value } : item))}
                            className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                          />
                        </div>
                        {getRangeWarning(row.startTime, row.endTime, row.lectureType) && (
                          <p className="text-[10px] text-red-600 mt-1">{getRangeWarning(row.startTime, row.endTime, row.lectureType)}</p>
                        )}

                        <select
                          value={row.lectureType}
                          onChange={(e) => setCreateRows((prev) => prev.map((item) => item.id === row.id ? { ...item, lectureType: e.target.value } : item))}
                          className="w-full h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                        >
                          <option value="Theory">Theory</option>
                          <option value="Lab">Lab</option>
                        </select>

                        {rowErrorMap[row.id] && (
                          <p className="text-[11px] font-semibold text-red-700 break-words">
                            {rowErrorMap[row.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateResult(null);
                  setRowErrorMap({});
                  setHighlightCreateRowId('');
                  resetCreateForm();
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTimetable}
                disabled={saving}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-orange-500 hover:opacity-95"
              >
                {saving ? 'Creating...' : `Create ${createRows.length} Entr${createRows.length === 1 ? 'y' : 'ies'}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && selectedTimetable && (
        <Modal isOpen={true} onClose={() => {
          setShowEditModal(false);
          setEditModalMode('edit');
          setSelectedTimetable(null);
        }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {isEditReadOnly ? 'View Timetable Entry' : 'Edit Timetable Entry'}
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTimetable.subjectId?.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Number *</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                    disabled={isEditReadOnly}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>{room.roomNo} ({room.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section *</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                    disabled={isEditReadOnly}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {DIVISION_OPTIONS.map((division) => (
                      <option key={division} value={division}>{division}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day *</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    disabled={isEditReadOnly}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    disabled={isEditReadOnly}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    disabled={isEditReadOnly}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {getRangeWarning(formData.startTime, formData.endTime, formData.lectureType) && (
                    <p className="text-xs text-red-600 mt-1">{getRangeWarning(formData.startTime, formData.endTime, formData.lectureType)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecture Type</label>
                <select
                  value={formData.lectureType}
                  onChange={(e) => setFormData(prev => ({ ...prev, lectureType: e.target.value }))}
                  disabled={isEditReadOnly}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  disabled={isEditReadOnly}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditModalMode('edit');
                  setSelectedTimetable(null);
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const entryId = getId(selectedTimetable);
                  if (!entryId) return;
                  handleDeleteTimetable(entryId);
                  setShowEditModal(false);
                  setEditModalMode('edit');
                  setSelectedTimetable(null);
                }}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Delete Entry
              </Button>
              {!isEditReadOnly && (
                <Button
                  onClick={handleUpdateTimetable}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {shortNameEditor.isOpen && (
        <Modal isOpen={true} onClose={() => setShortNameEditor((prev) => ({ ...prev, isOpen: false }))}>
          <div className="w-full max-w-md p-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {shortNameEditor.type === 'subject' ? 'Edit Subject Short Name' : 'Edit Teacher Short Name'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {shortNameEditor.entityLabel}
            </p>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short Name
            </label>
            <input
              type="text"
              value={shortNameEditor.value}
              onChange={(e) => setShortNameEditor((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="Enter short name"
              maxLength={24}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to reset automatic short name.
            </p>

            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShortNameEditor((prev) => ({ ...prev, isOpen: false }))}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveShortName}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Save Short Name
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showGrantModal && selectedTimetable && isAdmin && (
        <Modal isOpen={true} onClose={() => setShowGrantModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-1">
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

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowGrantModal(false)} disabled={saving} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleGrantPermission} disabled={saving} className="w-full sm:w-auto">
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
