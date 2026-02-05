import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const TeacherProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [subjects, setSubjects] = useState([]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        // Fetch assigned subjects details
        if (data.data.assignedSubjects && data.data.assignedSubjects.length > 0) {
          // Check if assignedSubjects are already populated objects or just IDs
          const firstSubject = data.data.assignedSubjects[0];
          if (typeof firstSubject === 'object' && firstSubject.name) {
            // Already populated - use directly
            setSubjects(data.data.assignedSubjects);
          } else {
            // Just IDs - fetch details
            fetchSubjects(data.data.assignedSubjects);
          }
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchSubjects = async (subjectIds) => {
    try {
      // Extract IDs if they're objects, otherwise use as-is
      const ids = subjectIds.map(item => typeof item === 'object' ? item._id : item);
      
      const subjectPromises = ids.map(id => 
        fetch(`/api/academic/subjects/${id}/public`)
          .then(res => res.json())
      );
      
      const results = await Promise.all(subjectPromises);
      const validSubjects = results
        .filter(r => r.success)
        .map(r => r.subject);
      setSubjects(validSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditToggle = () => {
    if (editMode) {
      setEditData({});
    } else {
      setEditData({
        name: profile?.name || '',
        qualifications: profile?.qualifications || '',
        experience: profile?.experience || ''
      });
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Profile updated successfully!');
        setProfile({ ...profile, ...editData });
        setEditMode(false);
      } else {
        alert('Error: ' + (data.message || 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Password changed successfully!');
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert('Error: ' + (data.message || 'Failed to change password'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-[#111318] dark:text-white min-h-screen">
      <Header />

      {/* Main Content */}
      <main className="pt-32 mesh-background min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white dark:bg-background-dark/50 border border-[#dcdee5] dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile?.name}</h1>
                    <p className="text-emerald-100">{profile?.email}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm flex-wrap">
                      <span className="px-3 py-1 bg-white/20 rounded-full">Teacher</span>
                      {profile?.mobile && (
                        <span className="px-3 py-1 bg-white/20 rounded-full">📱 {profile.mobile}</span>
                      )}
                      {subjects.length > 0 && (
                        <span className="px-3 py-1 bg-white/20 rounded-full">{subjects.length} Subjects Assigned</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleEditToggle}
                    className="px-6 py-2 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 border border-white/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              {/* Change Password Modal */}
              {showChangePassword && (
                <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-all"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
              
              {/* No Subjects Warning */}
              {subjects.length === 0 && (
                <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                  <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>No Subjects Assigned:</strong> You don't have any subjects assigned yet. Please contact your HOD or Admin to assign subjects, branches, and semesters to your profile.
                    </span>
                  </p>
                </div>
              )}
              
              {/* Assigned Subjects Section */}
              {subjects.length > 0 && (
                <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Assigned Subjects ({subjects.length})
                  </h3>
                  
                  {/* Teaching Overview */}
                  <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Teaching Across:</strong>{' '}
                      {[...new Set(subjects.map(s => s.branchId?.name).filter(Boolean))].join(', ') || 'N/A'} 
                      {' • '}
                      {[...new Set(subjects.map(s => s.semesterId?.semesterNumber).filter(Boolean))].map(n => `Sem ${n}`).join(', ') || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{subject.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Code: {subject.code}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {subject.branchId && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {subject.branchId.name || 'N/A'}
                                </span>
                              )}
                              {subject.semesterId && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                  Semester {subject.semesterId.semesterNumber || 'N/A'}
                                </span>
                              )}
                              {subject.credits && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  {subject.credits} Credits
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    <strong>Note:</strong> Subjects are assigned by HOD or Admin. Contact them to update your assignments.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg font-semibold"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{profile?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Mobile No.</label>
                  <p className="text-lg font-semibold">
                    {profile?.mobile || (
                      <span className="text-gray-400 text-base">Not provided</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Email</label>
                  <p className="text-lg font-semibold">{profile?.email}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Qualifications</label>
                  {editMode ? (
                    <textarea
                      value={editData.qualifications}
                      onChange={(e) => setEditData({...editData, qualifications: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg font-semibold"
                      rows="3"
                      placeholder="e.g., B.Tech in IT, M.Tech in Computer Science"
                    />
                  ) : (
                    <p className="text-lg font-semibold">
                      {profile?.qualifications || (
                        <span className="text-gray-400 text-base">Not provided</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Teaching Experience</label>
                  {editMode ? (
                    <textarea
                      value={editData.experience}
                      onChange={(e) => setEditData({...editData, experience: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg font-semibold"
                      rows="3"
                      placeholder="e.g., 8 years of teaching experience in Computer Science"
                    />
                  ) : (
                    <p className="text-lg font-semibold">
                      {profile?.experience || (
                        <span className="text-gray-400 text-base">Not provided</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {editMode ? (
                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-all shadow-lg"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-8 py-3 bg-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-400 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/teacher/dashboard')}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-background-dark/50 border-t border-[#dcdee5] dark:border-white/10 py-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2026 SmartAcademics. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Terms of Service</a>
              <a href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeacherProfile;
