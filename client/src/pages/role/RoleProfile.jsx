import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, LandingFrame, LoadingSpinner, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const isFallbackEmail = (email) => /^[0-9]{10}@college\.edu$/i.test(String(email || '').trim());

const RoleProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isWebsiteView = new URLSearchParams(location.search).get('view') === 'website';
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [profile, setProfile] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [branchLookup, setBranchLookup] = useState({});

  const isAdmin = role === 'admin';
  const isHod = role === 'hod';
  const isCoordinator = role === 'coordinator';
  const isTeacher = role === 'teacher';
  const panelLabel = isAdmin ? 'Admin Panel' : isHod ? 'HOD Panel' : isCoordinator ? 'Coordinator Panel' : 'Teacher Panel';

  const fetchSubjects = useCallback(async (subjectIds) => {
    try {
      const ids = subjectIds.map((item) => (typeof item === 'object' ? item._id : item)).filter(Boolean);
      if (ids.length === 0) return;
      const subjectPromises = ids.map((id) =>
        fetch(`/api/academic/subjects/${id}/public`).then((res) => res.json())
      );
      const results = await Promise.all(subjectPromises);
      const validSubjects = results.filter((r) => r.success).map((r) => r.subject);
      setSubjects(validSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.success) {
        navigate('/login');
        return;
      }

      setProfile(data.data);
      setRole(data.data.role || role);

      if (data.data.assignedSubjects && data.data.assignedSubjects.length > 0) {
        const firstSubject = data.data.assignedSubjects[0];
        if (typeof firstSubject === 'object' && firstSubject.name) {
          setSubjects(data.data.assignedSubjects);
        } else {
          fetchSubjects(data.data.assignedSubjects);
        }
      }
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [fetchSubjects, navigate, role]);

  useEffect(() => {
    fetchProfile();
    fetch('/api/academic/branches')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          const map = {};
          data.data.forEach((b) => {
            if (b._id) map[String(b._id)] = b.name || b.code || String(b._id);
          });
          setBranchLookup(map);
        }
      })
      .catch(() => {});
  }, [fetchProfile]);

  useEffect(() => {
    if (!emailNotice) return undefined;

    const timeoutId = setTimeout(() => {
      setEmailNotice('');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [emailNotice]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEditToggle = () => {
    setEmailNotice('');
    if (editMode) {
      setEditData({});
    } else {
      const profileEmail = String(profile?.email || '').trim();
      const shouldResetEmail = !profileEmail || (profile?.role !== 'student' && isFallbackEmail(profileEmail));
      const nextEditData = {
        name: profile?.name || '',
        email: shouldResetEmail ? '' : profileEmail
      };

      setEditData(nextEditData);
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication expired. Please login again.');
        setSaving(false);
        return;
      }

      const previousEmail = String(profile?.email || '').trim().toLowerCase();
      const nextEmail = String(editData?.email || '').trim().toLowerCase();
      const payload = { ...editData };

      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || `Error: ${response.status}`);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        alert(data.message || 'Failed to update profile');
        setSaving(false);
        return;
      }

      const savedProfile = data.data;
      setProfile(savedProfile);
      localStorage.setItem('user', JSON.stringify(savedProfile));
      setEditMode(false);

      if (nextEmail && nextEmail !== previousEmail) {
        setEmailNotice('✓ Email updated successfully');
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
      if (data.success) {
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = useMemo(() => {
    if (isAdmin) return 'Administrator';
    if (isHod) return 'Head of Department';
    if (isCoordinator) return 'Coordinator';
    return 'Teacher';
  }, [isAdmin, isHod, isCoordinator]);

  const assignedBranches = useMemo(() => {
    const rawCandidates = [
      ...(Array.isArray(profile?.branches) ? profile.branches : []),
      profile?.branch,
      profile?.department
    ].filter(Boolean);

    const seen = new Set();
    return rawCandidates
      .map((item) => {
        if (typeof item === 'object') {
          const key = String(item._id || item.id || item.code || item.name || '').trim();
          const label = String(item.name || item.code || '').trim();
          if (!key || !label || seen.has(key)) return null;
          seen.add(key);
          return label;
        }

        // Plain string — try branchLookup map first, fallback to the raw value
        const idStr = String(item).trim();
        if (!idStr) return null;
        if (seen.has(idStr)) return null;
        seen.add(idStr);
        return branchLookup[idStr] || null; // skip if not resolved yet
      })
      .filter(Boolean);
  }, [profile, branchLookup]);

  const visibleEmail = useMemo(() => {
    const rawEmail = String(profile?.email || '').trim();
    if (!rawEmail) return '—';
    if (profile?.role !== 'student' && isFallbackEmail(rawEmail)) return '—';
    return rawEmail;
  }, [profile]);

  const emailConfigured = useMemo(() => visibleEmail !== '—', [visibleEmail]);

  const handleSaveEmailOnly = async () => {
    const emailToSave = String(editData?.email || '').trim();
    if (!emailToSave) {
      alert('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToSave)) {
      alert('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication expired. Please login again.');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: emailToSave })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || `Error: ${response.status}`);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        alert(data.message || 'Failed to save email');
        setSaving(false);
        return;
      }

      // Verify email was actually saved in response
      const savedProfile = data.data;
      const savedEmail = String(savedProfile?.email || '').trim().toLowerCase();
      
      if (savedEmail !== emailToSave.toLowerCase()) {
        console.warn('Email mismatch:', { saved: savedEmail, attempted: emailToSave.toLowerCase() });
        alert(`Email validation failed. ${emailToSave} was rejected by the server. Please verify the email format and try again.`);
        setSaving(false);
        return;
      }

      // Update profile state with the complete returned data
      setProfile(savedProfile);
      localStorage.setItem('user', JSON.stringify(savedProfile));
      setEmailNotice('✓ Email added successfully');
      
      // Clear the email input field with updated profile name
      setEditData(prev => ({ ...prev, email: '' }));
      
      setSaving(false);
      alert('✓ Email saved successfully!');
    } catch (error) {
      console.error('Error saving email:', error);
      alert(`Error: ${error.message || 'Failed to save email'}`);
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
          notifications={[]}
        >
          <div className="max-w-6xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </LandingFrame>
      );
    }

    return (
      <RoleLayout
        title="Profile"
        userName={profile?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={panelLabel}
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </RoleLayout>
    );
  }

  const profileContent = (
    <div className={`${isWebsiteView ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : 'px-3 sm:px-4 py-4 sm:py-6'}`}>
      {/* Header Card */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-md">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white truncate">{profile?.name || 'User'}</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 truncate">
                {emailConfigured ? visibleEmail : 'Email not configured yet'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-xs font-semibold whitespace-nowrap">{roleLabel}</span>
                {profile?.mobile && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/15 text-xs font-semibold whitespace-nowrap">{profile.mobile}</span>
                )}
                {isTeacher && subjects.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/15 text-xs font-semibold whitespace-nowrap">
                    {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleEditToggle}
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-gray-100 shadow-md text-sm sm:text-base flex-1 sm:flex-none"
            >
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
            <Button
              onClick={() => setShowChangePassword((prev) => !prev)}
              variant="ghost"
              className="bg-white/10 border border-white/30 text-white hover:bg-white/20 text-sm sm:text-base flex-1 sm:flex-none"
            >
              Password
            </Button>
          </div>
        </div>
      </section>

      {showChangePassword && (
        <div className="rounded-2xl bg-white shadow-md p-4 sm:p-6 mb-6 border border-slate-100">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 flex-1 sm:flex-none text-sm sm:text-base">
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="bg-slate-100 text-slate-900 hover:bg-slate-200 flex-1 sm:flex-none text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Information */}
      <div className="rounded-2xl bg-white shadow-md p-4 sm:p-6 mb-6 border border-slate-100">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            {editMode ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Enter full name"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900 font-semibold">{profile?.name || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            {editMode ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-3">
                <Input
                  type="email"
                  value={editData?.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="mb-2"
                />
                <p className="text-xs text-slate-600 mb-3">
                  {emailConfigured
                    ? 'Update email along with name, then click Save Changes.'
                    : 'Add email to login with email or continue with mobile.'}
                </p>
              </div>
            ) : !emailConfigured ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-3">
                <Input
                  type="email"
                  value={editData?.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="mb-2"
                />
                <p className="text-xs text-slate-600 mb-3">
                  Add email to login with email or continue with mobile.
                </p>
                <Button 
                  onClick={handleSaveEmailOnly} 
                  disabled={saving || !editData?.email?.trim()} 
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xs sm:text-sm py-2"
                >
                  {saving ? 'Saving...' : 'Save Email'}
                </Button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4">
                <p className="text-sm sm:text-base text-slate-900 font-semibold">{visibleEmail}</p>
                {emailNotice ? <p className="text-xs text-emerald-600 mt-1">{emailNotice}</p> : null}
              </div>
            )}
          </div>
        </div>
        {editMode && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-slate-900 hover:bg-slate-800 flex-1 text-sm sm:text-base">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleEditToggle}
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 flex-1 text-sm sm:text-base"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Role Details */}
      <div className="rounded-2xl bg-white shadow-md p-4 sm:p-6 mb-6 border border-slate-100">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Role Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 sm:p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Role</p>
            <p className="text-sm sm:text-base text-slate-900 font-bold">{roleLabel}</p>
          </div>
          {isHod && (
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">Assigned Branches</p>
                {assignedBranches.length > 0 ? (
                  <div>
                    <p className="text-sm sm:text-base font-bold text-slate-900 mb-2">{assignedBranches.length} branch{assignedBranches.length !== 1 ? 'es' : ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {assignedBranches.map((branchName, index) => (
                        <span
                          key={`${branchName}-${index}`}
                          className="px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                        >
                          {index + 1}. {branchName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-600">No assignment found</p>
                )}
              </div>
            </div>
          )}
          {isTeacher && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">Assigned Subjects</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">{subjects.length || 0} subject{subjects.length !== 1 ? 's' : ''}</p>
            </div>
          )}
          {isAdmin && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">Access Level</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">Full Admin</p>
            </div>
          )}
        </div>
      </div>

      {isTeacher && subjects.length > 0 && (
        <div className="rounded-2xl bg-white shadow-md p-4 sm:p-6 border border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Assigned Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <div key={subject._id || subject.id} className="p-3 border border-slate-200 rounded-xl hover:shadow-md hover:border-slate-300 transition-all">
                <p className="font-semibold text-sm text-slate-900">{subject.name}</p>
                <p className="text-xs text-slate-500 mt-1">{subject.code || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (isWebsiteView) {
    return (
      <LandingFrame
        isLoggedIn={isLoggedIn}
        currentUser={profile || storedUser}
        userProfile={profile}
        notifications={[]}
      >
        {profileContent}
      </LandingFrame>
    );
  }

  return (
    <RoleLayout
      title="Profile"
      userName={profile?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
    >
      {profileContent}
    </RoleLayout>
  );
};

export default RoleProfile;
