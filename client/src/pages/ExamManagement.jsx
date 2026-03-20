import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RoleLayout, Card, LoadingSpinner, Button } from '../components';
import useRoleNav from '../hooks/useRoleNav';

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (_) {
    return {};
  }
};

const EXAM_CATEGORIES = [
  'Custom',
  'Mid Exam',
  'Pa-1 Exam',
  'Pa-2 Exam',
  'GTU Exam',
  'Test Exam',
  'Practical Exam',
  'Internal Exam',
  'External Exam'
];

const ALLOWED_ROLES = ['admin', 'hod', 'coordinator'];

const ExamManagement = () => {
  const navigate = useNavigate();
  const storedUser = parseStoredUser();
  const role = storedUser?.role;
  const token = localStorage.getItem('token');

  const { navItems, loading: navLoading } = useRoleNav(role);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [entries, setEntries] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [form, setForm] = useState({
    branchId: '',
    semesterId: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    instructions: '',
    status: 'scheduled',
    examCategory: 'Internal Exam',
    customExamType: ''
  });

  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [examNameBySubject, setExamNameBySubject] = useState({});

  const examStats = useMemo(() => {
    const total = schedules.length;
    const scheduled = schedules.filter((item) => (item.status || 'scheduled') === 'scheduled').length;
    const completed = schedules.filter((item) => item.status === 'completed').length;
    const cancelled = schedules.filter((item) => item.status === 'cancelled').length;
    return { total, scheduled, completed, cancelled };
  }, [schedules]);

  const examTypeLabel = useMemo(() => {
    if (form.examCategory === 'Custom') {
      return (form.customExamType || '').trim();
    }
    return form.examCategory;
  }, [form.customExamType, form.examCategory]);

  const branchOptions = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      if (!map.has(entry.branchId)) {
        map.set(entry.branchId, { id: entry.branchId, name: entry.branchName || 'Branch' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const semesterOptions = useMemo(() => {
    const map = new Map();
    entries
      .filter((entry) => !form.branchId || entry.branchId === form.branchId)
      .forEach((entry) => {
        if (!map.has(entry.semesterId)) {
          map.set(entry.semesterId, { id: entry.semesterId, name: entry.semesterName || 'Semester' });
        }
      });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, form.branchId]);

  const subjectOptions = useMemo(() => {
    return entries
      .filter((entry) => {
        if (form.branchId && entry.branchId !== form.branchId) return false;
        if (form.semesterId && entry.semesterId !== form.semesterId) return false;
        return true;
      })
      .sort((a, b) => `${a.subjectCode || ''} ${a.subjectName || ''}`.localeCompare(`${b.subjectCode || ''} ${b.subjectName || ''}`));
  }, [entries, form.branchId, form.semesterId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadMeta = useCallback(async () => {
    const response = await axios.get('/api/exams/meta', { headers: authHeaders });
    const list = Array.isArray(response?.data?.data?.entries) ? response.data.data.entries : [];
    setEntries(list);
  }, [authHeaders]);

  const loadSchedules = useCallback(async (targetPage = pagination.page) => {
    const response = await axios.get('/api/exams/schedules', {
      headers: authHeaders,
      params: {
        page: targetPage,
        limit: pagination.limit,
        status: 'all'
      }
    });

    if (response?.data?.success) {
      setSchedules(Array.isArray(response.data.data) ? response.data.data : []);
      setPagination((prev) => ({
        ...prev,
        page: Number(response.data.currentPage || targetPage),
        total: Number(response.data.total || 0),
        pages: Number(response.data.pages || 1)
      }));
    }
  }, [authHeaders, pagination.limit, pagination.page]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      navigate('/login');
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        await Promise.all([loadMeta(), loadSchedules(1)]);
      } catch (err) {
        if (!active) return;
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        setError(err?.response?.data?.message || 'Failed to load exam data');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadMeta, loadSchedules, navigate, role, token]);

  useEffect(() => {
    setSelectedSubjectIds([]);
    setExamNameBySubject({});
  }, [form.branchId, form.semesterId, form.examCategory, form.customExamType]);

  const statusPill = (status = 'scheduled') => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
  };

  const setFormValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getDefaultExamName = (subject) => {
    const typeText = examTypeLabel || 'Exam';
    return `${typeText} - ${subject.subjectCode || subject.subjectName || 'Subject'}`;
  };

  const toggleSubjectSelection = (subject) => {
    const id = subject.subjectId;
    setSelectedSubjectIds((prev) => {
      if (prev.includes(id)) {
        const nextMap = { ...examNameBySubject };
        delete nextMap[id];
        setExamNameBySubject(nextMap);
        return prev.filter((item) => item !== id);
      }

      setExamNameBySubject((mapPrev) => ({
        ...mapPrev,
        [id]: mapPrev[id] || getDefaultExamName(subject)
      }));
      return [...prev, id];
    });
  };

  const selectAllSubjects = () => {
    const ids = subjectOptions.map((subject) => subject.subjectId);
    const nameMap = {};
    subjectOptions.forEach((subject) => {
      nameMap[subject.subjectId] = examNameBySubject[subject.subjectId] || getDefaultExamName(subject);
    });
    setSelectedSubjectIds(ids);
    setExamNameBySubject(nameMap);
  };

  const clearSubjectSelection = () => {
    setSelectedSubjectIds([]);
    setExamNameBySubject({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.branchId || !form.semesterId || !form.date || !form.startTime || !form.endTime) {
      setError('Please fill branch, semester, date and time.');
      return;
    }

    if (form.examCategory === 'Custom' && !(form.customExamType || '').trim()) {
      setError('Please enter custom exam type.');
      return;
    }

    if (selectedSubjectIds.length === 0) {
      setError('Please select at least one subject.');
      return;
    }

    const subjectMap = new Map(subjectOptions.map((subject) => [subject.subjectId, subject]));
    const items = selectedSubjectIds.map((subjectId) => {
      const subject = subjectMap.get(subjectId);
      return {
        subjectId,
        examName: (examNameBySubject[subjectId] || getDefaultExamName(subject || {})).trim()
      };
    });

    if (items.some((item) => !item.examName)) {
      setError('Exam name cannot be empty for selected subjects.');
      return;
    }

    try {
      setCreating(true);
      await axios.post('/api/exams/schedules/bulk', {
        branchId: form.branchId,
        semesterId: form.semesterId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        venue: form.venue,
        instructions: form.instructions,
        status: form.status,
        examCategory: form.examCategory,
        customExamType: form.customExamType,
        examType: examTypeLabel,
        items
      }, { headers: authHeaders });

      setSuccess(`Created ${items.length} exam schedule(s) successfully.`);
      await loadSchedules(1);
      clearSubjectSelection();
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setError(err?.response?.data?.message || 'Failed to create exam schedules');
    } finally {
      setCreating(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === pagination.page) return;
    try {
      await loadSchedules(nextPage);
    } catch (_) {
      // Keep existing data when pagination fetch fails.
    }
  };

  if (loading) {
    return (
      <RoleLayout
        title="Exams"
        userName={storedUser?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel="Assessment Desk"
        profileLinks={[{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <LoadingSpinner />
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Exams"
      userName={storedUser?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel="Assessment Desk"
      profileLinks={[{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#1e293b] via-[#1d4ed8] to-[#0ea5e9] text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Assessment Desk</p>
              <h1 className="text-2xl md:text-3xl font-black mt-1">Exam Management</h1>
              <p className="text-sm text-sky-100 mt-1">Create branch/semester-wise exams with multiple subjects in one go.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-white/15">Total: {examStats.total}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Scheduled: {examStats.scheduled}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Completed: {examStats.completed}</span>
            </div>
          </div>
        </section>

        <Card className="border border-[#E5E7EB]">
          <h2 className="text-xl font-black text-[#111827] mb-4">Create Exam Schedule</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={form.branchId}
                onChange={(e) => setFormValue('branchId', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              >
                <option value="">Select Branch</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>

              <select
                value={form.semesterId}
                onChange={(e) => setFormValue('semesterId', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              >
                <option value="">Select Semester</option>
                {semesterOptions.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={form.date}
                onChange={(e) => setFormValue('date', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              />

              <select
                value={form.status}
                onChange={(e) => setFormValue('status', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setFormValue('startTime', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              />
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setFormValue('endTime', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              />
              <select
                value={form.examCategory}
                onChange={(e) => setFormValue('examCategory', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              >
                {EXAM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Venue (optional)"
                value={form.venue}
                onChange={(e) => setFormValue('venue', e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              />
            </div>

            {form.examCategory === 'Custom' && (
              <input
                type="text"
                placeholder="Custom exam type"
                value={form.customExamType}
                onChange={(e) => setFormValue('customExamType', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
              />
            )}

            <textarea
              rows={3}
              placeholder="Instructions (optional)"
              value={form.instructions}
              onChange={(e) => setFormValue('instructions', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D5D9E3] bg-white"
            />

            <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#FAFCFF]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h3 className="text-sm font-black text-[#0F172A]">Subjects ({selectedSubjectIds.length} selected)</h3>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-semibold text-[#1d4ed8]" onClick={selectAllSubjects}>Select All</button>
                  <button type="button" className="text-xs font-semibold text-[#64748B]" onClick={clearSubjectSelection}>Clear</button>
                </div>
              </div>

              {subjectOptions.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Select branch and semester to load subjects.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {subjectOptions.map((subject) => {
                    const checked = selectedSubjectIds.includes(subject.subjectId);
                    return (
                      <div key={`${subject.subjectId}-${subject.branchId}-${subject.semesterId}`} className="rounded-lg border border-[#E5E7EB] bg-white p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubjectSelection(subject)}
                            className="h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">{subject.subjectCode} - {subject.subjectName}</p>
                            <p className="text-xs text-[#64748B]">{subject.branchName} • {subject.semesterName}</p>
                          </div>
                        </label>
                        {checked && (
                          <input
                            type="text"
                            value={examNameBySubject[subject.subjectId] || ''}
                            onChange={(e) => setExamNameBySubject((prev) => ({ ...prev, [subject.subjectId]: e.target.value }))}
                            className="mt-2 w-full px-3 py-2 rounded-lg border border-[#D5D9E3] text-sm"
                            placeholder="Exam name"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" className="bg-[#194ce6] hover:bg-[#1e40af]" disabled={creating}>
                {creating ? 'Creating...' : 'Create Exam Schedule'}
              </Button>
              {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}
              {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
            </div>
          </form>
        </Card>

        <Card className="border border-[#E5E7EB]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Schedules</h2>
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-500">No exam schedules found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{schedule.examName || 'Exam'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.subjectId?.code ? `${schedule.subjectId.code} - ` : ''}{schedule.subjectId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.examType || schedule.examCategory || 'Exam'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.branchId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schedule.semesterId?.name || `Semester ${schedule.semesterId?.semesterNumber || ''}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{schedule.date ? String(schedule.date).slice(0, 10) : 'N/A'} {schedule.startTime && schedule.endTime ? `(${schedule.startTime}-${schedule.endTime})` : ''}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${statusPill(schedule.status || 'scheduled')}`}>
                          {schedule.status || 'scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-[#475569]">Page {pagination.page} / {pagination.pages}</span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 rounded-lg border border-[#D5D9E3] text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </div>
    </RoleLayout>
  );
};

export default ExamManagement;
