import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const StudentProfile = () => {
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

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      console.log('Profile data received:', data); // Debug log
      if (data.success) {
        setProfile(data.data);
        console.log('Branch:', data.data?.branch); // Debug log
        console.log('Semester:', data.data?.semester); // Debug log
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditToggle = () => {
    if (editMode) {
      setEditData({});
    } else {
      setEditData({
        name: profile?.name || '',
        semester: profile?.semester?._id || ''
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile?.name}</h1>
                    <p className="text-blue-100">{profile?.email}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="px-3 py-1 bg-white/20 rounded-full">Student</span>
                      <span className="px-3 py-1 bg-white/20 rounded-full">{profile?.enrollmentNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleEditToggle}
                    className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
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
                <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
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
              
              {(!profile?.branch || !profile?.semester) && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>Incomplete Profile:</strong> Some profile information is missing. Please contact your administrator to complete your profile setup with branch and semester details.
                    </span>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-semibold"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{profile?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Enrollment Number</label>
                  <p className="text-lg font-semibold">{profile?.enrollmentNumber || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Mobile No.</label>
                  <p className="text-lg font-semibold">
                    {profile?.mobile || (
                      <span className="text-gray-400 text-base">Not provided</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Branch</label>
                  <p className="text-lg font-semibold">
                    {profile?.branch?.name || (
                      <span className="text-gray-400 text-base">Not assigned yet</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Semester</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.semester ? `Semester ${profile?.semester?.semesterNumber}` : ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-lg font-semibold cursor-not-allowed"
                    />
                  ) : (
                    <p className="text-lg font-semibold">
                      {profile?.semester ? (
                        `Semester ${profile.semester.semesterNumber}`
                      ) : (
                        <span className="text-gray-400 text-base">Not assigned yet</span>
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
                      className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-lg"
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
                    onClick={() => navigate('/')}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    Back to Study Materials
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

export default StudentProfile;
