import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

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
      return;
    }

    try {
      const params = new URLSearchParams({ page: '1', limit: '200' });
      branchIds.forEach(id => params.append('branchId', id));
      semesterIds.forEach(id => params.append('semesterId', id));

      const response = await axios.get(`/api/academic/subjects/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(response.data.subjects || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching subjects:', error);
      }
    }
  }, [token, handleAuthError]);

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    const selectedBranches = formData.selectedBranches.includes(branchId)
      ? formData.selectedBranches.filter(id => id !== branchId)
      : [...formData.selectedBranches, branchId];

    setFormData(prev => ({ ...prev, selectedBranches }));
    fetchSubjects(selectedBranches, formData.selectedSemesters);
  };

  const handleSemesterChange = (e) => {
    const semesterId = e.target.value;
    const selectedSemesters = formData.selectedSemesters.includes(semesterId)
      ? formData.selectedSemesters.filter(id => id !== semesterId)
      : [...formData.selectedSemesters, semesterId];

    setFormData(prev => ({ ...prev, selectedSemesters }));
    fetchSubjects(formData.selectedBranches, selectedSemesters);
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const selectedSubjects = formData.selectedSubjects.includes(subjectId)
      ? formData.selectedSubjects.filter(id => id !== subjectId)
      : [...formData.selectedSubjects, subjectId];

    setFormData(prev => ({ ...prev, selectedSubjects }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.mobile) {
      setError('Name and Mobile Number are required');
      return;
    }

    if (formData.selectedBranches.length === 0) {
      setError('Select at least one branch');
      return;
    }

    if (formData.selectedSemesters.length === 0) {
      setError('Select at least one semester');
      return;
    }

    if (formData.selectedSubjects.length === 0) {
      setError('Select at least one subject');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
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
      } else {
        setSuccess('Teacher added successfully!');
        setTimeout(() => {
          navigate('/admin/manage-users');
        }, 2000);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        setError(error.response?.data?.message || 'Error adding teacher');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    alert('Temporary password copied!');
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setTempPassword('');
    setCreatedTeacher(null);
    navigate('/admin/manage-users');
  };

  return (
    <AdminLayout title="Add Teacher" onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }}>
      <>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
                  <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Teacher Created!</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share credentials securely</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">Name</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{createdTeacher?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">Mobile</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{createdTeacher?.mobile}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temporary Password</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-900 rounded-lg px-4 py-3 border-2 border-blue-500">
                    <p className="text-lg font-mono font-bold text-blue-400 tracking-widest">{tempPassword}</p>
                  </div>
                  <button type="button" onClick={handleCopyPassword} className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Important
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 ml-2">
                  <li>• Share via secure channel only</li>
                  <li>• Expires after first login</li>
                  <li>• Teacher must set new password</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleCopyPassword} className="flex-1 px-4 py-3 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">content_copy</span>
                  Copy
                </button>
                <button type="button" onClick={handleClosePasswordModal} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">done</span>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Teacher</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Create a new teacher account with branches and subjects assignment</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter teacher name"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobile: value });
                }}
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="1234567890"
              />
            </div>

            {/* Branches */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Branches *</label>
              <div className="grid grid-cols-2 gap-3">
                {branches.map(branch => (
                  <label key={branch._id} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      value={branch._id}
                      checked={formData.selectedBranches.includes(branch._id)}
                      onChange={handleBranchChange}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{branch.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Semesters */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Semesters *</label>
              <div className="grid grid-cols-2 gap-3">
                {semesters.map(semester => (
                  <label key={semester._id} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      value={semester._id}
                      checked={formData.selectedSemesters.includes(semester._id)}
                      onChange={handleSemesterChange}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">Sem {semester.semesterNumber} ({semester.academicYear})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subjects */}
            {formData.selectedBranches.length > 0 && formData.selectedSemesters.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Subjects *</label>
                {subjects.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No subjects available for selected branches and semesters</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    {subjects.map(subject => (
                      <label key={subject._id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded">
                        <input
                          type="checkbox"
                          value={subject._id}
                          checked={formData.selectedSubjects.includes(subject._id)}
                          onChange={handleSubjectChange}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          {subject.name} ({subject.code})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">ℹ️ Temporary credentials:</span> A temporary password will be auto-generated and sent to the teacher's mobile number. The teacher will need to set a new password on first login.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/manage-users')}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Adding Teacher...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Add Teacher
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </>
    </AdminLayout>
  );
};

export default AddTeacher;
