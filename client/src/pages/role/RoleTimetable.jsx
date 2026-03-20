import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, LoadingSpinner, Modal, RoleLayout } from '../../components';
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
  const [formData, setFormData] = useState({
    semesterId: '',
    branchId: '',
    subjectId: '',
    teacherId: '',
    roomNo: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    lectureType: 'Theory',
    notes: ''
  });

  const [grantData, setGrantData] = useState({
    userId: '',
    role: 'teacher'
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
  const [teachers, setTeachers] = useState([]);
  const [hodList, setHodList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeHodBranchId, setActiveHodBranchId] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [authFailed, setAuthFailed] = useState(false);

  const token = localStorage.getItem('token');
  const canCreateTimetable = isAdmin || isHod;
  const panelLabel = isAdmin ? 'Admin Panel' : isHod ? 'HOD Panel' : 'Teacher Panel';
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const timetableStats = useMemo(() => {
    const total = timetables.length;
    const theory = timetables.filter((t) => t.lectureType === 'Theory').length;
    const practical = timetables.filter((t) => t.lectureType === 'Practical' || t.lectureType === 'Lab').length;
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayCount = timetables.filter((t) => t.dayOfWeek === todayName).length;
    return { total, theory, practical, todayCount };
  }, [timetables]);

  const getId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const idValue = value?._id || value?.id || value;
    return String(idValue);
  };

  const hodBranchIds = useMemo(() => {
    if (!isHod) return [];

    return Array.from(new Set([
      getId(user?.branch),
      getId(user?.department),
      ...((Array.isArray(user?.branches) ? user.branches : []).map((branch) => getId(branch)))
    ].filter(Boolean)));
  }, [isHod, user]);

  const scopedBranches = useMemo(() => {
    if (!isHod) return branches;
    if (hodBranchIds.length === 0) return [];
    return branches.filter((branch) => hodBranchIds.includes(getId(branch)));
  }, [branches, hodBranchIds, isHod]);

  const activeHodBranch = useMemo(() => {
    if (!isHod || !activeHodBranchId) return null;
    return scopedBranches.find((b) => getId(b) === activeHodBranchId) || null;
  }, [activeHodBranchId, isHod, scopedBranches]);

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

  const toMinutes = (time = '00:00') => {
    const [h, m] = String(time).split(':').map((v) => parseInt(v, 10) || 0);
    return h * 60 + m;
  };

  const formatTime = (time = '00:00') => {
    const parts = String(time).split(':');
    const hour = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
    const minute = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
    return `${hour}:${minute}`;
  };

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
        const [semRes, brRes, subjRes, teachRes, hodRes] = await Promise.all([
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=teacher', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=hod', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (semRes.data.success) setSemesters(semRes.data.data || []);
        if (brRes.data.success) setBranches(brRes.data.data || []);
        if (subjRes.data.success) setSubjects(subjRes.data.data || []);
        if (teachRes.data.success) setTeachers(teachRes.data.data || []);
        if (hodRes.data.success) setHodList(hodRes.data.data || []);
        return;
      }

      if (isHod) {
        const [subjRes, semRes, teachRes, brRes] = await Promise.all([
          axios.get('/api/academic/subjects/hod', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users?role=teacher', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.data || []);
        if (semRes.data.success) setSemesters(semRes.data.data || []);
        if (teachRes.data.success) setTeachers(teachRes.data.data || []);
        if (brRes?.data?.success) setBranches(brRes.data.data || []);
        return;
      }

      if (isTeacher && user?._id) {
        const [subjRes, semRes] = await Promise.all([
          axios.get(`/api/academic/teacher/${user._id}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (subjRes.data.success) setSubjects(subjRes.data.subjects || []);
        if (semRes.data.success) setSemesters(semRes.data.data || []);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching metadata:', error);
      }
    }
  }, [authFailed, handleAuthError, isAdmin, isHod, isTeacher, token, user]);

  const fetchTimetables = useCallback(async () => {
    try {
      if (!token || authFailed) {
        setLoading(false);
        return;
      }
      setLoading(true);

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
            hodBranchIds.has(String(entry.branchId?._id || entry.branchId))
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
      setLoading(false);
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

    fetchProfile();
  }, [authFailed, fetchProfile, navigate, token]);

  useEffect(() => {
    if (authFailed) return;
    fetchMetadata();
  }, [authFailed, fetchMetadata]);

  useEffect(() => {
    if (authFailed) return;
    fetchTimetables();
  }, [authFailed, fetchTimetables]);

  useEffect(() => {
    if (!token || authFailed) return undefined;
    const intervalId = setInterval(() => {
      fetchTimetables();
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
  }, [activeHodBranchId, filters.branchId, filters.dayOfWeek, filters.semesterId, filters.status, isHod, timetables]);

  const timeSlots = useMemo(() => {
    const slots = Array.from(new Set(
      filteredTimetables.map((entry) => `${entry.startTime || ''}-${entry.endTime || ''}`)
    ));

    return slots
      .filter((slot) => slot && slot.includes('-'))
      .sort((a, b) => toMinutes(a.split('-')[0]) - toMinutes(b.split('-')[0]));
  }, [filteredTimetables]);

  const slotMap = useMemo(() => {
    const map = {};
    filteredTimetables.forEach((entry) => {
      const slotKey = `${entry.startTime || ''}-${entry.endTime || ''}`;
      const key = `${entry.dayOfWeek}|${slotKey}`;
      if (!map[key]) map[key] = [];
      map[key].push(entry);
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
      const [start, end] = slot.split('-');
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
              <div style="font-size:12px;color:#374151;">Room: ${entry.roomNo || '-'}</div>
            </div>
          `;
        }).join('');

        return `<td style="vertical-align:top;padding:8px;border:1px solid #d1d5db;min-width:180px;">${rendered}</td>`;
      }).join('');

      return `
        <tr>
          <td style="padding:10px;border:1px solid #d1d5db;background:#f8fafc;font-weight:600;white-space:nowrap;">${formatTime(start)} - ${formatTime(end)}</td>
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

  const handleCreateTimetable = async () => {
    if (
      !formData.semesterId ||
      !formData.branchId ||
      !formData.subjectId ||
      !formData.teacherId ||
      !formData.roomNo ||
      !formData.dayOfWeek ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post('/api/timetable/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert('Timetable entry created successfully');
        setShowCreateModal(false);
        setFormData({
          semesterId: '',
          branchId: '',
          subjectId: '',
          teacherId: '',
          roomNo: '',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
          lectureType: 'Theory',
          notes: ''
        });
        fetchTimetables();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error creating timetable:', error);
        
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
          alert(error.response?.data?.message || 'Error creating timetable entry');
        }
      }
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
      !formData.roomNo ||
      !formData.dayOfWeek ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const res = await axios.put(
        `/api/timetable/${selectedTimetableId}`,
        formData,
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

  const openEditModal = (timetable) => {
    setSelectedTimetable(timetable);
    setFormData({
      semesterId: timetable.semesterId?._id || '',
      branchId: timetable.branchId?._id || '',
      subjectId: timetable.subjectId?._id || '',
      teacherId: timetable.teacherId?._id || '',
      roomNo: timetable.roomNo,
      dayOfWeek: timetable.dayOfWeek,
      startTime: timetable.startTime,
      endTime: timetable.endTime,
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
                  if (isHod && user) {
                    const preferredBranchId = activeHodBranchId || hodBranchIds[0] || getId(user.branch);
                    setFormData((prev) => ({
                      ...prev,
                      semesterId: getId(user.semester) || prev.semesterId,
                      branchId: preferredBranchId || prev.branchId,
                      teacherId: user._id
                    }));
                  }
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
          </div>
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
                    const [startTime, endTime] = slot.split('-');
                    return (
                      <tr key={slot}>
                        <td className="align-middle px-2 py-3 text-xs font-bold text-gray-800 bg-gray-50 rounded-xl whitespace-nowrap text-center">
                          {formatTime(startTime)} - {formatTime(endTime)}
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
                                      <div className="text-[10px] text-gray-600 leading-tight break-words">Teacher: {entry.teacherId?.name || '-'}</div>
                                      <div className="text-[10px] text-gray-600 leading-tight break-words">Room: {entry.roomNo || '-'}</div>
                                      {(isAdmin || isHod) && (
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
          <div className="w-full max-w-2xl bg-white dark:bg-[#1a0f0b] rounded-2xl shadow-xl border border-[#e6dedb] dark:border-[#3a2a24] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#181311] dark:text-white">Create Timetable Entry</h2>
                <p className="text-sm text-[#896b61] dark:text-[#c4b0a9] mt-1">Fill in class details and schedule</p>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 px-3 py-2 text-primary text-xs font-semibold">
                Timetable
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                  <h3 className="text-sm font-semibold text-[#181311] dark:text-white mb-4">Academic Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Semester *</label>
                      <select
                        value={formData.semesterId}
                        onChange={(e) => setFormData(prev => ({ ...prev, semesterId: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      >
                        <option value="" className="text-gray-900 bg-white">Select Semester</option>
                        {semesters.map(s => (
                          <option key={s._id} value={s._id} className="text-gray-900 bg-white">
                            {s.name || (s.semesterNumber ? `Semester ${s.semesterNumber}` : s.code || s._id)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Branch *</label>
                      <select
                        value={formData.branchId}
                        onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      >
                        <option value="" className="text-gray-900 bg-white">Select Branch</option>
                        {scopedBranches.map(b => (
                          <option key={b._id} value={b._id} className="text-gray-900 bg-white">{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                  <h3 className="text-sm font-semibold text-[#181311] dark:text-white mb-4">Class Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Subject *</label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      >
                        <option value="" className="text-gray-900 bg-white">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s._id} value={s._id} className="text-gray-900 bg-white">{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Teacher *</label>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      >
                        <option value="" className="text-gray-900 bg-white">Select Teacher</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id} className="text-gray-900 bg-white">{t.name}</option>
                        ))}
                        {hodList.map(h => (
                          <option key={h._id} value={h._id} className="text-gray-900 bg-white">{h.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
                  <h3 className="text-sm font-semibold text-[#181311] dark:text-white mb-4">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Day *</label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                      >
                        {days.map(day => (
                          <option key={day} value={day} className="text-gray-900 bg-white">{day}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Room Number *</label>
                      <Input
                        value={formData.roomNo}
                        onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                        placeholder="e.g., A101, Lab-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">Start Time *</label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#181311] dark:text-white mb-1.5">End Time *</label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Lecture Type</label>
                  <select
                    value={formData.lectureType}
                    onChange={(e) => setFormData(prev => ({ ...prev, lectureType: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Lab">Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                    rows="3"
                    className="w-full px-3.5 py-2.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* HOD: Branch selector (visible when multi-branch HOD) */}
                {isHod && scopedBranches.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Branch *</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                      className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                    >
                      <option value="">Select Branch</option>
                      {scopedBranches.map(b => (
                        <option key={b._id} value={b._id}>{b.name || b.code}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* HOD: Semester selector */}
                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Semester *</label>
                  <select
                    value={formData.semesterId}
                    onChange={(e) => setFormData(prev => ({ ...prev, semesterId: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name || (s.semesterNumber ? `Semester ${s.semesterNumber}` : s.code || s._id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Teacher *</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Room Number *</label>
                    <Input
                      value={formData.roomNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                      placeholder="e.g., A101, Lab-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Day *</label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                      className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Start Time *</label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">End Time *</label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Lecture Type</label>
                  <select
                    value={formData.lectureType}
                    onChange={(e) => setFormData(prev => ({ ...prev, lectureType: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Lab">Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#181311] dark:text-white mb-1.5">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                    rows="3"
                    className="w-full px-3.5 py-2.5 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
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
                {saving ? 'Creating...' : 'Create Entry'}
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
                  <Input
                    value={formData.roomNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                  />
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
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
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
                  <option value="Practical">Practical</option>
                  <option value="Tutorial">Tutorial</option>
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
