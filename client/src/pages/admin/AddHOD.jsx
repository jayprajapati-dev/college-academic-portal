import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const AddHOD = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    selectedBranches: [],
    selectedSemesters: [],
    selectedSubjects: []
  });

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Only Admin can add HOD
  useEffect(() => {
    if (currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser.role, navigate]);

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

      const response = await axios.post('/api/admin/hods', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('HOD added successfully! Temporary credentials sent.');
        setTimeout(() => {
          navigate('/admin/manage-users');
        }, 2000);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        setError(error.response?.data?.message || 'Error adding HOD');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add HOD" onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New HOD</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Create a new HOD account with department and subject assignment</p>

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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter HOD name"
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="1234567890"
              />
            </div>

            {/* Branches */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assign Branches *</label>
              <div className="grid grid-cols-2 gap-3">
                {branches.map(branch => (
                  <label key={branch._id} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      value={branch._id}
                      checked={formData.selectedBranches.includes(branch._id)}
                      onChange={handleBranchChange}
                      className="w-4 h-4 text-purple-500 rounded"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{branch.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Semesters */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assign Semesters *</label>
              <div className="grid grid-cols-2 gap-3">
                {semesters.map(semester => (
                  <label key={semester._id} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      value={semester._id}
                      checked={formData.selectedSemesters.includes(semester._id)}
                      onChange={handleSemesterChange}
                      className="w-4 h-4 text-purple-500 rounded"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">Sem {semester.semesterNumber} ({semester.academicYear})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subjects (Optional) */}
            {formData.selectedBranches.length > 0 && formData.selectedSemesters.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Assign Subjects <span className="text-gray-500">(Optional)</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">HOD can also add more subjects later</p>
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
                          className="w-4 h-4 text-purple-500 rounded"
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
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <span className="font-semibold">ℹ️ Temporary credentials:</span> A temporary password will be auto-generated and sent to the HOD's mobile number. The HOD will need to set a new password on first login.
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Adding HOD...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Add HOD
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddHOD;
