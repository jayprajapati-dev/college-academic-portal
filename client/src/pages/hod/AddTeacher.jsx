import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    selectedBranches: [],
    selectedSemesters: [],
    selectedSubjects: []
  });

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const { navItems, loading: navLoading } = useRoleNav(currentUser.role || 'hod');

  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
      if (!handleAuthError(error)) {
        console.error('Error fetching semesters:', error);
      }
    }
  }, [token, handleAuthError]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get('/api/academic/branches/admin/list?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(response.data.branches || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching branches:', error);
      }
    }
  }, [token, handleAuthError]);

  // Fetch initial data
  useEffect(() => {
    fetchSemesters();
    fetchBranches();
  }, [fetchSemesters, fetchBranches]);

  const fetchSubjects = useCallback(async (branchIds, semesterIds) => {
    if (branchIds.length === 0 || semesterIds.length === 0) {
      setSubjects([]);
      setFormData((prev) => ({ ...prev, selectedSubjects: [] }));
      return;
    }

    try {
      const params = new URLSearchParams({ page: '1', limit: '200' });
      branchIds.forEach((id) => params.append('branchId', id));
      semesterIds.forEach((id) => params.append('semesterId', id));

      const response = await axios.get(`/api/academic/subjects/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const subjectList = response.data?.subjects || [];
      setSubjects(subjectList);
      const allowedIds = new Set(subjectList.map((subject) => String(subject._id)));
      setFormData((prev) => ({
        ...prev,
        selectedSubjects: prev.selectedSubjects.filter((id) => allowedIds.has(String(id)))
      }));
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching subjects:', error);
      }
      setSubjects([]);
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    fetchSubjects(formData.selectedBranches, formData.selectedSemesters);
  }, [fetchSubjects, formData.selectedBranches, formData.selectedSemesters]);

  const handleBranchChange = (branchId) => {
    setFormData(prev => ({
      ...prev,
      selectedBranches: prev.selectedBranches.includes(branchId)
        ? prev.selectedBranches.filter(id => id !== branchId)
        : [...prev.selectedBranches, branchId]
    }));
  };

  const handleSemesterChange = (semesterId) => {
    setFormData(prev => ({
      ...prev,
      selectedSemesters: prev.selectedSemesters.includes(semesterId)
        ? prev.selectedSemesters.filter(id => id !== semesterId)
        : [...prev.selectedSemesters, semesterId]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length !== 10) {
      setError('Valid 10-digit mobile number is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile,
        branchIds: formData.selectedBranches,
        semesterIds: formData.selectedSemesters,
        subjectIds: formData.selectedSubjects,
        addedBy: currentUser._id,
        addedByRole: currentUser.role
      };

      const response = await axios.post('/api/admin/add-teacher', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.data?.tempPassword) {
        setTempPassword(response.data.data.tempPassword);
        setCreatedTeacher(response.data.data);
        setShowPasswordModal(true);
        
        // Reset form
        setFormData({
          name: '',
          mobile: '',
          selectedBranches: [],
          selectedSemesters: [],
          selectedSubjects: []
        });
        setSubjects([]);
      } else {
        setSuccess('Teacher created successfully!');
        setTimeout(() => {
          navigate(currentUser.role === 'admin' ? '/admin/users' : '/hod/dashboard');
        }, 2000);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        setError(error.response?.data?.message || 'Failed to create teacher');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    alert('Temporary password copied to clipboard!');
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setTempPassword('');
    setCreatedTeacher(null);
    navigate(currentUser.role === 'admin' ? '/admin/users' : '/hod/dashboard');
  };

  return (
    <RoleLayout title="Add Teacher" userName={currentUser?.name || 'HOD'} onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }} navItems={navItems} navLoading={navLoading} panelLabel="Add Teacher"
      profileLinks={[{ label: 'Profile', to: `/${currentUser.role || 'hod'}/profile` }]}>
      <>
        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
                  <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Teacher Created!</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share credentials with teacher</p>
                </div>
              </div>

              {/* Teacher Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">Name</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{createdTeacher?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">Mobile</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{createdTeacher?.mobile}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">Email</p>
                  <p className="text-gray-900 dark:text-white font-semibold break-all">{createdTeacher?.email}</p>
                </div>
              </div>

              {/* Temporary Password */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temporary Password</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-900 dark:bg-gray-900 rounded-lg px-4 py-3 border-2 border-blue-500">
                    <p className="text-lg font-mono font-bold text-blue-400 tracking-widest">{tempPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Important
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 ml-2">
                  <li>• Share password via secure channel only</li>
                  <li>• Teacher must login with Mobile + Password</li>
                  <li>• Password expires after first login</li>
                  <li>• Teacher must set new password on first login</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex-1 px-4 py-3 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">content_copy</span>
                  Copy Password
                </button>
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">done</span>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Add Teacher</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new teacher account with subject assignments</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
            <button onClick={() => setError('')} className="hover:opacity-70">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </div>
            <button onClick={() => setSuccess('')} className="hover:opacity-70">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter teacher's full name"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>

          {/* Mobile Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mobile Number * (10 digits)</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, mobile: value }));
              }}
              maxLength={10}
              placeholder="1234567890"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>

          {/* Branches */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Branches (Optional)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {branches.map(branch => (
                <label key={branch._id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.selectedBranches.includes(branch._id)}
                    onChange={() => handleBranchChange(branch._id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{branch.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Semesters */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Semesters (Optional)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {semesters.map(semester => (
                <label key={semester._id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.selectedSemesters.includes(semester._id)}
                    onChange={() => handleSemesterChange(semester._id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{semester.name}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.selectedBranches.length > 0 && formData.selectedSemesters.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Subjects (Optional)</label>
              {subjects.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No subjects found for selected branches and semesters.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-48 overflow-y-auto">
                  {subjects.map(subject => (
                    <label key={subject._id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedSubjects.includes(subject._id)}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            selectedSubjects: prev.selectedSubjects.includes(subject._id)
                              ? prev.selectedSubjects.filter((id) => id !== subject._id)
                              : [...prev.selectedSubjects, subject._id]
                          }));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{subject.name} ({subject.code})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
              <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">info</span>
              <span>A temporary password will be auto-generated and the teacher will need to set a new password on their first login.</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(currentUser.role === 'admin' ? '/admin/users' : '/hod/dashboard')}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  Create Teacher
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </>
    </RoleLayout>
  );
};

export default AddTeacher;
