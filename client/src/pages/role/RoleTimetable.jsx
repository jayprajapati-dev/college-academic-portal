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
  const [changeRequests, setChangeRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestEntry, setSelectedRequestEntry] = useState(null);
  const [requestData, setRequestData] = useState({
    requestType: 'modify',
    roomId: '',
    division: 'General',
    dayOfWeek: 'Monday',
    startTime: '10:30',
    endTime: '11:30',
    lectureType: 'Theory',
    reason: ''
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
    semesterId: '',
    branchId: '',
    dayOfWeek: '',
    status: 'active'
  });

  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [hodList, setHodList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeHodBranchId, setActiveHodBranchId] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [authFailed, setAuthFailed] = useState(false);

  const token = localStorage.getItem('token');
  const canCreateTimetable = isAdmin || isHod;
  const canReviewRequests = isAdmin || isHod;
  const panelLabel = isAdmin ? 'Admin Panel' : isHod ? 'HOD Panel' : 'Teacher Panel';
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
        label: `Slot ${slot} (${minutesToDisplayTime(start)} - ${minutesToDisplayTime(end)})${isBreak ? ' [Break]' : ''}`
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

  const timetableStats = useMemo(() => {
    const total = timetables.length;
    const theory = timetables.filter((t) => t.lectureType === 'Theory').length;
    const practical = timetables.filter((t) => t.lectureType === 'Practical' || t.lectureType === 'Lab').length;
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayCount = timetables.filter((t) => t.dayOfWeek === todayName).length;
    return { total, theory, practical, todayCount };
  }, [timetables]);

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
  const getLabel = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || value.code || '';
  };

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
        if (filters.semesterId) params.semesterId = filters.semesterId;
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

  const fetchChangeRequests = useCallback(async (status = 'pending') => {
    try {
      if (!token || authFailed) return;
      const res = await axios.get('/api/timetable/change-requests/list', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status }
      });

      if (res.data?.success) {
        setChangeRequests(res.data.data || []);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching change requests:', error);
      }
    }
  }, [authFailed, handleAuthError, token]);

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

    fetchProfile();
  }, [authFailed, fetchProfile, navigate, token]);

  useEffect(() => {
    if (authFailed) return;
    fetchMetadata();
  }, [authFailed, fetchMetadata]);

  useEffect(() => {
    if (authFailed) return;
    fetchTimetableSettings();
  }, [authFailed, fetchTimetableSettings]);

  useEffect(() => {
    if (authFailed) return;
    fetchTimetables();
  }, [authFailed, fetchTimetables]);

  useEffect(() => {
    if (authFailed) return;
    fetchChangeRequests(canReviewRequests ? 'pending' : 'all');
  }, [authFailed, canReviewRequests, fetchChangeRequests]);

  useEffect(() => {
    if (!token || authFailed) return undefined;
    const intervalId = setInterval(() => {
      fetchTimetables({ silent: true });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [authFailed, fetchTimetables, token]);

  const filteredTimetables = useMemo(() => {
    return timetables.filter((entry) => {
      const semMatch = !filters.semesterId || getId(entry.semesterId) === filters.semesterId;
      // HOD: filter by the currently selected branch tab; Admin: use filter dropdown
      const branchMatch = isHod
        ? (!activeHodBranchId || getId(entry.branchId) === activeHodBranchId)
        : (!filters.branchId || getId(entry.branchId) === filters.branchId);
      const dayMatch = !filters.dayOfWeek || entry.dayOfWeek === filters.dayOfWeek;
      const statusMatch = filters.status === 'all' || getEntryStatus(entry) === filters.status;
      return semMatch && branchMatch && dayMatch && statusMatch;
    });
  }, [activeHodBranchId, filters.branchId, filters.dayOfWeek, filters.semesterId, filters.status, getId, isHod, timetables]);

  const timeSlots = useMemo(() => SLOT_OPTIONS.map((item) => item.value), [SLOT_OPTIONS]);

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

  const getLectureTone = (entry) => {
    const type = (entry.lectureType || '').toLowerCase();
    if (type === 'lab' || type === 'practical') {
      return 'bg-[#dbeafe] border-[#93c5fd]';
    }
    return 'bg-white border-[#e5e7eb]';
  };

  const handleDownloadPdf = () => {
    const titleParts = [
      'Weekly Timetable',
      filters.semesterId ? `Semester: ${getLabel(semesters.find((s) => s._id === filters.semesterId))}` : 'All Semesters',
      filters.branchId ? `Branch: ${getLabel(branches.find((b) => b._id === filters.branchId))}` : 'All Branches'
    ];

    const gridRows = timeSlots.map((slot) => {
      const slotMeta = SLOT_OPTIONS.find((item) => item.value === slot);
      const cells = days.map((day) => {
        const entries = slotMap[`${day}|${slot}`] || [];
        if (!entries.length) return '<td style="padding:10px;border:1px solid #d1d5db;color:#9ca3af">-</td>';

        const rendered = entries.map((entry) => {
          const isLab = ['lab', 'practical'].includes((entry.lectureType || '').toLowerCase());
          const bg = isLab ? '#dbeafe' : '#ffffff';
          return `
            <div style="background:${bg};border:1px solid #cbd5e1;border-radius:8px;padding:8px;margin-bottom:6px;">
              <div style="font-weight:700;color:#111827;">${entry.subjectId?.name || 'Subject'}</div>
              <div style="font-size:12px;color:#374151;">Code: ${entry.subjectId?.code || '-'}</div>
              <div style="font-size:12px;color:#374151;">Teacher: ${entry.teacherId?.name || '-'}</div>
              <div style="font-size:12px;color:#374151;">Room: ${getRoomLabel(entry)}</div>
            </div>
          `;
        }).join('');

        return `<td style="vertical-align:top;padding:8px;border:1px solid #d1d5db;min-width:180px;">${rendered}</td>`;
      }).join('');

      return `
        <tr>
          <td style="padding:10px;border:1px solid #d1d5db;background:#f8fafc;font-weight:600;white-space:nowrap;">${slotMeta ? slotMeta.label.replace(`Slot ${slot} `, '') : `Slot ${slot}`}</td>
          ${cells}
        </tr>
      `;
    }).join('');

    const html = `
      <html>
      <head>
        <title>Timetable PDF</title>
      </head>
      <body style="font-family:Arial,sans-serif;padding:20px;color:#111827;">
        <h2 style="margin:0 0 8px;">Weekly Timetable</h2>
        <p style="margin:0 0 6px;color:#374151;">${titleParts.join(' | ')}</p>
        <p style="margin:0 0 14px;color:#dc2626;font-weight:700;">Sunday: Holiday</p>
        <table style="border-collapse:collapse;width:100%;font-size:12px;">
          <thead>
            <tr>
              <th style="padding:10px;border:1px solid #d1d5db;background:#111827;color:#fff;">Time</th>
              ${days.map((day) => `<th style="padding:10px;border:1px solid #d1d5db;background:#111827;color:#fff;">${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${gridRows || '<tr><td colspan="7" style="padding:12px;border:1px solid #d1d5db;">No timetable data</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to download PDF.');
      return;
    }

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
    if (!createMeta.semesterId || !createMeta.branchId) {
      alert('Please select semester and branch first');
      return;
    }

    if (!createRows.length) {
      alert('Please add at least one timetable row');
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
      alert(`Please fill all required fields in row(s): ${invalidRows.map((item) => item.index + 1).join(', ')}`);
      return;
    }

    const createdIds = [];
    const failedRows = [];

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
        fetchTimetables();
      }

      if (failedRows.length === 0) {
        alert(`${createdIds.length} timetable entr${createdIds.length === 1 ? 'y' : 'ies'} created successfully`);
        setShowCreateModal(false);
        resetCreateForm();
        return;
      }

      const failedRowIdSet = new Set(failedRows.map((item) => item.rowId));
      setCreateRows((prev) => {
        const pendingRows = prev.filter((row) => failedRowIdSet.has(row.id));
        return pendingRows.length ? pendingRows : [createEmptyRow()];
      });

      const failedSummary = failedRows.map((item) => `Row ${item.rowNumber}: ${item.message}`).join('\n');
      alert(
        `${createdIds.length} entr${createdIds.length === 1 ? 'y' : 'ies'} created. ${failedRows.length} failed:\n\n${failedSummary}`
      );
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
      alert('Invalid timetable entry ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        const res = await axios.delete(`/api/timetable/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          alert('Timetable entry deleted successfully');
          fetchTimetables();
        }
      } catch (error) {
        if (!handleAuthError(error)) {
          console.error('Error deleting timetable:', error);
          alert(error.response?.data?.message || 'Error deleting timetable entry');
        }
      }
    }
  };

  const handleToggleStatus = async (entry) => {
    const entryId = getId(entry);
    if (!entryId) {
      alert('Invalid timetable entry ID');
      return;
    }

    const currentStatus = getEntryStatus(entry);
    const nextStatus = currentStatus === 'active' ? 'cancelled' : 'active';
    const actionLabel = nextStatus === 'active' ? 'ON' : 'OFF';

    if (!window.confirm(`Are you sure you want to turn ${actionLabel} this timetable entry?`)) {
      return;
    }

    try {
      const res = await axios.put(
        `/api/timetable/${entryId}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const updatedStatus = String(res.data?.data?.status || nextStatus).toLowerCase();
        const finalStatus = updatedStatus === currentStatus ? nextStatus : updatedStatus;

        // Keep UI state authoritative immediately after toggle.
        setTimetables((prev) => {
          const updated = prev.map((item) => {
            const itemId = getId(item);
            if (itemId !== entryId) return item;
            return {
              ...item,
              status: finalStatus
            };
          });

          if (filters.status === 'active' && finalStatus !== 'active') {
            return updated.filter((item) => getId(item) !== entryId);
          }

          if (filters.status === 'cancelled' && finalStatus !== 'cancelled') {
            return updated.filter((item) => getId(item) !== entryId);
          }

          if (filters.status === 'archived' && finalStatus !== 'archived') {
            return updated.filter((item) => getId(item) !== entryId);
          }

          return updated;
        });
        setLastUpdatedAt(new Date());

        alert(`Timetable turned ${actionLabel} successfully`);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        const apiMessage = error.response?.data?.message;
        const statusCode = error.response?.status;
        alert(apiMessage || `Error changing timetable status${statusCode ? ` (HTTP ${statusCode})` : ''}`);
      }
    }
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

  const openRequestModal = (entry, requestType = 'modify') => {
    const entrySlot = Number(entry?.slot) || 1;
    const entrySpan = Number(entry?.slotSpan) > 1 ? Number(entry.slotSpan) : 1;
    const dayStart = toMinutes(settingsData.dayStartTime) ?? (10 * 60 + 30);
    const slotMinutes = Number(settingsData.slotMinutes) || 60;
    const startValue = minutesToHHMM(dayStart + ((entrySlot - 1) * slotMinutes));
    const endValue = minutesToHHMM(dayStart + ((entrySlot - 1 + entrySpan) * slotMinutes));

    setSelectedRequestEntry(entry);
    setRequestData({
      requestType,
      roomId: getId(entry?.roomId),
      division: entry?.division || 'General',
      dayOfWeek: entry?.dayOfWeek || 'Monday',
      startTime: startValue,
      endTime: endValue,
      lectureType: entry?.lectureType || 'Theory',
      reason: ''
    });
    setShowRequestModal(true);
  };

  const handleSubmitChangeRequest = async () => {
    const entryId = getId(selectedRequestEntry);
    if (!entryId) {
      alert('Invalid timetable entry selected');
      return;
    }

    if (requestData.requestType === 'modify' && (!requestData.roomId || !requestData.dayOfWeek || !requestData.startTime || !requestData.endTime)) {
      alert('Please fill required proposed details');
      return;
    }

    const mapped = requestData.requestType === 'modify'
      ? mapTimeRangeToSlot(requestData.startTime, requestData.endTime, requestData.lectureType)
      : null;

    if (mapped?.error) {
      alert(mapped.error);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        requestType: requestData.requestType,
        reason: requestData.reason,
        proposed: requestData.requestType === 'modify'
          ? {
            roomId: requestData.roomId,
            division: requestData.division || 'General',
            dayOfWeek: requestData.dayOfWeek,
            slot: mapped.slot,
            slotSpan: mapped.slotSpan,
            lectureType: requestData.lectureType
          }
          : undefined
      };

      const res = await axios.post(`/api/timetable/${entryId}/change-request`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert('Request sent to Admin/HOD for approval.');
        setShowRequestModal(false);
        setSelectedRequestEntry(null);
        setRequestData({
          requestType: 'modify',
          roomId: '',
          division: 'General',
          dayOfWeek: 'Monday',
          startTime: '10:30',
          endTime: '11:30',
          lectureType: 'Theory',
          reason: ''
        });
        fetchChangeRequests('all');
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Unable to submit request');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReviewRequest = async (requestId, decision) => {
    if (!requestId) return;
    const confirmLabel = decision === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${confirmLabel} this request?`)) return;

    try {
      setSaving(true);
      const res = await axios.put(
        `/api/timetable/change-requests/${requestId}/review`,
        { decision },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(res.data.message || `Request ${decision}`);
        fetchTimetables();
        fetchChangeRequests('pending');
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        const conflicts = error.response?.data?.conflicts;
        if (Array.isArray(conflicts) && conflicts.length > 0) {
          alert(`Cannot approve due to conflict:\n${conflicts.map((c) => `- ${c.message}`).join('\n')}`);
        } else {
          alert(error.response?.data?.message || 'Unable to review request');
        }
      }
    } finally {
      setSaving(false);
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

  const openEditModal = (timetable) => {
    const entrySlot = Number(timetable?.slot) || 1;
    const entrySpan = Number(timetable?.slotSpan) > 1 ? Number(timetable.slotSpan) : 1;
    const dayStart = toMinutes(settingsData.dayStartTime) ?? (10 * 60 + 30);
    const slotMinutes = Number(settingsData.slotMinutes) || 60;
    const startValue = minutesToHHMM(dayStart + ((entrySlot - 1) * slotMinutes));
    const endValue = minutesToHHMM(dayStart + ((entrySlot - 1 + entrySpan) * slotMinutes));

    setSelectedTimetable(timetable);
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
        <section className="rounded-3xl bg-gradient-to-r from-[#1f2937] via-[#1e40af] to-[#0f766e] text-white p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-100">Schedule Control</p>
              <h1 className="text-3xl md:text-4xl font-black mt-2">Timetable Management</h1>
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
            <div className="flex flex-col items-start lg:items-end gap-1">
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin/rooms')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Manage Rooms
                </Button>
              )}
              <Button
                onClick={() => {
                  if (!canCreateTimetable) return;
                  setShowCreateModal(true);
                  const preferredBranchId = isHod ? (activeHodBranchId || hodBranchIds[0] || getId(user?.branch)) : '';
                  resetCreateForm({
                    semesterId: getId(user?.semester) || '',
                    branchId: preferredBranchId || ''
                  });
                }}
                disabled={!canCreateTimetable}
                variant="secondary"
                className="!bg-white [background-image:none] !text-[#0f172a] border border-white/70 hover:!bg-[#F1F5F9] disabled:!bg-white/60 disabled:!text-[#475569]"
              >
                + Create Timetable Entry
              </Button>
              {!canCreateTimetable && (
                <p className="text-[11px] text-sky-100">Only Admin/HOD can create timetable entries</p>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Total Entries</p>
            <p className="text-2xl font-black text-[#111827] mt-1">{timetableStats.total}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Today</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{timetableStats.todayCount}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Theory</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{timetableStats.theory}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Practical/Lab</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{timetableStats.practical}</p>
          </div>
        </div>

        {/* Branch switcher — only show for multi-branch HODs */}
        {isHod && scopedBranches.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Branch:</span>
            {scopedBranches.map((branch) => {
              const bId = getId(branch);
              const isActive = bId === activeHodBranchId;
              return (
                <button
                  key={bId}
                  onClick={() => setActiveHodBranchId(bId)}
                  className={`px-5 py-2 text-sm font-bold rounded-full border-2 transition-all ${
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
        )}

        <Card className="bg-white dark:bg-gray-800 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Smart Filters</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Branch and semester wise proper timetable filtering</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Live updated: {lastUpdatedAt.toLocaleTimeString()}</span>
              <Button onClick={handleDownloadPdf} className="bg-[#111827] hover:bg-[#1f2937] text-white">Download PDF</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isAdmin && (
              <select
                value={filters.semesterId}
                onChange={(e) => setFilters(prev => ({ ...prev, semesterId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" className="text-gray-900 bg-white">All Semesters</option>
                {semesters.map(s => (
                  <option key={s._id} value={s._id} className="text-gray-900 bg-white">
                    {s.name || (s.semesterNumber ? `Semester ${s.semesterNumber}` : s.code || s._id)}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && (
              <select
                value={filters.branchId}
                onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" className="text-gray-900 bg-white">All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id} className="text-gray-900 bg-white">{b.name}</option>
                ))}
              </select>
            )}

            <select
              value={filters.dayOfWeek}
              onChange={(e) => setFilters(prev => ({ ...prev, dayOfWeek: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-900 bg-white">All Days</option>
              {days.map(day => (
                <option key={day} value={day} className="text-gray-900 bg-white">{day}</option>
              ))}
            </select>

            {isAdmin && (
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active" className="text-gray-900 bg-white">Status: ON (Active)</option>
                <option value="cancelled" className="text-gray-900 bg-white">Status: OFF</option>
                <option value="archived" className="text-gray-900 bg-white">Status: Deleted</option>
                <option value="all" className="text-gray-900 bg-white">Status: All</option>
              </select>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setFilters((prev) => ({ ...prev, dayOfWeek: prev.dayOfWeek === day ? '' : day }))}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  filters.dayOfWeek === day
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#111827]'
                }`}
              >
                {day}
              </button>
            ))}
            <span className="px-3 py-1.5 text-xs rounded-full border border-red-200 bg-red-50 text-red-700 font-semibold">
              Sunday Holiday
            </span>
            <span className="px-3 py-1.5 text-xs rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold">
              Working Time: {minutesToDisplayTime(toMinutes(settingsData.dayStartTime) ?? 0)} to {minutesToDisplayTime(toMinutes(settingsData.dayEndTime) ?? 0)}
            </span>
          </div>
        </Card>

        {(isAdmin || isHod) && (
          <Card className="bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timetable Settings</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure working hours, teacher max daily load, and break windows.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Day Starts At</label>
                <input
                  type="time"
                  value={settingsForm.dayStartTime}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, dayStartTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Day Ends At</label>
                <input
                  type="time"
                  value={settingsForm.dayEndTime}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, dayEndTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teacher Max Hours / Day</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={settingsForm.teacherMaxHoursPerDay}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, teacherMaxHoursPerDay: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Break Windows</label>
                  <button
                    type="button"
                    onClick={() => setSettingsForm((prev) => ({
                      ...prev,
                      breakWindows: [...(prev.breakWindows || []), { id: `break-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, startTime: '', endTime: '' }]
                    }))}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    + Add Break
                  </button>
                </div>
                <div className="space-y-2">
                  {(settingsForm.breakWindows || []).map((window, index) => (
                    <div key={window.id || `break-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="time"
                        value={window.startTime || ''}
                        onChange={(e) => setSettingsForm((prev) => ({
                          ...prev,
                          breakWindows: (prev.breakWindows || []).map((item, itemIndex) => (
                            itemIndex === index ? { ...item, startTime: e.target.value } : item
                          ))
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="time"
                        value={window.endTime || ''}
                        onChange={(e) => setSettingsForm((prev) => ({
                          ...prev,
                          breakWindows: (prev.breakWindows || []).map((item, itemIndex) => (
                            itemIndex === index ? { ...item, endTime: e.target.value } : item
                          ))
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setSettingsForm((prev) => ({
                          ...prev,
                          breakWindows: (prev.breakWindows || []).filter((_, itemIndex) => itemIndex !== index)
                        }))}
                        className="px-3 py-2 rounded-md text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fixed slot size: 60 min | Max slots/day: {settingsData.maxSlot} | Teacher limit: {settingsData.teacherMaxHoursPerDay || 6}h/day
              </p>
              <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Card>
        )}

        <Card className="bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {canReviewRequests ? 'Pending Change Requests' : 'My Change Requests'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {canReviewRequests
                  ? 'Approve or reject requested timetable changes from users.'
                  : 'Track request status for entries where you do not have direct control.'}
              </p>
            </div>
            <Button
              onClick={() => fetchChangeRequests(canReviewRequests ? 'pending' : 'all')}
              variant="secondary"
            >
              Refresh
            </Button>
          </div>

          {changeRequests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No requests found.</p>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {changeRequests.map((item) => {
                const request = item.request || {};
                const requestEntry = item.timetable || {};
                const requestId = getId(request._id);
                const requestStatus = String(request.status || 'pending').toLowerCase();
                return (
                  <div key={requestId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50/70 dark:bg-gray-900/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {requestEntry.subjectId?.name || 'Subject'} | {requestEntry.dayOfWeek} | {getSlotRange(requestEntry)}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        requestStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : requestStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {requestStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Type: {request.requestType || '-'}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Requested by: {request.requesterId?.name || '-'}</p>
                    {request?.reason && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Reason: {request.reason}</p>
                    )}
                    {request.requestType === 'modify' && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Proposed: {request.proposed?.dayOfWeek || '-'} | {request.proposed?.division || 'General'} | {getSlotRange(request.proposed || {})} | Room {request.proposed?.roomId?.roomNo || '-'}
                      </p>
                    )}
                    {canReviewRequests && requestStatus === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleReviewRequest(requestId, 'approved')}
                          className="px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewRequest(requestId, 'rejected')}
                          className="px-3 py-1.5 rounded-md text-xs font-bold bg-red-600 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Table View</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Left side time slots, top side days Monday to Saturday</p>
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
            <div className="w-full overflow-x-hidden">
              <table className="w-full table-fixed border-separate border-spacing-1.5">
                <thead>
                  <tr>
                    <th className="w-[14%] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-gray-700 bg-gray-100 rounded-xl">Time</th>
                    {days.map((day) => (
                      <th key={day} className="w-[14.3%] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-gray-700 bg-gray-100 rounded-xl">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    const slotMeta = SLOT_OPTIONS.find((item) => item.value === slot);
                    if (slotMeta?.isBreak) {
                      return (
                        <tr key={slot}>
                          <td className="align-middle px-2 py-3 text-xs font-bold text-amber-800 bg-amber-100 rounded-xl whitespace-nowrap text-center">
                            {slotMeta.label.replace(`Slot ${slot} `, '')}
                          </td>
                          <td colSpan={days.length} className="align-middle px-2 py-3">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-center text-xs font-semibold py-3">
                              Fixed Break Slot
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={slot}>
                        <td className="align-middle px-2 py-3 text-xs font-bold text-gray-800 bg-gray-50 rounded-xl whitespace-nowrap text-center">
                          {slotMeta ? slotMeta.label.replace(`Slot ${slot} `, '') : `Slot ${slot}`}
                        </td>
                        {days.map((day) => {
                          const key = `${day}|${slot}`;
                          const entries = slotMap[key] || [];
                          return (
                            <td key={key} className="align-top px-0.5">
                              {entries.length === 0 ? (
                                <div className="min-h-[92px] rounded-xl border border-dashed border-gray-200 bg-gray-50/40" />
                              ) : (
                                <div className="space-y-2">
                                  {entries.map((entry) => (
                                    <div
                                      key={entry._id}
                                      className={`rounded-xl border p-2 shadow-sm ${getLectureTone(entry)}`}
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            getEntryStatus(entry) === 'active'
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              : 'bg-rose-50 text-rose-700 border-rose-200'
                                          }`}
                                        >
                                          {getEntryStatus(entry) === 'active' ? 'ON' : 'OFF'}
                                        </span>
                                      </div>
                                      <div className="text-xs font-bold text-gray-900 leading-tight break-words">{entry.subjectId?.name || 'Subject'}</div>
                                      <div className="text-[10px] text-gray-600 mt-1 leading-tight break-words">Code: {entry.subjectId?.code || '-'}</div>
                                      <div className="text-[10px] text-gray-600 leading-tight break-words">Section: {entry.division || 'General'}</div>
                                      <div className="text-[10px] text-gray-600 leading-tight break-words">Teacher: {entry.teacherId?.name || '-'}</div>
                                      <div className="text-[10px] text-gray-600 leading-tight break-words">Room: {getRoomLabel(entry)}</div>
                                      {canDirectlyControlEntry(entry) ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          <button
                                            onClick={() => handleToggleStatus(entry)}
                                            className="inline-flex items-center gap-2"
                                            title={getEntryStatus(entry) === 'active' ? 'Turn OFF' : 'Turn ON'}
                                            aria-label={getEntryStatus(entry) === 'active' ? 'Turn OFF' : 'Turn ON'}
                                          >
                                            <span
                                              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 ${
                                                getEntryStatus(entry) === 'active'
                                                  ? 'bg-emerald-500 border-emerald-600'
                                                  : 'bg-rose-500 border-rose-600'
                                              }`}
                                            >
                                              <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                  getEntryStatus(entry) === 'active' ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                              />
                                            </span>
                                            <span
                                              className={`text-[11px] font-bold ${
                                                getEntryStatus(entry) === 'active' ? 'text-emerald-700' : 'text-rose-700'
                                              }`}
                                            >
                                              {getEntryStatus(entry) === 'active' ? 'ON' : 'OFF'}
                                            </span>
                                          </button>
                                          <button
                                            onClick={() => openEditModal(entry)}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                          >
                                            Modify
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTimetable(getId(entry))}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="mt-2 flex flex-col items-start gap-2">
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                            No Direct Control
                                          </span>
                                          <button
                                            onClick={() => openRequestModal(entry, 'modify')}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                          >
                                            Request Change
                                          </button>
                                          <button
                                            onClick={() => openRequestModal(entry, 'delete')}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                          >
                                            Request Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
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
            </div>
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
        <Modal onClose={() => setShowCreateModal(false)} isOpen={true}>
          <div className="w-full max-w-6xl bg-white dark:bg-[#1a0f0b] rounded-2xl shadow-xl border border-[#e6dedb] dark:border-[#3a2a24] p-4 sm:p-6">
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
                        <tr key={row.id} className="bg-[#f8f4f2] dark:bg-[#2a1c17]">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {createRows.map((row, index) => (
                    <div key={row.id} className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fff7f3] dark:bg-[#271a14] p-3">
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

      {showEditModal && selectedTimetable && (isAdmin || isHod) && (
        <Modal onClose={() => {
          setShowEditModal(false);
          setSelectedTimetable(null);
        }}>
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Edit Timetable Entry
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTimetable.subjectId?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Number *</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTimetable(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTimetable}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showRequestModal && selectedRequestEntry && (
        <Modal onClose={() => {
          setShowRequestModal(false);
          setSelectedRequestEntry(null);
        }}>
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Timetable Change</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              This request will be sent to Admin/HOD for approval.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedRequestEntry.subjectId?.name || 'Subject'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Current: {selectedRequestEntry.dayOfWeek} | {selectedRequestEntry.division || 'General'} | {getSlotRange(selectedRequestEntry)} | Room {getRoomLabel(selectedRequestEntry)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Request Type</label>
                <select
                  value={requestData.requestType}
                  onChange={(e) => setRequestData((prev) => ({ ...prev, requestType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="modify">Modify</option>
                  <option value="delete">Delete</option>
                </select>
              </div>

              {requestData.requestType === 'modify' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section</label>
                      <select
                        value={requestData.division}
                        onChange={(e) => setRequestData((prev) => ({ ...prev, division: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {DIVISION_OPTIONS.map((division) => (
                          <option key={division} value={division}>{division}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proposed Day</label>
                      <select
                        value={requestData.dayOfWeek}
                        onChange={(e) => setRequestData((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {days.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proposed Start</label>
                      <input
                        type="time"
                        value={requestData.startTime}
                        onChange={(e) => setRequestData((prev) => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proposed End</label>
                      <input
                        type="time"
                        value={requestData.endTime}
                        onChange={(e) => setRequestData((prev) => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {getRangeWarning(requestData.startTime, requestData.endTime, requestData.lectureType) && (
                        <p className="text-xs text-red-600 mt-1">{getRangeWarning(requestData.startTime, requestData.endTime, requestData.lectureType)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proposed Room</label>
                      <select
                        value={requestData.roomId}
                        onChange={(e) => setRequestData((prev) => ({ ...prev, roomId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Room</option>
                        {rooms.map((room) => (
                          <option key={room._id} value={room._id}>{room.roomNo} ({room.type})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lecture Type</label>
                      <select
                        value={requestData.lectureType}
                        onChange={(e) => setRequestData((prev) => ({ ...prev, lectureType: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason</label>
                <textarea
                  value={requestData.reason}
                  onChange={(e) => setRequestData((prev) => ({ ...prev, reason: e.target.value }))}
                  rows="3"
                  placeholder="Why this change is needed"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedRequestEntry(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitChangeRequest} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showGrantModal && selectedTimetable && isAdmin && (
        <Modal onClose={() => setShowGrantModal(false)}>
          <div className="w-full max-w-lg">
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

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowGrantModal(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleGrantPermission} disabled={saving}>
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
