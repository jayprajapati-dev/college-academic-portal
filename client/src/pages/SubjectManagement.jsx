import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { StatsCard } from '../components/Card';

const SubjectManagement = () => {
  const navigate = useNavigate();
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

  // Handle authentication errors
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

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await axios.get('/api/academic/semesters/admin/list?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSemesters(response.data.semesters || []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      if (handleAuthError(error)) return;
    }
  }, [token, handleAuthError]);

  const fetchBranches = useCallback(async (semesterId = '') => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (semesterId) params.append('semesterId', semesterId);
      const response = await axios.get(`/api/academic/branches/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      if (handleAuthError(error)) return;
    }
  }, [token, handleAuthError]);

  const fetchSubjects = useCallback(async (page = 1) => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching subjects:', error);
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error fetching subjects');
      }
    } finally {
      setLoading(false);
    }
  }, [token, semesterFilter, branchFilter, typeFilter, handleAuthError]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  useEffect(() => {
    fetchBranches(semesterFilter);
    setCurrentPage(1); // Reset to page 1 when semester changes
  }, [fetchBranches, semesterFilter]);

  useEffect(() => {
    fetchSubjects(currentPage);
  }, [fetchSubjects, currentPage, semesterFilter, branchFilter, typeFilter]);

  const filteredSubjects = subjects.filter((subject) => {
    const search = searchTerm.toLowerCase();
    return (
      subject.name?.toLowerCase().includes(search) ||
      subject.code?.toLowerCase().includes(search)
    );
  });

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
    
    // When semester changes in form, fetch branches for that semester
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
    setEditingSubject(null);
    resetForm();
    // Fetch all branches when adding new subject
    if (!semesterFilter) {
      fetchBranches('');
    }
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      type: subject.type || 'theory',
      credits: subject.credits || 0,
      semesterId: subject.semesterId?._id || '',
      branchId: subject.branchId?._id || '',
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await axios.delete(`/api/academic/subjects/${id}`, {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
    if (!formData.name || !formData.code || !formData.type || !formData.branchId || !formData.semesterId) {
      alert('Please fill all required fields');
      return;
    }

    const payload = {
      ...formData,
      marks: buildMarks()
    };

    try {
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

  return (
    <AdminLayout title="Subject Management" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">book</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Subject Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage subjects, marks distribution, and curriculum</p>
          </div>
        </div>

        {/* Gradient Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard icon="menu_book" label="Total Subjects" value={stats.total} bgColor="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatsCard icon="school" label="Theory" value={stats.theory} bgColor="bg-gradient-to-br from-green-500 to-green-600" />
          <StatsCard icon="science" label="Practical" value={stats.practical} bgColor="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatsCard icon="star" label="Total Credits" value={stats.totalCredits} bgColor="bg-gradient-to-br from-orange-500 to-orange-600" />
          <StatsCard icon="folder" label="Materials" value={stats.materials} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" />
        </div>

        {/* Filter Bar - Single Row Layout */}
        <div className="bg-white dark:bg-background-dark p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-primary text-sm"
                placeholder="Search subjects..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Semester Filter */}
            <select
              className="h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-primary text-sm font-medium min-w-[160px]"
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                setBranchFilter('');
                setCurrentPage(1);
              }}
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  Sem {semester.semesterNumber}
                </option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              className="h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-primary text-sm font-medium min-w-[140px]"
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>

            {/* Type Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === ''
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('theory')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === 'theory'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Theory
              </button>
              <button
                onClick={() => setTypeFilter('practical')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === 'practical'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Practical
              </button>
              <button
                onClick={() => setTypeFilter('theory+practical')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === 'theory+practical'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Both
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleNewSubject}
              className="bg-gradient-to-r from-primary to-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all ml-auto"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Add Subject
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credits</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Theory</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Pract.</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Materials</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No subjects found</td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{subject.name}</p>
                        <p className="text-xs text-gray-500">{subject.branchId?.name || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase">
                          {subject.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold">
                          {subject.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {subject.credits}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                        {subject.marks?.theory?.total || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                        {subject.marks?.practical?.total || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {subject.marks?.totalMarks || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                        {subject.materials?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="text-primary hover:text-primary/80 font-semibold text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(subject._id)}
                            className="text-red-600 hover:text-red-500 font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              ◄ Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-primary to-orange-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Next ►
            </button>
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center modal-overlay pt-8 px-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 w-full max-w-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Subject Management</span>
                  <span className="text-gray-400 text-xs font-medium">/</span>
                  <span className="text-gray-900 dark:text-white text-xs font-semibold">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</span>
                </div>
                <h2 className="text-gray-900 dark:text-white text-2xl font-bold">{editingSubject ? 'Edit Subject' : 'Add New Subject - Marks Distribution'}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50 dark:bg-gray-900">
              <section className="space-y-5">
                <h3 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">📘 Subject Info</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Subject Name *</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                      placeholder="Enter subject name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Subject Code *</label>
                    <input
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                      placeholder="e.g., CS-401"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Semester *</label>
                    <select
                      name="semesterId"
                      value={formData.semesterId}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((semester) => (
                        <option key={semester._id} value={semester._id}>
                          Sem {semester.semesterNumber} ({semester.academicYear})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Branch *</label>
                    <select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    >
                      <option value="">{branches.length === 0 ? 'Select Semester First' : 'Select Branch'}</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    >
                      <option value="theory">Theory</option>
                      <option value="practical">Practical</option>
                      <option value="theory+practical">Theory + Practical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Credits</label>
                    <input
                      name="credits"
                      type="number"
                      min="0"
                      value={formData.credits}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <h3 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">🎓 Theory Marks</h3>
                <div className="grid grid-cols-2 gap-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Internal Marks</label>
                    <input
                      name="theoryInternal"
                      type="number"
                      value={marksData.theoryInternal === 0 ? '' : marksData.theoryInternal}
                      onChange={handleMarksChange}
                      placeholder="Enter marks"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">External Marks</label>
                    <input
                      name="theoryExternal"
                      type="number"
                      value={marksData.theoryExternal === 0 ? '' : marksData.theoryExternal}
                      onChange={handleMarksChange}
                      placeholder="Enter marks"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <h3 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">🔬 Practical Marks</h3>
                <div className="grid grid-cols-2 gap-6 bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Internal Marks</label>
                    <input
                      name="practicalInternal"
                      type="number"
                      value={marksData.practicalInternal === 0 ? '' : marksData.practicalInternal}
                      onChange={handleMarksChange}
                      placeholder="Enter marks"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">External Marks</label>
                    <input
                      name="practicalExternal"
                      type="number"
                      value={marksData.practicalExternal === 0 ? '' : marksData.practicalExternal}
                      onChange={handleMarksChange}
                      placeholder="Enter marks"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 py-2.5"
                    />
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between bg-gradient-to-r from-primary to-orange-600 text-white p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <span className="material-symbols-outlined text-3xl">calculate</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-90">Total Marks</p>
                    <p className="text-3xl font-black">
                      {(marksData.theoryInternal + marksData.theoryExternal) + (marksData.practicalInternal + marksData.practicalExternal)}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-4 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white font-bold hover:shadow-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                Save Subject
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default SubjectManagement;
