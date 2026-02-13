import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RoleLayout } from '../../components';
import { StatsCard } from '../../components/Card';
import useRoleNav from '../../hooks/useRoleNav';

const RoleSubjects = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const isAdmin = role === 'admin';
  const isHod = role === 'hod';
  const isTeacher = role === 'teacher';
  const isEditor = isAdmin || isHod || isTeacher;

  const hodBranchIds = useMemo(() => {
    if (!isHod) return new Set();
    const getIdValue = (value) => (value && typeof value === 'object' ? value._id : value);
    const toIdSet = (list) => new Set((list || []).map((item) => String(getIdValue(item))));
    return new Set([
      ...toIdSet(user?.branches),
      ...(user?.branch ? [String(user.branch)] : []),
      ...(user?.department ? [String(user.department)] : [])
    ]);
  }, [isHod, user]);

  const canAddSubject = isAdmin || (isHod && hodBranchIds.size > 0);

  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'theory',
    credits: 3,
    semesterId: '',
    branchId: '',
    description: '',
    syllabus: '',
    isActive: true
  });

  const [marksData, setMarksData] = useState({
    theoryInternal: 0,
    theoryExternal: 0,
    practicalInternal: 0,
    practicalExternal: 0,
    passingMarks: 0
  });

  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Session expired. Please login again.');
      navigate('/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const profileRes = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      if (!profileData.success) {
        navigate('/login');
        return;
      }

      setUser(profileData.data);
      setRole(profileData.data.role);
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    }
  }, [navigate, token]);

  const fetchSemesters = useCallback(async () => {
    try {
      if (isAdmin) {
        const response = await axios.get('/api/academic/semesters/admin/list?page=1&limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSemesters(response.data.semesters || []);
      } else {
        const response = await axios.get('/api/academic/semesters');
        setSemesters(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      if (isAdmin && handleAuthError(error)) return;
    }
  }, [token, handleAuthError, isAdmin]);

  const fetchBranches = useCallback(async (semesterId = '') => {
    try {
      if (isAdmin) {
        const params = new URLSearchParams({ page: '1', limit: '100' });
        if (semesterId) params.append('semesterId', semesterId);
        const response = await axios.get(`/api/academic/branches/admin/list?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBranches(response.data.branches || []);
      } else {
        const response = await axios.get('/api/academic/branches');
        setBranches(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      if (isAdmin && handleAuthError(error)) return;
    }
  }, [token, handleAuthError, isAdmin]);

  const canEditSubject = useCallback((subject) => {
    if (!subject) return false;
    if (isAdmin) return true;

    const getIdValue = (value) => (value && typeof value === 'object' ? value._id : value);
    const toIdSet = (list) => new Set((list || []).map((item) => String(getIdValue(item))));

    const subjectId = String(subject._id);

    if (isTeacher) {
      const assignedSubjects = toIdSet(user?.assignedSubjects);
      return assignedSubjects.size > 0 && assignedSubjects.has(subjectId);
    }

    if (isHod) {
      if (hodBranchIds.size === 0) return false;

      const subjectBranchId = String(getIdValue(subject.branchId));
      return hodBranchIds.has(subjectBranchId);
    }

    return false;
  }, [isAdmin, isHod, isTeacher, user, hodBranchIds]);

  const fetchSubjects = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      if (isAdmin) {
        const params = new URLSearchParams({
          page: String(page),
          limit: '10'
        });
        if (semesterFilter) params.append('semesterId', semesterFilter);
        if (branchFilter) params.append('branchId', branchFilter);
        if (typeFilter) params.append('type', typeFilter);

        const response = await axios.get(`/api/academic/subjects/admin/list?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSubjects(response.data.subjects || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } else if (role === 'hod') {
        const params = new URLSearchParams();
        if (semesterFilter) params.append('semesterId', semesterFilter);

        const response = await axios.get(`/api/academic/subjects/hod?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allSubjects = response.data.data || response.data.subjects || [];
        setSubjects(allSubjects);
        setTotalPages(Math.max(1, Math.ceil(allSubjects.length / itemsPerPage)));
      } else if (role === 'teacher') {
        if (!user?._id) {
          setSubjects([]);
          setTotalPages(1);
          return;
        }
        const response = await axios.get(`/api/academic/teacher/${user._id}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allSubjects = response.data.subjects || [];
        setSubjects(allSubjects);
        setTotalPages(Math.max(1, Math.ceil(allSubjects.length / itemsPerPage)));
      } else {
        const response = await axios.get('/api/academic/subjects');
        const allSubjects = response.data.data || response.data.subjects || [];
        setSubjects(allSubjects);
        setTotalPages(Math.max(1, Math.ceil(allSubjects.length / itemsPerPage)));
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      if (isAdmin || role === 'hod' || role === 'teacher') {
        if (!handleAuthError(error)) {
          alert(error.response?.data?.message || 'Error fetching subjects');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token, semesterFilter, branchFilter, typeFilter, handleAuthError, isAdmin, role, user]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [fetchProfile, navigate, token]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  useEffect(() => {
    fetchBranches(semesterFilter);
    setCurrentPage(1);
  }, [fetchBranches, semesterFilter]);

  useEffect(() => {
    fetchSubjects(currentPage);
  }, [fetchSubjects, currentPage, semesterFilter, branchFilter, typeFilter]);

  const filteredSubjects = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch =
        subject.name?.toLowerCase().includes(search) ||
        subject.code?.toLowerCase().includes(search);
      const matchesSemester = semesterFilter ? (subject.semesterId?._id || subject.semesterId) === semesterFilter : true;
      const matchesBranch = branchFilter ? (subject.branchId?._id || subject.branchId) === branchFilter : true;
      const matchesType = typeFilter ? subject.type === typeFilter : true;
      return matchesSearch && matchesSemester && matchesBranch && matchesType;
    });
  }, [subjects, searchTerm, semesterFilter, branchFilter, typeFilter]);

  const paginatedSubjects = useMemo(() => {
    if (isAdmin) return filteredSubjects;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(start, start + itemsPerPage);
  }, [filteredSubjects, currentPage, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setTotalPages(Math.max(1, Math.ceil(filteredSubjects.length / itemsPerPage)));
    }
  }, [filteredSubjects, isAdmin]);

  const stats = useMemo(() => {
    const total = subjects.length;
    const theory = subjects.filter((s) => s.type === 'theory').length;
    const practical = subjects.filter((s) => s.type === 'practical').length;
    const both = subjects.filter((s) => s.type === 'theory+practical').length;
    const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
    const materials = subjects.reduce((sum, s) => sum + (s.materials?.length || 0), 0);
    return { total, theory, practical, both, totalCredits, materials };
  }, [subjects]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'semesterId' && value) {
      fetchBranches(value);
    }
  };

  const handleMarksChange = (e) => {
    const { name, value } = e.target;
    setMarksData((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'theory',
      credits: 3,
      semesterId: semesterFilter || '',
      branchId: branchFilter || '',
      description: '',
      syllabus: '',
      isActive: true
    });
    setMarksData({
      theoryInternal: 0,
      theoryExternal: 0,
      practicalInternal: 0,
      practicalExternal: 0,
      passingMarks: 0
    });
  };

  const handleNewSubject = () => {
    if (!canAddSubject) return;
    setEditingSubject(null);
    resetForm();
    if (!semesterFilter) {
      fetchBranches('');
    }
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    if (!canEditSubject(subject)) return;
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      type: subject.type || 'theory',
      credits: subject.credits || 0,
      semesterId: subject.semesterId?._id || subject.semesterId || '',
      branchId: subject.branchId?._id || subject.branchId || '',
      description: subject.description || '',
      syllabus: subject.syllabus || '',
      isActive: subject.isActive !== false
    });
    setMarksData({
      theoryInternal: subject.marks?.theory?.internal || 0,
      theoryExternal: subject.marks?.theory?.external || 0,
      practicalInternal: subject.marks?.practical?.internal || 0,
      practicalExternal: subject.marks?.practical?.external || 0,
      passingMarks: subject.marks?.passingMarks || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (subject) => {
    if (!subject) return;
    if (!isAdmin && !canEditSubject(subject)) return;
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await axios.delete(`/api/academic/subjects/${subject._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubjects(1);
      setCurrentPage(1);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error deleting subject');
      }
    }
  };

  const buildMarks = () => {
    const theoryTotal = (marksData.theoryInternal || 0) + (marksData.theoryExternal || 0);
    const practicalTotal = (marksData.practicalInternal || 0) + (marksData.practicalExternal || 0);
    const totalMarks = theoryTotal + practicalTotal;

    return {
      theory: {
        internal: marksData.theoryInternal,
        external: marksData.theoryExternal,
        total: theoryTotal
      },
      practical: {
        internal: marksData.practicalInternal,
        external: marksData.practicalExternal,
        total: practicalTotal
      },
      totalMarks,
      passingMarks: marksData.passingMarks
    };
  };

  const handleSave = async () => {
    if (!canAddSubject && !editingSubject) return;
    if (!isAdmin && editingSubject && !canEditSubject(editingSubject)) return;
    if (!formData.name || !formData.code || !formData.type || !formData.branchId || !formData.semesterId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        marks: buildMarks()
      };

      if (editingSubject) {
        await axios.put(`/api/academic/subjects/${editingSubject._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/academic/subjects', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      fetchSubjects(1);
      setCurrentPage(1);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error saving subject');
      }
    }
  };

  const panelLabel = role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : 'Teacher Panel';
  const showActions = isEditor;
  const canEditCurrent = editingSubject && canEditSubject(editingSubject);

  const visibleBranches = useMemo(() => {
    if (!isHod) return branches;
    if (hodBranchIds.size === 0) return [];
    return branches.filter((branch) => hodBranchIds.has(String(branch._id)));
  }, [branches, hodBranchIds, isHod]);

  const visibleSemesters = useMemo(() => {
    if (!isHod) return semesters;
    if (hodBranchIds.size === 0) return [];

    const getIdValue = (value) => (value && typeof value === 'object' ? value._id : value);
    const allowedSemesterIds = new Set(
      branches
        .filter((branch) => hodBranchIds.has(String(branch._id)))
        .map((branch) => String(getIdValue(branch.semesterId)))
        .filter(Boolean)
    );

    if (allowedSemesterIds.size === 0) return [];
    return semesters.filter((sem) => allowedSemesterIds.has(String(sem._id)));
  }, [branches, hodBranchIds, isHod, semesters]);

  return (
    <RoleLayout
      title="Subjects"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">menu_book</span>
              Subject Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Manage subject catalog, credits, and exam marks.
            </p>
            {!isAdmin && (
              <p className="text-xs text-amber-700 bg-amber-50 inline-flex mt-2 px-3 py-1 rounded-full">
                {isHod ? 'Full edit access within assigned branches.' : 'Edit access limited to assigned subjects.'}
              </p>
            )}
            {isHod && hodBranchIds.size === 0 && (
              <p className="text-xs text-red-700 bg-red-50 inline-flex mt-2 px-3 py-1 rounded-full">
                No branches assigned. Contact admin to get access.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {canAddSubject && (
              <button
                onClick={handleNewSubject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
              >
                + Add Subject
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard icon="menu_book" label="Total Subjects" value={stats.total} bgColor="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatsCard icon="science" label="Theory" value={stats.theory} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" />
          <StatsCard icon="engineering" label="Practical" value={stats.practical} bgColor="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 h-11 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium min-w-[160px]"
            >
              <option value="">All Semesters</option>
              {visibleSemesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  Semester {sem.semesterNumber}
                </option>
              ))}
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium min-w-[160px]"
            >
              <option value="">All Branches</option>
              {visibleBranches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium min-w-[160px]"
            >
              <option value="">All Types</option>
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
              <option value="theory+practical">Theory + Practical</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="min-h-[240px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Semester</th>
                    {showActions && (
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedSubjects.length > 0 ? (
                    paginatedSubjects.map((subject) => (
                      <tr key={subject._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{subject.name}</p>
                          {subject.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{subject.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{subject.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{subject.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{subject.credits}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{subject.branchId?.name || subject.branchId?.code || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{subject.semesterId?.semesterNumber || subject.semesterId?.name || 'N/A'}</td>
                        {showActions && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {canEditSubject(subject) && (
                                <button
                                  onClick={() => handleEdit(subject)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg"
                                >
                                  Edit
                                </button>
                              )}
                              {(isAdmin || isHod || isTeacher) && canEditSubject(subject) && (
                                <button
                                  onClick={() => handleDelete(subject)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={showActions ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                        No subjects found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (canAddSubject || canEditCurrent) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Code</label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                  <option value="theory+practical">Theory + Practical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold">Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Semester</label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleInputChange}
                  disabled={!isAdmin && (!isHod || editingSubject)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select semester</option>
                  {visibleSemesters.map((sem) => (
                    <option key={sem._id} value={sem._id}>
                      Semester {sem.semesterNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold">Branch</label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleInputChange}
                  disabled={!isAdmin && (!isHod || editingSubject)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select branch</option>
                  {visibleBranches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold">Theory Internal</label>
                <input
                  type="number"
                  name="theoryInternal"
                  value={marksData.theoryInternal}
                  onChange={handleMarksChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Theory External</label>
                <input
                  type="number"
                  name="theoryExternal"
                  value={marksData.theoryExternal}
                  onChange={handleMarksChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Practical Internal</label>
                <input
                  type="number"
                  name="practicalInternal"
                  value={marksData.practicalInternal}
                  onChange={handleMarksChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Practical External</label>
                <input
                  type="number"
                  name="practicalExternal"
                  value={marksData.practicalExternal}
                  onChange={handleMarksChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Passing Marks</label>
                <input
                  type="number"
                  name="passingMarks"
                  value={marksData.passingMarks}
                  onChange={handleMarksChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold">Syllabus</label>
              <textarea
                name="syllabus"
                value={formData.syllabus}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-primary text-white font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default RoleSubjects;
