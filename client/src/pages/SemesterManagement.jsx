import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { StatsCard } from '../components/Card';

const SemesterManagement = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0 });

  const [formData, setFormData] = useState({
    semesterNumber: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  // Fetch semesters
  const fetchSemesters = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/academic/semesters/admin/list?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSemesters(response.data.semesters || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setStats({
        total: response.data.pagination?.total || 0,
        active: (response.data.semesters || []).filter(s => s.isActive).length
      });
    } catch (error) {
      console.error('Error fetching semesters:', error);
      alert(error.response?.data?.message || 'Error fetching semesters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters(currentPage);
  }, [currentPage]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.semesterNumber || !formData.academicYear) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingSemester) {
        await axios.put(`/api/academic/semesters/${editingSemester._id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Semester updated successfully');
      } else {
        await axios.post('/api/academic/semesters', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Semester created successfully');
      }
      setShowModal(false);
      setFormData({
        semesterNumber: '',
        academicYear: '',
        startDate: '',
        endDate: '',
        isActive: true
      });
      setEditingSemester(null);
      fetchSemesters(1);
      setCurrentPage(1);
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving semester');
    }
  };

  // Handle edit
  const handleEdit = (semester) => {
    setEditingSemester(semester);
    setFormData({
      semesterNumber: semester.semesterNumber,
      academicYear: semester.academicYear,
      startDate: semester.startDate ? semester.startDate.split('T')[0] : '',
      endDate: semester.endDate ? semester.endDate.split('T')[0] : '',
      isActive: semester.isActive
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      try {
        await axios.delete(`/api/academic/semesters/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Semester deleted successfully');
        fetchSemesters(1);
        setCurrentPage(1);
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting semester');
      }
    }
  };

  // Handle new semester
  const handleNewSemester = () => {
    setEditingSemester(null);
    setFormData({
      semesterNumber: '',
      academicYear: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setShowModal(true);
  };

  // Filter semesters
  const filteredSemesters = semesters.filter(sem =>
    sem.semesterNumber.toString().includes(searchTerm) ||
    sem.academicYear.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AdminLayout title="Semester Management" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">calendar_month</span>
              Semester Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Manage academic terms, schedules, and semester configurations
            </p>
          </div>
          <button
            onClick={handleNewSemester}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-orange-500 hover:to-primary text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            Add New Semester
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon="calendar_today"
            label="Total Semesters"
            value={stats.total}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatsCard
            icon="check_circle"
            label="Active Semesters"
            value={stats.active}
            bgColor="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatsCard
            icon="pending_actions"
            label="Inactive"
            value={stats.total - stats.active}
            bgColor="bg-gradient-to-br from-gray-500 to-gray-600"
          />
          <StatsCard
            icon="percent"
            label="Completion Rate"
            value={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%'}
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400">search</span>
            </div>
            <input
              className="block w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Search by semester number or academic year..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">table_view</span>
                Semester Records
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total: {filteredSemesters.length} semesters
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors" title="Filter">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors" title="Export">
                <span className="material-symbols-outlined">download</span>
              </button>
              <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors" title="Refresh" onClick={() => fetchSemesters(currentPage)}>
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Academic Year</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider text-center">Branches</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading semesters...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSemesters.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-6xl text-gray-400">search_off</span>
                        <p className="text-gray-600 dark:text-gray-400 font-semibold">No semesters found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSemesters.map((semester) => (
                    <tr key={semester._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">calendar_today</span>
                          Sem {semester.semesterNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{semester.academicYear}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {semester.startDate ? new Date(semester.startDate).toLocaleDateString('en-IN', {dateStyle: 'medium'}) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {semester.endDate ? new Date(semester.endDate).toLocaleDateString('en-IN', {dateStyle: 'medium'}) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                          - Branches
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-black uppercase tracking-wide ${
                            semester.isActive
                              ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${semester.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          {semester.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(semester)}
                            className="text-primary hover:text-primary/80 font-bold text-sm transition-colors px-3 py-1 rounded hover:bg-primary/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(semester._id)}
                            className="text-red-600 hover:text-red-500 font-bold text-sm transition-colors px-3 py-1 rounded hover:bg-red-500/10"
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

        {/* Pagination */}
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
                    ? 'bg-gradient-to-r from-primary to-[#ff6b3d] text-white'
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/60 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#1a0f0b] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f4f1f0] dark:border-[#3a2a24] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#181311] dark:text-white">
                {editingSemester ? 'Edit Semester' : 'Add New Semester'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#896b61] hover:text-[#181311] dark:text-[#c4b0a9] dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#181311] dark:text-white">Semester Number *</label>
                  <div className="relative">
                    <select
                      name="semesterNumber"
                      value={formData.semesterNumber}
                      onChange={handleInputChange}
                      className="w-full h-11 rounded-xl border-[#e6dedb] dark:border-[#3a2a24] bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white text-sm focus:ring-primary focus:border-primary appearance-none px-4"
                    >
                      <option value="">Select semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          Semester {num}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#896b61]">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#181311] dark:text-white">Academic Year *</label>
                  <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2024-2025"
                    className="w-full h-11 rounded-xl border-[#e6dedb] dark:border-[#3a2a24] bg-[#f4f1f0] dark:bg-[#2d1e18] text-[#181311] dark:text-white text-sm px-4"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#181311] dark:text-white">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full h-11 rounded-xl border-[#e6dedb] dark:border-[#3a2a24] bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white text-sm px-4"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#181311] dark:text-white">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full h-11 rounded-xl border-[#e6dedb] dark:border-[#3a2a24] bg-white dark:bg-[#2d1e18] text-[#181311] dark:text-white text-sm px-4"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-[#181311] dark:text-white">Status</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-5 h-5 text-primary border-[#e6dedb] dark:border-[#3a2a24] focus:ring-primary bg-white dark:bg-[#2d1e18]"
                      type="radio"
                      name="isActive"
                      value="true"
                      checked={formData.isActive === true}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                    />
                    <span className="text-sm text-[#181311] dark:text-white font-medium group-hover:text-primary transition-colors">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-5 h-5 text-primary border-[#e6dedb] dark:border-[#3a2a24] focus:ring-primary bg-white dark:bg-[#2d1e18]"
                      type="radio"
                      name="isActive"
                      value="false"
                      checked={formData.isActive === false}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                    />
                    <span className="text-sm text-[#181311] dark:text-white font-medium group-hover:text-primary transition-colors">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 border-t border-[#f4f1f0] dark:border-[#3a2a24] flex justify-end gap-3 bg-[#f4f1f0] dark:bg-[#2d1e18]">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#181311] dark:text-white bg-white/70 dark:bg-[#2d1e18] hover:bg-[#e6dedb] dark:hover:bg-[#3a2a24] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-500 shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Save Semester
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default SemesterManagement;
