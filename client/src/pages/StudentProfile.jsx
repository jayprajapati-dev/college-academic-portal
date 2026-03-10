import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingFrame, StudentLayout } from '../components';

const StudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isWebsiteView = new URLSearchParams(location.search).get('view') === 'website';
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (_) {
      return {};
    }
  })();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const [profile, setProfile] = useState(null);
  const [websiteNotifications, setWebsiteNotifications] = useState([]);
  const [introVisible, setIntroVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!data.success) {
        navigate('/login');
        return;
      }

      setProfile(data.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchAcademicOptions = useCallback(async () => {
    try {
      const [branchesRes, semestersRes] = await Promise.all([
        fetch('/api/academic/branches'),
        fetch('/api/academic/semesters')
      ]);
      const branchesData = await branchesRes.json();
      const semestersData = await semestersRes.json();

      setBranches(Array.isArray(branchesData?.data) ? branchesData.data : []);
      setSemesters(Array.isArray(semestersData?.data) ? semestersData.data : []);
    } catch (error) {
      console.error('Error loading branch/semester options:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAcademicOptions();
  }, [fetchAcademicOptions, fetchProfile]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let active = true;
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (active && data?.success && Array.isArray(data.data)) {
          setWebsiteNotifications(data.data);
        }
      } catch (_) {
        if (active) setWebsiteNotifications([]);
      }
    };

    loadNotifications();
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setIntroVisible(true), 40);
    return () => clearTimeout(timer);
  }, [loading]);

  const recentActivities = useMemo(() => {
    const source = Array.isArray(websiteNotifications) ? websiteNotifications : [];
    const fromNotifications = source.slice(0, 6).map((item, idx) => ({
      id: item._id || `n-${idx}`,
      icon: 'notifications',
      title: item.title || 'Notification received',
      subtitle: item.message || 'New update available',
      time: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now',
      link: item.actionUrl || item.link || '/notices'
    }));

    if (fromNotifications.length > 0) return fromNotifications;

    return [
      {
        id: 'fallback-1',
        icon: 'person',
        title: 'Profile synced',
        subtitle: 'Your student profile is up to date',
        time: 'Today',
        link: '/student/profile'
      },
      {
        id: 'fallback-2',
        icon: 'event_note',
        title: 'Dashboard ready',
        subtitle: 'Check your latest subjects and tasks',
        time: 'Today',
        link: '/student/dashboard'
      }
    ];
  }, [websiteNotifications]);

  const activityStrip = (
    <section className="bg-white rounded-2xl border border-[#E6E9EF] shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-[#EEF2F7] flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#111827]">Recent Activity</h3>
        <span className="text-[11px] font-semibold text-[#64748B]">Live</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-3 min-w-max p-4">
          {recentActivities.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.link)}
              className="text-left w-72 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 hover:border-[#194ce6]/40 transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#194ce6]">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{item.title}</p>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.subtitle}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-2">{item.time}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.name),
      Boolean(profile.email),
      Boolean(profile.mobile),
      Boolean(profile.branch),
      Boolean(profile.semester),
      Boolean(profile.enrollmentNumber)
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  const handleEditToggle = () => {
    if (editMode) {
      setEditData({});
      setEditMode(false);
      return;
    }

    setEditData({
      name: profile?.name || '',
      mobile: profile?.mobile || '',
      branch: profile?.branch?._id || '',
      semester: profile?.semester?._id || ''
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Failed to update profile');
        return;
      }

      await fetchProfile();
      setEditMode(false);
      setEditData({});
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
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Failed to change password');
        return;
      }

      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    if (isWebsiteView) {
      return (
        <LandingFrame
          isLoggedIn={isLoggedIn}
          currentUser={storedUser}
          userProfile={profile}
          notifications={websiteNotifications}
        >
          <div className="max-w-6xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#194ce6]" />
          </div>
        </LandingFrame>
      );
    }

    return (
      <StudentLayout title="Profile" onLogout={handleLogout} userName={profile?.name || 'Student'}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#194ce6]" />
        </div>
      </StudentLayout>
    );
  }

  const dashboardProfileContent = (
      <div className={`max-w-6xl mx-auto space-y-6 transition-all duration-500 ${introVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#194ce6] text-white px-8 py-8 shadow-xl shadow-[#194ce6]/20">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[170px]">account_circle</span>
          </div>

          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-center text-3xl font-black">
                {(profile?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{profile?.name || 'Student'}</h1>
                <p className="text-blue-100 mt-1">{profile?.email || 'No email available'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20">Student</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                    {profile?.enrollmentNumber || 'Enrollment N/A'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                    {profile?.branch?.name || 'Branch not assigned'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                    {profile?.semester ? `Semester ${profile.semester.semesterNumber}` : 'Semester not assigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Profile Completion</span>
                  <span>{profileCompletion}%</span>
                </div>
                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-blue-100">
                  Keep your details updated for smooth exam, timetable and notice access.
                </p>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-blue-100 font-semibold">Student Media Card</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{profile?.enrollmentNumber || 'Enrollment N/A'}</p>
                    <p className="text-xs text-blue-100">ID visible across modules</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {activityStrip}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <article className="bg-white rounded-2xl border border-[#E6E9EF] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">Profile Information</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Manage your personal and academic details.</p>
                </div>
                <button
                  onClick={handleEditToggle}
                  className="h-10 px-4 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                    />
                  ) : (
                    <p className="text-base font-semibold text-[#111827]">{profile?.name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Enrollment Number</label>
                  <p className="text-base font-semibold text-[#111827]">{profile?.enrollmentNumber || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Mobile</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={editData.mobile || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditData((prev) => ({ ...prev, mobile: value }));
                      }}
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                      placeholder="Enter mobile number"
                    />
                  ) : (
                    <p className="text-base font-semibold text-[#111827]">{profile?.mobile || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Branch</label>
                  {editMode ? (
                    <select
                      value={editData.branch || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, branch: e.target.value }))}
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} {branch.code ? `(${branch.code})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-base font-semibold text-[#111827]">{profile?.branch?.name || 'Not assigned yet'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Semester</label>
                  {editMode ? (
                    <select
                      value={editData.semester || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, semester: e.target.value }))}
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                    >
                      <option value="">Select semester</option>
                      {semesters.map((semester) => (
                        <option key={semester._id} value={semester._id}>
                          Semester {semester.semesterNumber}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-base font-semibold text-[#111827]">
                      {profile?.semester ? `Semester ${profile.semester.semesterNumber}` : 'Not assigned yet'}
                    </p>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex flex-wrap gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="h-10 px-5 rounded-lg bg-[#194ce6] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="h-10 px-5 rounded-lg bg-[#F3F4F6] text-[#111827] text-sm font-semibold hover:bg-[#E5E7EB]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </article>

            {showChangePassword && (
              <article className="bg-white rounded-2xl border border-[#E6E9EF] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={6}
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                      className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-wrap gap-3 mt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-10 px-5 rounded-lg bg-[#194ce6] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="h-10 px-5 rounded-lg bg-[#F3F4F6] text-[#111827] text-sm font-semibold hover:bg-[#E5E7EB]"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </article>
            )}
          </div>

          <div className="space-y-6">
            <article className="bg-white rounded-2xl border border-[#E6E9EF] shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#111827]">Account Actions</h3>
              <p className="text-sm text-[#6B7280] mt-1">Manage security and navigation quickly.</p>

              <div className="mt-5 space-y-3">
                <button
                  onClick={() => setShowChangePassword((prev) => !prev)}
                  className="w-full h-11 px-4 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:opacity-90"
                >
                  {showChangePassword ? 'Hide Password Form' : 'Change Password'}
                </button>

                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="w-full h-11 px-4 rounded-lg bg-[#F3F4F6] text-[#111827] text-sm font-semibold hover:bg-[#E5E7EB]"
                >
                  Back to Dashboard
                </button>
              </div>
            </article>

            <article className="bg-white rounded-2xl border border-[#E6E9EF] shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#111827]">Student Snapshot</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#6B7280]">Branch</span>
                  <span className="font-semibold text-right">{profile?.branch?.name || 'Not assigned'}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#6B7280]">Semester</span>
                  <span className="font-semibold text-right">
                    {profile?.semester ? `Semester ${profile.semester.semesterNumber}` : 'Not assigned'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#6B7280]">Enrollment</span>
                  <span className="font-semibold text-right">{profile?.enrollmentNumber || 'N/A'}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#6B7280]">Mobile</span>
                  <span className="font-semibold text-right">{profile?.mobile || 'Not provided'}</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
  );

  const websiteProfileContent = (
    <div className={`max-w-6xl mx-auto px-6 py-10 space-y-8 transition-all duration-500 ${introVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <section className="relative overflow-hidden rounded-[28px] border border-white/30 bg-gradient-to-r from-[#0F172A] via-[#1D4ED8] to-[#194ce6] text-white p-8 shadow-2xl shadow-[#194ce6]/25">
        <div className="absolute -right-6 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-6 bottom-4 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[160px]">school</span>
        </div>

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-3xl bg-white/15 border border-white/35 flex items-center justify-center text-4xl font-black">
              {(profile?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100 font-semibold">Student Account</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black leading-tight">{profile?.name || 'Student'}</h1>
              <p className="text-blue-100 mt-1">{profile?.email || 'No email available'}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/30">{profile?.enrollmentNumber || 'Enrollment N/A'}</span>
                <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/30">{profile?.branch?.name || 'Branch not assigned'}</span>
                <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/30">{profile?.semester ? `Semester ${profile.semester.semesterNumber}` : 'Semester not assigned'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/10 border border-white/25 p-5">
              <p className="text-sm font-semibold">Profile Completion</p>
              <p className="text-3xl font-black mt-1">{profileCompletion}%</p>
              <div className="mt-3 h-2.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-3 text-xs text-blue-100">Your profile powers dashboard recommendations, notices, and exam visibility.</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/25 p-5">
              <p className="text-xs uppercase tracking-wide text-blue-100 font-semibold">Student Media Card</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{profile?.enrollmentNumber || 'Enrollment N/A'}</p>
                  <p className="text-xs text-blue-100">Verified student identity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {activityStrip}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="xl:col-span-2 rounded-3xl border border-[#E2E8F0] bg-white/95 backdrop-blur p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#0F172A]">Personal and Academic Profile</h2>
              <p className="text-sm text-[#64748B] mt-1">Landing experience style with real-time dashboard logic.</p>
            </div>
            <button
              onClick={handleEditToggle}
              className="h-10 px-4 rounded-lg bg-[#0F172A] text-white text-sm font-semibold hover:opacity-90"
            >
              {editMode ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Full Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                />
              ) : (
                <p className="text-base font-semibold text-[#111827]">{profile?.name || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Enrollment Number</label>
              <p className="text-base font-semibold text-[#111827]">{profile?.enrollmentNumber || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Mobile</label>
              {editMode ? (
                <input
                  type="tel"
                  value={editData.mobile || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditData((prev) => ({ ...prev, mobile: value }));
                  }}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                  placeholder="Enter mobile number"
                />
              ) : (
                <p className="text-base font-semibold text-[#111827]">{profile?.mobile || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Branch</label>
              {editMode ? (
                <select
                  value={editData.branch || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, branch: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name} {branch.code ? `(${branch.code})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-base font-semibold text-[#111827]">{profile?.branch?.name || 'Not assigned yet'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Semester</label>
              {editMode ? (
                <select
                  value={editData.semester || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, semester: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
                >
                  <option value="">Select semester</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Semester {semester.semesterNumber}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-base font-semibold text-[#111827]">
                  {profile?.semester ? `Semester ${profile.semester.semesterNumber}` : 'Not assigned yet'}
                </p>
              )}
            </div>
          </div>

          {editMode && (
            <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex flex-wrap gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-[#194ce6] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleEditToggle}
                className="h-10 px-5 rounded-lg bg-[#F3F4F6] text-[#111827] text-sm font-semibold hover:bg-[#E5E7EB]"
              >
                Cancel
              </button>
            </div>
          )}
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-[#E2E8F0] bg-white/95 backdrop-blur p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#0F172A]">Account Controls</h3>
            <p className="text-sm text-[#64748B] mt-1">Security and access actions.</p>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => setShowChangePassword((prev) => !prev)}
                className="w-full h-11 px-4 rounded-lg bg-[#0F172A] text-white text-sm font-semibold hover:opacity-90"
              >
                {showChangePassword ? 'Hide Password Form' : 'Change Password'}
              </button>

              <button
                onClick={() => navigate('/student/dashboard')}
                className="w-full h-11 px-4 rounded-lg bg-[#F1F5F9] text-[#111827] text-sm font-semibold hover:bg-[#E2E8F0]"
              >
                Go to Dashboard
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-[#E2E8F0] bg-white/95 backdrop-blur p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#0F172A]">Snapshot</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#6B7280]">Branch</span>
                <span className="font-semibold text-right">{profile?.branch?.name || 'Not assigned'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#6B7280]">Semester</span>
                <span className="font-semibold text-right">
                  {profile?.semester ? `Semester ${profile.semester.semesterNumber}` : 'Not assigned'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#6B7280]">Enrollment</span>
                <span className="font-semibold text-right">{profile?.enrollmentNumber || 'N/A'}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {showChangePassword && (
        <section className="rounded-3xl border border-[#E2E8F0] bg-white/95 backdrop-blur p-6 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
                className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#194ce6]/20"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3 mt-1">
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-[#194ce6] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="h-10 px-5 rounded-lg bg-[#F3F4F6] text-[#111827] text-sm font-semibold hover:bg-[#E5E7EB]"
              >
                Close
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );

  if (isWebsiteView) {
    return (
      <LandingFrame
        isLoggedIn={isLoggedIn}
        currentUser={storedUser}
        userProfile={profile}
        notifications={websiteNotifications}
      >
        {websiteProfileContent}
      </LandingFrame>
    );
  }

  return (
    <StudentLayout title="Profile" onLogout={handleLogout} userName={profile?.name || 'Student'}>
      {dashboardProfileContent}
    </StudentLayout>
  );
};

export default StudentProfile;
