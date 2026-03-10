import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RoleLayout } from '../../components';
import { StatsCard } from '../../components/Card';
import useRoleNav from '../../hooks/useRoleNav';

const RoleBranches = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'admin');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const isAdmin = role === 'admin';

  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchStudents, setBranchStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState('');
  const [showBulkProfileModal, setShowBulkProfileModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [selectedBranchForCapacity, setSelectedBranchForCapacity] = useState(null);
  const [capacityBySemester, setCapacityBySemester] = useState({});
  const [studentSemesterFilter, setStudentSemesterFilter] = useState('');
  const [branchStats, setBranchStats] = useState({
    totalSeats: 0,
    enrolledStudents: 0,
    availableSeats: 0,
    capacityPercent: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    totalSeats: 0,
    description: '',
    isActive: true
  });

  const token = localStorage.getItem('token');
  const panelLabel = isAdmin ? 'Admin Panel' : 'Staff Panel';
  const canManageCapacity = role === 'admin' || role === 'hod';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    try {
      if (!token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const profileRes = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      if (!profileData.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setUser(profileData.data);
      setRole(profileData.data.role);

      if (!['admin', 'hod', 'teacher', 'coordinator'].includes(profileData.data.role)) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Profile error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate, token]);

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

  const fetchBranches = useCallback(async (page = 1) => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });

      if (user?.role === 'coordinator' && user?.coordinator?.semesters?.length) {
        const firstSem = user.coordinator.semesters[0];
        params.append('semesterId', firstSem._id || firstSem);
      }

      const response = await axios.get(`/api/academic/branches/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBranches(response.data.branches || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching branches:', error);
      if (!handleAuthError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        alert(error.response?.data?.message || 'Error fetching branches');
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, navigate, user]);

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await axios.get('/api/academic/semesters');
      if (response.data?.success) {
        setSemesters(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchBranches(currentPage);
  }, [currentPage, fetchBranches]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const totalStudents = branches.reduce((sum, b) => sum + (b.enrolledStudents || 0), 0);
    return { total, active, totalStudents };
  }, [branches]);

  const filteredBranches = branches.filter((branch) => {
    const search = searchTerm.toLowerCase();
    return (
      branch.name?.toLowerCase().includes(search) ||
      branch.code?.toLowerCase().includes(search)
    );
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewBranch = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: '',
      totalSeats: 0,
      description: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      totalSeats: branch.totalSeats || 0,
      description: branch.description || '',
      isActive: branch.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await axios.delete(`/api/academic/branches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBranches(1);
      setCurrentPage(1);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error deleting branch');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      alert('Please provide name and code');
      return;
    }

    try {
      if (editingBranch) {
        await axios.put(`/api/academic/branches/${editingBranch._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/academic/branches', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      fetchBranches(1);
      setCurrentPage(1);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error saving branch');
      }
    }
  };

  const handleGenerateCode = () => {
    const words = formData.name.trim().split(' ');
    const code = words
      .map((word) => word[0])
      .join('')
      .toUpperCase();
    setFormData((prev) => ({ ...prev, code }));
  };

  const getCapacityPercent = (branch) => {
    const totalSeats = Number(branch.totalSeats || 0);
    const totalStudents = Number(branch.enrolledStudents || 0);
    if (!totalSeats) return 0;
    return Math.min(100, Math.round((totalStudents / totalSeats) * 100));
  };

  const handleViewStudents = async (branch, semesterId = '') => {
    setSelectedBranch(branch);
    setStudentSemesterFilter(semesterId);
    setShowStudentsModal(true);
    setStudentsLoading(true);
    setBranchStudents([]);

    try {
      const params = new URLSearchParams();
      if (semesterId) params.append('semesterId', semesterId);
      const response = await axios.get(`/api/academic/branches/${branch._id}/students${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setBranchStudents(response.data.students || []);
        setBranchStats(response.data.stats || {
          totalSeats: Number(branch.totalSeats || 0),
          enrolledStudents: Number(branch.enrolledStudents || 0),
          availableSeats: Number(branch.availableSeats || 0),
          capacityPercent: getCapacityPercent(branch)
        });
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error fetching branch students');
      }
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleOpenCapacityModal = (branch) => {
    const initialMap = {};
    (semesters || []).forEach((semester) => {
      const override = (branch.semesterSeatOverrides || []).find((item) => String(item.semester) === String(semester._id));
      initialMap[semester._id] = Number(override?.totalSeats ?? branch.totalSeats ?? 0);
    });
    setSelectedBranchForCapacity(branch);
    setCapacityBySemester(initialMap);
    setShowCapacityModal(true);
  };

  const handleSaveSemesterCapacity = async () => {
    if (!selectedBranchForCapacity) return;
    try {
      const requests = Object.entries(capacityBySemester)
        .filter(([semesterId]) => !!semesterId)
        .map(([semesterId, totalSeats]) => axios.put(
          `/api/academic/branches/${selectedBranchForCapacity._id}/semester-capacity`,
          { semesterId, totalSeats: Number(totalSeats || 0) },
          { headers: { Authorization: `Bearer ${token}` } }
        ));

      await Promise.all(requests);
      setShowCapacityModal(false);
      await fetchBranches(currentPage);
      alert('Semester capacities updated successfully');
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Failed to update semester capacity');
      }
    }
  };

  const handleStudentStatusToggle = async (student) => {
    setUpdatingStudentId(student._id);
    try {
      const status = student.status === 'disabled' ? 'active' : 'disabled';
      await axios.put(`/api/admin/user/${student._id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await handleViewStudents(selectedBranch);
      await fetchBranches(currentPage);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Failed to update student status');
      }
    } finally {
      setUpdatingStudentId('');
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.name}?`)) return;
    setUpdatingStudentId(student._id);
    try {
      await axios.delete(`/api/admin/users/${student._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await handleViewStudents(selectedBranch);
      await fetchBranches(currentPage);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Failed to delete student');
      }
    } finally {
      setUpdatingStudentId('');
    }
  };

  const handleModifyStudent = async (student) => {
    const semesterId = window.prompt('Enter semester ID to assign for this student', student.semester?._id || student.semester || '');
    if (!semesterId) return;
    setUpdatingStudentId(student._id);
    try {
      await axios.put(`/api/academic/branches/${selectedBranch._id}/students/${student._id}`, { semesterId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await handleViewStudents(selectedBranch);
      await fetchBranches(currentPage);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Failed to modify student');
      }
    } finally {
      setUpdatingStudentId('');
    }
  };

  const handleBulkProfileUpdateAlert = async () => {
    try {
      await axios.post('/api/admin/users/profile-update-required/bulk', { required: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowBulkProfileModal(false);
      alert('Bulk profile update alert sent successfully');
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Failed to send bulk profile update alert');
      }
    }
  };

  return (
    <RoleLayout
      title="Branch Management"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={[]}
    >
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <span className="material-symbols-outlined text-3xl md:text-[34px] text-primary">apartment</span>
              Branch Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Manage academic divisions and branch capacity
            </p>
          </div>
          <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                className="h-11 w-full sm:w-64 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowBulkProfileModal(true)}
              className="h-10 px-3.5 text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold"
            >
              Bulk Profile Update Alert
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon="account_tree"
            label="Total Branches"
            value={stats.total}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            compact
          />
          <StatsCard
            icon="check_circle"
            label="Active Branches"
            value={stats.active}
            bgColor="bg-gradient-to-br from-green-500 to-green-600"
            compact
          />
          <StatsCard
            icon="groups"
            label="Total Students"
            value={stats.totalStudents}
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            compact
          />
          <StatsCard
            icon="menu_book"
            label="Total Subjects"
            value="-"
            bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
            compact
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#dce2e5] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 md:px-5 py-4 border-b border-[#dce2e5] dark:border-gray-800 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#111518] dark:text-white">Branch Inventory</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button className="p-2 text-[#637c88] hover:bg-[#f0f3f4] dark:hover:bg-gray-800 rounded-lg">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button className="p-2 text-[#637c88] hover:bg-[#f0f3f4] dark:hover:bg-gray-800 rounded-lg">
                <span className="material-symbols-outlined">file_download</span>
              </button>
              {isAdmin && (
                <button
                  onClick={handleNewBranch}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-orange-500 text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Branch
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto @container">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Branch Name</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Semester</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total Seats</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Available Seats</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-[#637c88]">Loading...</td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-[#637c88]">No branches found</td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => (
                    <tr key={branch._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[#111518] dark:text-white font-semibold">{branch.name}</span>
                          <span className="text-xs text-[#637c88] dark:text-gray-500 italic">{branch.description || 'No description'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">{branch.code}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                          Sem {branch.semesterId?.semesterNumber || '-'}
                          {branch.semesterId?.academicYear ? ` (${branch.semesterId.academicYear})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-semibold">{branch.totalSeats || 0}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-2 rounded-full bg-[#dce2e5] dark:bg-gray-700 overflow-hidden">
                            <div className="h-full bg-accent-red" style={{ width: `${getCapacityPercent(branch)}%` }}></div>
                          </div>
                          <span className="text-accent-red text-sm font-bold">
                            {branch.enrolledStudents || 0}/{branch.totalSeats || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">{branch.availableSeats || 0}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-black uppercase tracking-wide ${
                          branch.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${branch.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewStudents(branch)}
                            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white bg-indigo-600 rounded-md shadow-sm hover:shadow-md transition-all"
                            title="View Students"
                          >
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                            <span className="hidden xl:inline">View</span>
                          </button>
                          {canManageCapacity && (
                            <button
                              onClick={() => handleOpenCapacityModal(branch)}
                              className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white bg-violet-600 rounded-md shadow-sm hover:shadow-md transition-all"
                              title="Manage Semester Capacity"
                            >
                              <span className="material-symbols-outlined text-[16px]">tune</span>
                              <span className="hidden xl:inline">Capacity</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(branch)}
                            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white bg-primary rounded-md shadow-sm hover:shadow-md transition-all"
                            title="Edit Branch"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            <span className="hidden xl:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(branch._id)}
                            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white bg-red-600 rounded-md shadow-sm hover:shadow-md transition-all"
                            title="Delete Branch"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span className="hidden xl:inline">Delete</span>
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
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              ◄ Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-accent-orange to-accent-red text-white'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Next ►
            </button>
          </div>
        )}

      {showStudentsModal && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedBranch.name} - Students</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sem {selectedBranch.semesterId?.semesterNumber || '-'}
                  {selectedBranch.semesterId?.academicYear ? ` (${selectedBranch.semesterId.academicYear})` : ''} • Code: {selectedBranch.code}
                </p>
              </div>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 border-b border-gray-200 dark:border-gray-700">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-2">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase">Total Seats</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{branchStats.totalSeats || 0}</p>
              </div>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-900/30 px-3 py-2">
                <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold uppercase">Enrolled</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{branchStats.enrolledStudents || 0}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Available</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{branchStats.availableSeats || 0}</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase">Capacity Used</p>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{branchStats.capacityPercent || 0}%</p>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by Semester</label>
              <select
                value={studentSemesterFilter}
                onChange={(e) => handleViewStudents(selectedBranch, e.target.value)}
                className="h-10 px-3 border rounded-lg text-sm w-full sm:w-auto"
              >
                <option value="">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    Sem {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Enrollment</th>
                    <th className="px-6 py-3 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-3 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading students...</td>
                    </tr>
                  ) : branchStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No students enrolled in this branch</td>
                    </tr>
                  ) : (
                    branchStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">{student.enrollmentNumber || '-'}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900 dark:text-gray-100">{student.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{student.email || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{student.mobile || '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : student.status === 'disabled'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                          }`}>
                            {student.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              disabled={updatingStudentId === student._id}
                              onClick={() => handleStudentStatusToggle(student)}
                              className="px-2 py-1 text-[11px] bg-amber-600 text-white rounded"
                            >
                              {student.status === 'disabled' ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              disabled={updatingStudentId === student._id}
                              onClick={() => handleModifyStudent(student)}
                              className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded"
                            >
                              Modify
                            </button>
                            <button
                              disabled={updatingStudentId === student._id}
                              onClick={() => handleDeleteStudent(student)}
                              className="px-2 py-1 text-[11px] bg-red-600 text-white rounded"
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
        </div>
      )}

      {showBulkProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Profile Update Alert</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">All scoped students will be asked to update branch and semester on next login.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowBulkProfileModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleBulkProfileUpdateAlert} className="px-4 py-2 bg-orange-600 text-white rounded">Send Alert</button>
            </div>
          </div>
        </div>
      )}

      {showCapacityModal && selectedBranchForCapacity && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manage Semester Capacity - {selectedBranchForCapacity.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set allowed seats semester-wise for this branch.</p>

            <div className="mt-4 flex-1 min-h-0 overflow-y-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((semester) => (
                    <tr key={semester._id} className="border-t">
                      <td className="px-4 py-3 text-sm font-semibold">Sem {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={capacityBySemester[semester._id] ?? selectedBranchForCapacity.totalSeats ?? 0}
                          onChange={(e) => setCapacityBySemester((prev) => ({ ...prev, [semester._id]: e.target.value }))}
                          className="w-28 px-3 py-2 border rounded-lg text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button onClick={() => setShowCapacityModal(false)} className="w-full sm:w-auto px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSaveSemesterCapacity} className="w-full sm:w-auto px-4 py-2 bg-violet-600 text-white rounded">Save Capacity</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 modal-overlay bg-black/60 backdrop-blur overflow-y-auto">
          <div className="bg-white dark:bg-[#1a0f0b] w-full max-w-[550px] max-h-[92vh] rounded-xl shadow-2xl border border-[#e6dedb] dark:border-[#54433b] overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-2">
              <div className="flex flex-col gap-1">
                <p className="text-[#181311] dark:text-white text-2xl font-bold leading-tight">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</p>
                <p className="text-[#896b61] dark:text-[#b9a69d] text-sm font-normal leading-normal">Enter the details for the academic branch.</p>
              </div>
            </div>
            <form className="flex-1 px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
              <div className="flex flex-col gap-2">
                <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">Branch Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input flex w-full rounded-lg text-[#181311] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e6dedb] dark:border-[#54433b] bg-[#f4f1f0] dark:bg-[#2a241f] h-12 placeholder:text-[#896b61]/60 dark:placeholder:text-[#b9a69d]/50 px-4 text-base font-normal leading-normal hover:border-[#cdbdb7] dark:hover:border-[#6b5f56] transition-colors"
                  placeholder="e.g. Computer Science and Engineering"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">Branch Code</label>
                <div className="flex flex-col sm:flex-row w-full items-stretch rounded-lg group gap-2 sm:gap-0">
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="form-input flex w-full min-w-0 flex-1 rounded-lg sm:rounded-r-none sm:border-r-0 text-[#181311] dark:text-white focus:outline-0 focus:ring-0 border border-[#e6dedb] dark:border-[#54433b] bg-[#f4f1f0] dark:bg-[#2a241f] h-12 placeholder:text-[#896b61]/60 dark:placeholder:text-[#b9a69d]/50 px-4 text-base font-normal leading-normal hover:border-[#cdbdb7] dark:hover:border-[#6b5f56] transition-colors"
                    placeholder="Enter code"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-primary flex border border-[#e6dedb] dark:border-[#54433b] bg-[#f4f1f0] dark:bg-[#2a241f] items-center justify-center px-4 rounded-lg sm:rounded-r-lg sm:rounded-l-none sm:border-l-0 hover:bg-primary/10 hover:border-primary/50 transition-all h-11 sm:h-12"
                  >
                    <span className="material-symbols-outlined text-[20px] mr-1">auto_awesome</span>
                    <span className="text-xs font-semibold uppercase tracking-wider">Auto</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">Total Seats</label>
                <input
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleInputChange}
                  className="form-input flex w-full rounded-lg text-[#181311] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e6dedb] dark:border-[#54433b] bg-[#f4f1f0] dark:bg-[#2a241f] h-12 placeholder:text-[#896b61]/60 dark:placeholder:text-[#b9a69d]/50 px-4 text-base font-normal leading-normal hover:border-[#cdbdb7] dark:hover:border-[#6b5f56] transition-colors"
                  placeholder="e.g. 60"
                  type="number"
                  min="0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">Description (optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input flex w-full rounded-lg text-[#181311] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e6dedb] dark:border-[#54433b] bg-[#f4f1f0] dark:bg-[#2a241f] min-h-[100px] placeholder:text-[#896b61]/60 dark:placeholder:text-[#b9a69d]/50 p-4 text-base font-normal leading-normal resize-none hover:border-[#cdbdb7] dark:hover:border-[#6b5f56] transition-colors"
                  placeholder="Enter academic objectives and details..."
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[#181311] dark:text-white text-sm font-medium leading-normal">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="form-radio bg-transparent border-[#54433b] text-primary focus:ring-offset-0 focus:ring-primary h-5 w-5"
                      name="isActive"
                      type="radio"
                      value="true"
                      checked={formData.isActive === true}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                    />
                    <span className="text-[#181311] dark:text-white group-hover:text-primary transition-colors">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="form-radio bg-transparent border-[#54433b] text-primary focus:ring-offset-0 focus:ring-primary h-5 w-5"
                      name="isActive"
                      type="radio"
                      value="false"
                      checked={formData.isActive === false}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                    />
                    <span className="text-[#181311] dark:text-white group-hover:text-primary transition-colors">Inactive</span>
                  </label>
                </div>
              </div>
            </form>
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-[#e6dedb] dark:border-[#54433b] flex flex-col sm:flex-row sm:justify-end gap-3 bg-[#f4f1f0] dark:bg-[#2a241f]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-[#181311] dark:text-white bg-white/70 dark:bg-[#2d1e18] hover:bg-[#e6dedb] dark:hover:bg-[#3a2a24] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-500 shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Save Branch
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </RoleLayout>
  );
};

export default RoleBranches;
