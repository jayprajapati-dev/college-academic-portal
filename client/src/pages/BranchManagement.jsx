import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { StatsCard } from '../components/Card';

const BranchManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semesterId: '',
    totalSeats: 0,
    description: '',
    isActive: true
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

  const fetchBranches = useCallback(async (page = 1, semesterId = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (semesterId) {
        params.append('semesterId', semesterId);
      }

      const response = await axios.get(`/api/academic/branches/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBranches(response.data.branches || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching branches:', error);
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error fetching branches');
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  useEffect(() => {
    fetchBranches(currentPage, semesterFilter);
  }, [currentPage, semesterFilter, fetchBranches]);

  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const totalStudents = branches.reduce((sum, b) => sum + (b.totalStudents || 0), 0);
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
      semesterId: semesterFilter || '',
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
      semesterId: branch.semesterId?._id || '',
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
      fetchBranches(1, semesterFilter);
      setCurrentPage(1);
    } catch (error) {
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error deleting branch');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.semesterId) {
      alert('Please provide name, code and semester');
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
      fetchBranches(1, semesterFilter);
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
    const totalStudents = Number(branch.totalStudents || 0);
    if (!totalSeats) return 0;
    return Math.min(100, Math.round((totalStudents / totalSeats) * 100));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AdminLayout title="Branch Management" onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">apartment</span>
              Branch Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
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
            <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-[#dce2e5] dark:border-gray-800 shadow-sm">
              <label className="flex flex-col min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <p className="text-[#111518] dark:text-gray-300 text-xs font-bold uppercase tracking-wider">Select Semester</p>
                </div>
                <select
                  className="form-select border-none bg-transparent focus:ring-0 text-[#111518] dark:text-white text-sm font-semibold py-1"
                  value={semesterFilter}
                  onChange={(e) => {
                    setSemesterFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Semesters</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Sem {semester.semesterNumber} ({semester.academicYear})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={handleNewBranch}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Branch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon="account_tree"
            label="Total Branches"
            value={stats.total}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatsCard
            icon="check_circle"
            label="Active Branches"
            value={stats.active}
            bgColor="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatsCard
            icon="groups"
            label="Total Students"
            value={stats.totalStudents}
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatsCard
            icon="menu_book"
            label="Total Subjects"
            value="-"
            bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#dce2e5] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#dce2e5] dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#111518] dark:text-white">Branch Inventory</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 text-[#637c88] hover:bg-[#f0f3f4] dark:hover:bg-gray-800 rounded-lg">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button className="p-2 text-[#637c88] hover:bg-[#f0f3f4] dark:hover:bg-gray-800 rounded-lg">
                <span className="material-symbols-outlined">file_download</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto @container">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Branch Name</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total Seats</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-[#637c88]">Loading...</td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-[#637c88]">No branches found</td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => (
                    <tr key={branch._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[#111518] dark:text-white font-semibold">{branch.name}</span>
                          <span className="text-xs text-[#637c88] dark:text-gray-500 italic">{branch.description || 'No description'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">{branch.code}</span>
                      </td>
                      <td className="px-6 py-5 text-gray-700 dark:text-gray-300 font-semibold">{branch.totalSeats || 0}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-2 rounded-full bg-[#dce2e5] dark:bg-gray-700 overflow-hidden">
                            <div className="h-full bg-accent-red" style={{ width: `${getCapacityPercent(branch)}%` }}></div>
                          </div>
                          <span className="text-accent-red text-sm font-bold">
                            {branch.totalStudents || 0}/{branch.totalSeats || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">-</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-black uppercase tracking-wide ${
                          branch.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${branch.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(branch)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-primary rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                            title="Edit Branch"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(branch._id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600 rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                            title="Delete Branch"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
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
          <div className="mt-8 flex justify-center gap-2">
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
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Next ►
            </button>
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60 backdrop-blur">
          <div className="bg-[#2a241f] w-full max-w-[550px] rounded-xl shadow-2xl border border-[#54433b] overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-2">
              <div className="flex flex-col gap-1">
                <p className="text-white text-2xl font-bold leading-tight">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</p>
                <p className="text-[#b9a69d] text-sm font-normal leading-normal">Enter the details for the academic branch.</p>
              </div>
            </div>
            <form className="flex-1 px-6 py-4 space-y-5 overflow-y-auto max-h-[75vh]">
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium leading-normal">Semester</label>
                <div className="relative">
                  <select
                    name="semesterId"
                    value={formData.semesterId}
                    onChange={handleInputChange}
                    className="form-input appearance-none flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#54433b] bg-[#2a241f] h-12 px-4 text-base font-normal leading-normal hover:border-[#6b5f56] transition-colors"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((semester) => (
                      <option key={semester._id} value={semester._id}>
                        Sem {semester.semesterNumber} ({semester.academicYear})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#b9a69d]">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium leading-normal">Branch Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#54433b] bg-[#2a241f] h-12 placeholder:text-[#b9a69d]/50 px-4 text-base font-normal leading-normal hover:border-[#6b5f56] transition-colors"
                  placeholder="e.g. Computer Science and Engineering"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium leading-normal">Branch Code</label>
                <div className="flex w-full items-stretch rounded-lg group">
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="form-input flex w-full min-w-0 flex-1 rounded-lg rounded-r-none border-r-0 text-white focus:outline-0 focus:ring-0 border border-[#54433b] bg-[#2a241f] h-12 placeholder:text-[#b9a69d]/50 px-4 text-base font-normal leading-normal hover:border-[#6b5f56] transition-colors"
                    placeholder="Enter code"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-primary flex border border-[#54433b] bg-[#2a241f] items-center justify-center px-4 rounded-r-lg border-l-0 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px] mr-1">auto_awesome</span>
                    <span className="text-xs font-semibold uppercase tracking-wider">Auto</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium leading-normal">Total Seats</label>
                <input
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleInputChange}
                  className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#54433b] bg-[#2a241f] h-12 placeholder:text-[#b9a69d]/50 px-4 text-base font-normal leading-normal hover:border-[#6b5f56] transition-colors"
                  placeholder="e.g. 60"
                  type="number"
                  min="0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium leading-normal">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#54433b] bg-[#2a241f] min-h-[100px] placeholder:text-[#b9a69d]/50 p-4 text-base font-normal leading-normal resize-none hover:border-[#6b5f56] transition-colors"
                  placeholder="Enter academic objectives and details..."
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-white text-sm font-medium leading-normal">Status</label>
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
                    <span className="text-white group-hover:text-primary transition-colors">Active</span>
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
                    <span className="text-white group-hover:text-primary transition-colors">Inactive</span>
                  </label>
                </div>
              </div>
            </form>
            <div className="p-6 flex justify-end items-center gap-3 border-t border-[#54433b] bg-[#2a241f]">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-gradient-primary px-8 py-2.5 rounded-lg text-white font-semibold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                type="button"
              >
                Save Branch
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default BranchManagement;
