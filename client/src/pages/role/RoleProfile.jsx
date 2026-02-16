import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, LoadingSpinner, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleProfile = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);
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

  const isAdmin = role === 'admin';
  const isHod = role === 'hod';
  const isCoordinator = role === 'coordinator';
  const isTeacher = role === 'teacher';
  const panelLabel = isAdmin ? 'Admin Panel' : isHod ? 'HOD Panel' : isCoordinator ? 'Coordinator Panel' : 'Teacher Panel';

  const getLabel = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || value.code || '';
  };

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
  }, [fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();
      if (data.success) {
        setProfile({ ...profile, ...editData });
        setEditMode(false);
      } else {
        alert(data.message || 'Failed to update profile');
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

  if (loading) {
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

  return (
    <RoleLayout
      title="Profile"
      userName={profile?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#0b1220] to-[#1f3a8a] text-white p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-black">{profile?.name || 'User'}</h1>
                <p className="text-sm text-blue-100">{profile?.email || '—'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-white/15">{roleLabel}</span>
                  {profile?.mobile && (
                    <span className="px-3 py-1 rounded-full bg-white/15">{profile.mobile}</span>
                  )}
                  {isTeacher && subjects.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-white/15">
                      {subjects.length} Subjects Assigned
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleEditToggle}
                variant="secondary"
                className="bg-white text-[#0b1220] hover:bg-gray-100 shadow-lg shadow-black/10"
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button
                onClick={() => setShowChangePassword((prev) => !prev)}
                variant="ghost"
                className="bg-white/10 border border-white/40 text-white hover:bg-white/20"
              >
                Change Password
              </Button>
            </div>
          </div>
        </section>

        {showChangePassword && (
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Current Password</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving} className="bg-[#111318]">
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="bg-gray-200 text-gray-900 hover:bg-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card title="Profile Information" subtitle="Keep your personal details updated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
              {editMode ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{profile?.name || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
              <p className="text-gray-900 font-semibold">{profile?.email || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Qualifications</label>
              {editMode ? (
                <Input
                  value={editData.qualifications}
                  onChange={(e) => setEditData({ ...editData, qualifications: e.target.value })}
                  placeholder="Enter qualifications"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{profile?.qualifications || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Experience</label>
              {editMode ? (
                <Input
                  value={editData.experience}
                  onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
                  placeholder="Enter experience"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{profile?.experience || '—'}</p>
              )}
            </div>
          </div>
          {editMode && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#111318]">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleEditToggle}
                className="bg-gray-200 text-gray-900 hover:bg-gray-300"
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>

        <Card title="Role Details" subtitle="Role-specific information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Role</label>
              <p className="text-gray-900 font-semibold">{roleLabel}</p>
            </div>
            {isHod && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Branch</label>
                <p className="text-gray-900 font-semibold">{getLabel(profile?.branch) || '—'}</p>
              </div>
            )}
            {isTeacher && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Assigned Subjects</label>
                <p className="text-gray-900 font-semibold">{subjects.length || 0}</p>
              </div>
            )}
            {isAdmin && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Access</label>
                <p className="text-gray-900 font-semibold">Full system administration</p>
              </div>
            )}
          </div>
        </Card>

        {isTeacher && subjects.length > 0 && (
          <Card title="Assigned Subjects" subtitle="Subjects currently linked to your account">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <div key={subject._id || subject.id} className="p-4 border border-[#E6E9EF] rounded-2xl">
                  <p className="font-semibold text-gray-900">{subject.name}</p>
                  <p className="text-sm text-gray-500">{subject.code || '—'}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </RoleLayout>
  );
};

export default RoleProfile;
