import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, RoleLayout } from '../../components';
import { StatsCard } from '../../components/Card';
import useRoleNav from '../../hooks/useRoleNav';

const RoleManageTeachers = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'hod');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    selectedBranches: [],
    selectedSemesters: [],
    selectedSubjects: []
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.success) {
        navigate('/login');
        return;
      }

      setUser(data.data);
      setRole(data.data.role || 'hod');

      if (data.data.role !== 'hod') {
        navigate(`/${data.data.role}/dashboard`);
      }
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchTeachers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?page=1&limit=200&role=teacher&scope=role', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setTeachers(data.data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      setMetaLoading(true);
      const token = localStorage.getItem('token');

      const [branchesRes, semestersRes, subjectsRes] = await Promise.all([
        fetch('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch('/api/academic/subjects/hod', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
      ]);

      setBranches(branchesRes?.data || []);
      setSemesters(semestersRes?.data || []);
      setSubjects(subjectsRes?.data || subjectsRes?.subjects || []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    if (showAddModal) {
      fetchMeta();
    }
  }, [fetchMeta, showAddModal]);

  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((teacher) =>
      teacher.name?.toLowerCase().includes(term) ||
      teacher.email?.toLowerCase().includes(term) ||
      (teacher.mobile && teacher.mobile.includes(term))
    );
  }, [searchTerm, teachers]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.status === 'active').length;
    const pending = teachers.filter((t) => t.status === 'pending').length;
    return { total, active, pending };
  }, [teachers]);

  const filteredSubjects = useMemo(() => {
    if (formData.selectedBranches.length === 0 || formData.selectedSemesters.length === 0) {
      return [];
    }

    return subjects.filter((subject) => {
      const branchId = typeof subject.branchId === 'string' ? subject.branchId : subject.branchId?._id;
      const semesterId = typeof subject.semesterId === 'string' ? subject.semesterId : subject.semesterId?._id;
      return formData.selectedBranches.includes(branchId) && formData.selectedSemesters.includes(semesterId);
    });
  }, [formData.selectedBranches, formData.selectedSemesters, subjects]);

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      selectedBranches: [],
      selectedSemesters: [],
      selectedSubjects: []
    });
    setFormError('');
    setFormSuccess('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (key, id) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((item) => item !== id) : [...prev[key], id],
      ...(key !== 'selectedSubjects' ? { selectedSubjects: [] } : {})
    }));
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }

    if (!formData.mobile.trim() || formData.mobile.trim().length !== 10) {
      setFormError('Valid 10-digit mobile number is required');
      return;
    }

    if (formData.selectedBranches.length === 0) {
      setFormError('Please select at least one branch');
      return;
    }

    if (formData.selectedSemesters.length === 0) {
      setFormError('Please select at least one semester');
      return;
    }

    try {
      setFormLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        branchIds: formData.selectedBranches,
        semesterIds: formData.selectedSemesters,
        subjectIds: formData.selectedSubjects
      };

      const response = await fetch('/api/admin/add-teacher', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFormSuccess('Teacher created successfully. Share the temp password.');
        fetchTeachers();
        resetForm();
        setShowAddModal(false);
      } else {
        setFormError(data.message || 'Failed to create teacher');
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      setFormError('Failed to create teacher');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout
        title="Manage Teachers"
        userName={user?.name || 'HOD'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel="HOD Panel"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Manage Teachers"
      userName={user?.name || 'HOD'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel="HOD Panel"
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-teal-500">group</span>
              Manage Teachers
            </h1>
            <p className="text-gray-600 mt-1 font-medium">
              View and track teachers in your assigned branches
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/20 hover:opacity-90"
          >
            + Add Teacher
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard icon="group" label="Total Teachers" value={stats.total} bgColor="bg-gradient-to-br from-sky-500 to-blue-600" />
          <StatsCard icon="check_circle" label="Active" value={stats.active} bgColor="bg-gradient-to-br from-emerald-500 to-green-600" />
          <StatsCard icon="schedule" label="Pending" value={stats.pending} bgColor="bg-gradient-to-br from-amber-500 to-orange-600" />
        </div>

        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or mobile"
                className="w-full pl-10 h-11 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchTeachers}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No teachers found for your branch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold flex items-center justify-center">
                            {teacher.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{teacher.name}</p>
                            <p className="text-xs text-gray-500">ID: {teacher._id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p>{teacher.email}</p>
                        <p>{teacher.mobile || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {teacher.branch?.name || teacher.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {Array.isArray(teacher.assignedSubjects)
                          ? teacher.assignedSubjects.length
                          : 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          teacher.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : teacher.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-50 text-slate-700'
                        }`}>
                          {teacher.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Teacher</h2>
                <p className="text-sm text-gray-500">Create a teacher account for your branches</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="Teacher name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile *</label>
                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    maxLength={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branches *</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {branches.map((branch) => (
                      <label key={branch._id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.selectedBranches.includes(branch._id)}
                          onChange={() => toggleSelection('selectedBranches', branch._id)}
                        />
                        {branch.name}
                      </label>
                    ))}
                    {branches.length === 0 && !metaLoading && (
                      <p className="text-xs text-gray-500">No branches available</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Semesters *</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {semesters.map((semester) => (
                      <label key={semester._id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.selectedSemesters.includes(semester._id)}
                          onChange={() => toggleSelection('selectedSemesters', semester._id)}
                        />
                        {semester.name || `Semester ${semester.semesterNumber}`}
                      </label>
                    ))}
                    {semesters.length === 0 && !metaLoading && (
                      <p className="text-xs text-gray-500">No semesters available</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subjects (optional)</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {filteredSubjects.map((subject) => (
                    <label key={subject._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.selectedSubjects.includes(subject._id)}
                        onChange={() => toggleSelection('selectedSubjects', subject._id)}
                      />
                      {subject.name} ({subject.code || 'N/A'})
                    </label>
                  ))}
                  {filteredSubjects.length === 0 && (
                    <p className="text-xs text-gray-500">Select branches + semesters to load subjects</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:opacity-90"
                >
                  {formLoading ? 'Saving...' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default RoleManageTeachers;
