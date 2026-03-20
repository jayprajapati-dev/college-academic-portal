import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Card, Input, LoadingSpinner, Modal, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleHODSubjects = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'hod');
  const { navItems, loading: navLoading } = useRoleNav(role);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // HOD Branch Scope
  const hodBranchIds = useMemo(() => {
    const getIdValue = (value) => (value && typeof value === 'object' ? value._id : value);
    const toIdSet = (list) => new Set((list || []).map((item) => String(getIdValue(item))));
    return new Set([
      ...toIdSet(user?.branches),
      ...(user?.branch ? [String(user.branch)] : []),
      ...(user?.department ? [String(user.department)] : [])
    ]);
  }, [user]);

  // State Management
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const token = localStorage.getItem('token');
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'theory',
    credits: 3,
    branchId: '',
    semesterId: '',
    description: '',
    syllabus: '',
    theoryInternal: 20,
    theoryExternal: 80,
    practicalInternal: 0,
    practicalExternal: 0,
    isActive: true
  });

  // Profile Fetch
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
  }, [token, navigate]);

  // Fetch Branches (HOD's assigned branches only)
  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get('/api/academic/branches/admin/list?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allBranches = response.data.branches || [];
      // Filter to only HOD's branches
      const hodBranches = allBranches.filter((branch) => hodBranchIds.has(String(branch._id)));
      setBranches(hodBranches);
      if (hodBranches.length > 0 && !selectedBranch) {
        setSelectedBranch(hodBranches[0]._id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load branches');
    }
  }, [token, hodBranchIds, selectedBranch]);

  // Fetch Semesters
  const fetchSemesters = useCallback(async () => {
    try {
      const response = await axios.get('/api/academic/semesters?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSemesters(response.data.data || response.data.semesters || []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  }, [token]);

  // Fetch Subjects (HOD's branches only)
  const fetchSubjects = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(itemsPerPage)
      });
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedSemester) params.append('semesterId', selectedSemester);

      // Use the admin/list endpoint which now supports HOD authorization
      const response = await axios.get(`/api/academic/subjects/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubjects(response.data.subjects || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(error.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [token, selectedBranch, selectedSemester, navigate, itemsPerPage]);

  // Initial Load
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [fetchProfile, navigate, token]);

  useEffect(() => {
    if (role === 'hod' && hodBranchIds.size > 0) {
      fetchBranches();
      fetchSemesters();
    }
  }, [role, hodBranchIds, fetchBranches, fetchSemesters]);

  useEffect(() => {
    if (role === 'hod') {
      fetchSubjects(1);
      setCurrentPage(1);
    }
  }, [role, selectedBranch, selectedSemester, fetchSubjects]);

  // Filter Subjects
  const filteredSubjects = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return subjects.filter((subject) => {
      return (
        subject.name?.toLowerCase().includes(search) ||
        subject.code?.toLowerCase().includes(search)
      );
    });
  }, [subjects, searchTerm]);

  // Paginate
  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(start, start + itemsPerPage);
  }, [filteredSubjects, currentPage, itemsPerPage]);

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredSubjects.length / itemsPerPage)));
  }, [filteredSubjects, itemsPerPage]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: subjects.length,
      theory: subjects.filter((s) => s.type === 'theory').length,
      practical: subjects.filter((s) => s.type === 'practical').length,
      mixed: subjects.filter((s) => s.type === 'theory+practical').length,
      totalCredits: subjects.reduce((sum, s) => sum + (s.credits || 0), 0)
    };
  }, [subjects]);

  // Open Add Modal
  const handleAddSubject = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      type: 'theory',
      credits: 3,
      branchId: selectedBranch || '',
      semesterId: selectedSemester || '',
      description: '',
      syllabus: '',
      theoryInternal: 20,
      theoryExternal: 80,
      practicalInternal: 0,
      practicalExternal: 0,
      isActive: true
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      type: subject.type || 'theory',
      credits: subject.credits || 3,
      branchId: String(subject.branchId?._id || subject.branchId),
      semesterId: String(subject.semesterId?._id || subject.semesterId),
      description: subject.description || '',
      syllabus: subject.syllabus || '',
      theoryInternal: subject.theoryInternal || 20,
      theoryExternal: subject.theoryExternal || 80,
      practicalInternal: subject.practicalInternal || 0,
      practicalExternal: subject.practicalExternal || 0,
      isActive: subject.isActive !== false
    });
    setShowModal(true);
  };

  // Handle Form Input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    }));
  };

  // Save Subject
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Subject name and code are required');
      return;
    }

    if (!formData.branchId) {
      setError('Branch is required');
      return;
    }

    if (!hodBranchIds.has(formData.branchId)) {
      setError('You can only add subjects to your assigned branches');
      return;
    }

    if (formData.syllabus && !/\.pdf($|\?)/i.test(formData.syllabus)) {
      setError('Syllabus must be a PDF link (ending with .pdf)');
      return;
    }

    setSaving(true);
    try {
      const url = editingSubject
        ? `/api/academic/subjects/${editingSubject._id}`
        : '/api/academic/subjects';

      const method = editingSubject ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success || response.status === 201 || response.status === 200) {
        setShowModal(false);
        await fetchSubjects(1);
        setCurrentPage(1);
      } else {
        setError(response.data.message || 'Failed to save subject');
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(error.response?.data?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      const response = await axios.delete(`/api/academic/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchSubjects(1);
        setCurrentPage(1);
      } else {
        setError(response.data.message || 'Failed to delete subject');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(error.response?.data?.message || 'Failed to delete subject');
    }
  };

  if (role !== 'hod') {
    return (
      <RoleLayout 
        userName={user.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel="HOD Panel"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center">
            <p className="text-red-600 font-semibold">Only HODs can access this page</p>
          </Card>
        </div>
      </RoleLayout>
    );
  }

  if (hodBranchIds.size === 0) {
    return (
      <RoleLayout 
        userName={user.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel="HOD Panel"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center">
            <p className="text-amber-600 font-semibold">No branches assigned to you yet</p>
            <p className="text-gray-600 text-sm mt-2">Contact admin to assign branches</p>
          </Card>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout 
      userName={user.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel="HOD Panel"
    >
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Subject Management
            </h1>
            <Button
              onClick={handleAddSubject}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              + Add Subject
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Subjects */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-blue-600 text-sm font-bold uppercase tracking-wider">Total Subjects</p>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-blue-700">{stats.total}</p>
                <p className="text-blue-500 text-xs mt-3 font-medium">Active in your branches</p>
              </div>
            </div>

            {/* Theory */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider">Theory</p>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-lg">📖</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-emerald-700">{stats.theory}</p>
                <p className="text-emerald-500 text-xs mt-3 font-medium">{Math.round((stats.theory / Math.max(stats.total, 1)) * 100)}% of total</p>
              </div>
            </div>

            {/* Practical */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-purple-600 text-sm font-bold uppercase tracking-wider">Practical</p>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <span className="text-lg">🔬</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-purple-700">{stats.practical}</p>
                <p className="text-purple-500 text-xs mt-3 font-medium">{Math.round((stats.practical / Math.max(stats.total, 1)) * 100)}% of total</p>
              </div>
            </div>

            {/* Mixed */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-rose-600 text-sm font-bold uppercase tracking-wider">Theory + Practical</p>
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <span className="text-lg">⚡</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-rose-700">{stats.mixed}</p>
                <p className="text-rose-500 text-xs mt-3 font-medium">{Math.round((stats.mixed / Math.max(stats.total, 1)) * 100)}% of total</p>
              </div>
            </div>

            {/* Total Credits */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-amber-600 text-sm font-bold uppercase tracking-wider">Total Credits</p>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <span className="text-lg">⭐</span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-amber-700">{stats.totalCredits}</p>
                <p className="text-amber-500 text-xs mt-3 font-medium">Credits allocated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem._id} value={sem._id}>
                    Sem {sem.semesterNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Subjects Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : paginatedSubjects.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 font-medium">No subjects found</p>
            <p className="text-gray-400 text-sm mt-2">
              {subjects.length === 0 ? 'Create your first subject to get started' : 'No subjects match your filters'}
            </p>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">
                      Subject Code
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubjects.map((subject, idx) => (
                    <tr
                      key={subject._id}
                      className={`border-b border-gray-200 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-blue-50`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold text-sm">
                          {subject.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          {subject.branchId && (
                            <p className="text-sm text-gray-500">
                              {typeof subject.branchId === 'object' ? subject.branchId.name : subject.branchId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          subject.type === 'theory'
                            ? 'bg-green-100 text-green-800'
                            : subject.type === 'practical'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {subject.type === 'theory+practical' ? 'Theory + Practical' : subject.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-medium text-gray-900">{subject.credits || 0}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          subject.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subject.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredSubjects.length)} of {filteredSubjects.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="xl">
        <div className="rounded-t-lg bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 px-4 py-4 sm:px-6 sm:py-5 text-white">
          <h2 className="text-lg sm:text-2xl font-semibold tracking-tight">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-cyan-100">
            Compact, branch-scoped subject configuration for HOD workflow.
          </p>
        </div>

        <form onSubmit={handleSaveSubject} className="max-h-[calc(100vh-145px)] overflow-y-auto bg-slate-50">
          <div className="p-4 sm:p-5 space-y-4">
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-600">Basic Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Subject Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Data Structures"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Subject Code *</label>
                    <input
                      type="text"
                      name="code"
                      placeholder="CS201"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Credits *</label>
                    <input
                      type="number"
                      name="credits"
                      min="0"
                      max="10"
                      value={formData.credits}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
                  <textarea
                    name="description"
                    placeholder="Brief overview for this subject"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-600">Academic Setup</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Subject Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="theory">Theory</option>
                      <option value="practical">Practical</option>
                      <option value="theory+practical">Theory + Practical</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex w-full items-center gap-2 rounded-md border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-400 text-blue-600"
                      />
                      Active Subject
                    </label>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Branch *</label>
                    <select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Semester</label>
                    <select
                      name="semesterId"
                      value={formData.semesterId}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select semester</option>
                      {semesters.map((sem) => (
                        <option key={sem._id} value={sem._id}>
                          Semester {sem.semesterNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Only assigned branches are available for HOD subject creation.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-600">Marks Distribution</h3>
                  <span className="text-xs text-slate-500">Theory and Practical split</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Theory Internal</label>
                    <input
                      type="number"
                      name="theoryInternal"
                      min="0"
                      max="100"
                      value={formData.theoryInternal}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-center text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Theory External</label>
                    <input
                      type="number"
                      name="theoryExternal"
                      min="0"
                      max="100"
                      value={formData.theoryExternal}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-center text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Practical Internal</label>
                    <input
                      type="number"
                      name="practicalInternal"
                      min="0"
                      max="100"
                      value={formData.practicalInternal}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-center text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Practical External</label>
                    <input
                      type="number"
                      name="practicalExternal"
                      min="0"
                      max="100"
                      value={formData.practicalExternal}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-center text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm lg:col-span-2">
                <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-600">Syllabus</h3>
                <input
                  type="url"
                  name="syllabus"
                  placeholder="https://example.com/syllabus.pdf"
                  value={formData.syllabus}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs text-slate-500">Single PDF link only.</p>
              </section>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="w-full sm:w-auto rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </RoleLayout>
  );
};

export default RoleHODSubjects;
