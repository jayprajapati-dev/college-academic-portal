import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleLayout } from '../components';
import useRoleNav from '../hooks/useRoleNav';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [newRole, setNewRole] = useState('');
  const [permissionsMap, setPermissionsMap] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('new');
  const [adminForm, setAdminForm] = useState({ name: '', mobile: '', email: '' });
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCandidateId, setAdminCandidateId] = useState('');

  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [currentUser, setCurrentUser] = useState(storedUser);
  const role = currentUser?.role || 'teacher';
  const hasAdminAccess = currentUser?.role === 'admin' || currentUser?.adminAccess === true;
  const isAdminMode = location.pathname.startsWith('/admin');
  const navRole = isAdminMode ? 'admin' : role;
  const { navItems, loading: navLoading } = useRoleNav(navRole);
  const panelLabel = isAdminMode ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : 'Teacher Panel';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const fetchPermissionModules = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/permissions/modules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data?.success) {
        setPermissionsMap(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const scope = isAdminMode ? 'admin' : 'role';
      const response = await fetch(`/api/admin/users?page=1&limit=100&scope=${scope}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.data) {
        setUsers(data.data);
      } else if (response.ok && Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAdminMode]);

  useEffect(() => {
    if (isAdminMode && !hasAdminAccess) {
      navigate(`/${role}/dashboard`);
      return;
    }

    fetchUsers();
    if (hasAdminAccess && isAdminMode) {
      fetchPermissionModules();
    }
  }, [fetchPermissionModules, fetchUsers, hasAdminAccess, isAdminMode, navigate, role]);

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.mobile && u.mobile.includes(searchTerm))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        filtered = filtered.filter(u => u.role === 'admin' || u.adminAccess === true);
      } else {
        filtered = filtered.filter(u => u.role === roleFilter);
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleRoleChange = async (user, role) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.map(u => u._id === user._id ? { ...u, role } : u));
        setShowRoleModal(false);
        setSuccessMessage(`User role changed to ${role.toUpperCase()} successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to change role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setErrorMessage('Error changing user role');
    }
  };

  const handleStatusChange = async (user, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/user/${user._id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(users.map((u) => (u._id === user._id ? { ...u, status } : u)));
        setSuccessMessage(`User ${status === 'active' ? 'unblocked' : 'blocked'} successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorMessage('Error updating user status');
    }
  };

  const handleAdminAccessToggle = async (user, adminAccess) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}/admin-access`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminAccess })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(users.map((u) => (u._id === user._id ? { ...u, adminAccess } : u)));
        setSuccessMessage(adminAccess ? 'Admin access granted' : 'Admin access revoked');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update admin access');
      }
    } catch (error) {
      console.error('Error updating admin access:', error);
      setErrorMessage('Error updating admin access');
    }
  };

  const handleCreateAdmin = async () => {
    try {
      if (!adminForm.name || !adminForm.mobile) {
        setErrorMessage('Please provide name and mobile number');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/add-admin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminForm)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowAdminModal(false);
        setAdminForm({ name: '', mobile: '', email: '' });
        fetchUsers();
        setSuccessMessage('Admin created successfully. Share the temp password.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setErrorMessage('Error creating admin');
    }
  };

  const handlePromoteAdmin = async () => {
    const user = users.find((u) => u._id === adminCandidateId);
    if (!user) {
      setErrorMessage('Please select a user');
      return;
    }

    await handleAdminAccessToggle(user, true);
    setShowAdminModal(false);
    setAdminCandidateId('');
    setAdminSearch('');
  };

  const handlePermissionsSave = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/permissions`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions: selectedPermissions })
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, permissions: data.data.permissions } : u));
        setShowPermissionsModal(false);
        setSuccessMessage('Permissions updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setErrorMessage('Error updating permissions');
    }
  };


  const handleDeleteUser = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.filter(u => u._id !== user._id));
        setShowDeleteModal(false);
        setSuccessMessage('User deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrorMessage('Error deleting user');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      hod: 'bg-purple-100 text-purple-800',
      teacher: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      pending: 'bg-amber-50 text-amber-700 border border-amber-100',
      disabled: 'bg-slate-50 text-slate-700 border border-slate-100'
    };
    return colors[status] || colors.pending;
  };

  const getRoleLabel = (user) => {
    if (user.role === 'teacher' && user.adminAccess) return 'Teacher (Admin)';
    if (user.role === 'hod' && user.adminAccess) return 'HOD (Admin)';
    return user.role?.toUpperCase() || 'USER';
  };

  const roleOptions = useMemo(() => {
    if (isAdminMode) {
      return [
        { value: 'all', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'hod', label: 'HOD' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'student', label: 'Student' }
      ];
    }

    if (role === 'hod') {
      return [
        { value: 'all', label: 'All Roles' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'student', label: 'Student' }
      ];
    }

    return [
      { value: 'all', label: 'All Roles' },
      { value: 'student', label: 'Student' }
    ];
  }, [isAdminMode, role]);

  const canEditRole = (user) => isAdminMode && user.role !== 'student';
  const canToggleStudentBlock = (user) => isAdminMode && user.role === 'student';
  const canEditPermissions = (user) => isAdminMode && ['admin', 'hod', 'teacher'].includes(user.role);
  const canToggleAdminAccess = (user) => isAdminMode && ['teacher', 'hod'].includes(user.role);

  const adminCandidates = useMemo(() => {
    const term = adminSearch.trim().toLowerCase();
    return users.filter((u) => ['teacher', 'hod'].includes(u.role)).filter((u) => {
      if (!term) return true;
      return (
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.mobile?.includes(term)
      );
    });
  }, [adminSearch, users]);

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    setDetailError('');

    if (!isAdminMode) return;

    try {
      setDetailLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data?.success) {
        setSelectedUser(data.data);
      } else {
        setDetailError(data?.message || 'Failed to load user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setDetailError('Failed to load user details');
    } finally {
      setDetailLoading(false);
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleOpenPermissions = (user) => {
    const roleDefaults = permissionsMap[user.role] || [];
    const existing = Array.isArray(user.permissions) && user.permissions.length > 0
      ? user.permissions
      : roleDefaults;

    setSelectedUser(user);
    setSelectedPermissions(existing);
    setShowPermissionsModal(true);
  };

  if (loading) {
    return (
      <RoleLayout
        title="User Management"
        userName={currentUser?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={panelLabel}
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="User Management"
      userName={currentUser?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
    >
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-700 hover:text-red-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Professional Header */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">group</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isAdminMode
                ? 'Manage system users, roles, and access levels'
                : role === 'hod'
                  ? 'Manage branch teachers and students'
                  : 'View assigned students'}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search Bar */}
            <div className="flex-1 min-w-[250px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search by name, email or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 h-11 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium min-w-[140px]"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>

            {/* Add User Buttons (Role-Based) */}
            <div className="flex gap-3 ml-auto">
              {isAdminMode && (
                <>
                  <button
                    onClick={() => navigate('/admin/add-hod')}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all h-11"
                  >
                    <span className="material-symbols-outlined text-xl">badge</span>
                    Add HOD
                  </button>
                  <button
                    onClick={() => navigate('/admin/add-teacher')}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all h-11"
                  >
                    <span className="material-symbols-outlined text-xl">school</span>
                    Add Teacher
                  </button>
                  <button
                    onClick={() => setShowAdminModal(true)}
                    className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-slate-500/20 hover:opacity-90 transition-all h-11"
                  >
                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                    Add Admin
                  </button>
                </>
              )}
              {role === 'hod' && !isAdminMode && (
                <button
                  onClick={() => navigate('/hod/add-teacher')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all h-11"
                >
                  <span className="material-symbols-outlined text-xl">school</span>
                  Add Teacher
                </button>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">group</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Total</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Active</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.filter(u => u.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">schedule</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Pending</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.filter(u => u.status === 'pending').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">block</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Disabled</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.filter(u => u.status === 'disabled').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">{user._id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)} shadow-sm`}>
                            {getRoleLabel(user)}
                          </span>
                          {user.adminAccess && ['teacher', 'hod'].includes(user.role) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <p className="text-gray-900 font-medium">{user.email}</p>
                          <p className="text-gray-500">{user.mobile || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === 'active' ? 'bg-emerald-500' :
                            user.status === 'pending' ? 'bg-amber-500' :
                            'bg-gray-400'
                          }`}></div>
                          {user.status?.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {canEditRole(user) && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setShowRoleModal(true);
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Change Role"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          {canToggleStudentBlock(user) && (
                            <button
                              onClick={() => handleStatusChange(user, user.status === 'disabled' ? 'active' : 'disabled')}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title={user.status === 'disabled' ? 'Unblock Student' : 'Block Student'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m12.728 0L5.636 5.636M12 3v4m0 10v4" />
                              </svg>
                            </button>
                          )}
                          {canEditPermissions(user) && (
                            <button
                              onClick={() => handleOpenPermissions(user)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Permissions"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8v-2m0 2a2 2 0 100 4m0-4a2 2 0 110 4m12-8v-2m0 2a2 2 0 100 4m0-4a2 2 0 110 4" />
                              </svg>
                            </button>
                          )}
                          {canToggleAdminAccess(user) && (
                            <button
                              onClick={() => handleAdminAccessToggle(user, !user.adminAccess)}
                              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title={user.adminAccess ? 'Revoke Admin Access' : 'Grant Admin Access'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3zm0 0v3m0 4h.01M4 21h16a1 1 0 001-1v-2a7 7 0 10-14 0v2a1 1 0 001 1z" />
                              </svg>
                            </button>
                          )}
                          {isAdminMode && (
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No users found matching your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">
              Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span> ({filteredUsers.length} total users)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View User Details Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-cyan-500">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">User Overview</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Profile Details</h3>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {detailLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600" />
                </div>
              )}
              {!detailLoading && detailError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {detailError}
                </div>
              )}
              {!detailLoading && !detailError && (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-lg font-bold text-gray-900">{selectedUser.name}</p>
                      <p className="text-sm text-gray-500 break-all">{selectedUser.email}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(selectedUser.role)}`}>
                          {getRoleLabel(selectedUser)}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Mobile</p>
                      <p className="text-gray-900 font-semibold">{selectedUser.mobile || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Joined</p>
                      <p className="text-gray-900 font-semibold">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 sm:col-span-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase">User ID</p>
                      <p className="text-gray-900 font-mono text-sm break-all">{selectedUser._id}</p>
                    </div>
                    {['admin', 'hod', 'teacher'].includes(selectedUser.role) && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 sm:col-span-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase">Permissions</p>
                        <p className="text-gray-900 font-semibold text-sm">
                          {Array.isArray(selectedUser.permissions) && selectedUser.permissions.length > 0
                            ? selectedUser.permissions.join(', ')
                            : 'Default role permissions'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              {isAdminMode && selectedUser && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedUser(selectedUser);
                    setShowPermissionsModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#111318] text-white font-semibold hover:opacity-90"
                >
                  Edit Permissions
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showPermissionsModal && selectedUser && isAdminMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Edit Permissions</h3>
                <button onClick={() => setShowPermissionsModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-emerald-50 mt-2">{selectedUser.name} • {selectedUser.role?.toUpperCase()}</p>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Select the modules this user can access.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(permissionsMap[selectedUser.role] || []).map((moduleKey) => (
                  <label key={moduleKey} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(moduleKey)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedPermissions((prev) => {
                          if (checked) return [...prev, moduleKey];
                          return prev.filter((item) => item !== moduleKey);
                        });
                      }}
                      className="h-4 w-4"
                    />
                    {moduleKey}
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => setSelectedPermissions(permissionsMap[selectedUser.role] || [])}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Reset to Role Default
                </button>
                <button
                  onClick={() => setSelectedPermissions([])}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Clear Custom
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePermissionsSave}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:opacity-90"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && isAdminMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
              <h3 className="text-xl font-bold text-white">Change User Role</h3>
              <p className="text-sm text-white/90 mt-1">Update system access permissions for this user.</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-xs text-gray-500 mt-2">Current Role: <span className="font-semibold text-blue-600">{selectedUser.role?.toUpperCase()}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="hod">HOD - Department Management</option>
                  <option value="teacher">Teacher - Teaching Access</option>
                  <option value="student">Student - Student Portal</option>
                </select>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span><strong>Warning:</strong> Role changes take effect immediately. The user must re-login to see updated permissions.</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newRole === 'admin') {
                    setErrorMessage('Use Admin Access to grant admin privileges.');
                    return;
                  }
                  handleRoleChange(selectedUser, newRole);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && isAdminMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-500 to-orange-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Delete User</h3>
                <div className="p-2 bg-white/20 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">Are you sure you want to delete this user? This action cannot be undone.</p>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-xs text-red-800 flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span><strong>Permanent Action:</strong> All user data will be permanently deleted from the system.</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAdminModal && isAdminMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-900 to-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add Admin</h3>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-white/90 mt-1">Create new admin or promote existing HOD/Teacher.</p>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAdminTab('new')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'new' ? 'bg-[#111318] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  New Admin
                </button>
                <button
                  onClick={() => setAdminTab('existing')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'existing' ? 'bg-[#111318] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Promote Existing
                </button>
              </div>

              {adminTab === 'new' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input
                      value={adminForm.name}
                      onChange={(e) => setAdminForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter admin name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile *</label>
                    <input
                      value={adminForm.mobile}
                      onChange={(e) => setAdminForm((prev) => ({ ...prev, mobile: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
                    <input
                      value={adminForm.email}
                      onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="email@domain.com"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search HOD/Teacher</label>
                    <input
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Search by name, email, or mobile"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg">
                    {adminCandidates.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">No matching users</p>
                    ) : (
                      adminCandidates.map((u) => (
                        <label
                          key={u._id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-sm"
                        >
                          <input
                            type="radio"
                            name="adminCandidate"
                            checked={adminCandidateId === u._id}
                            onChange={() => setAdminCandidateId(u._id)}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email || '—'} • {u.role?.toUpperCase()}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              {adminTab === 'new' ? (
                <button
                  onClick={handleCreateAdmin}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:opacity-90"
                >
                  Create Admin
                </button>
              ) : (
                <button
                  onClick={handlePromoteAdmin}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:opacity-90"
                >
                  Promote
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </RoleLayout>
  );
};

export default UserManagement;
