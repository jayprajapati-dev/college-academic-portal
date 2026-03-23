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

  // Auto-dismiss toasts
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAddHodModal, setShowAddHodModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [adminTab, setAdminTab] = useState('new');
  const [adminForm, setAdminForm] = useState({ name: '', mobile: '', email: '' });
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCandidateId, setAdminCandidateId] = useState('');
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [hodSubjects, setHodSubjects] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [addHodLoading, setAddHodLoading] = useState(false);
  const [addTeacherLoading, setAddTeacherLoading] = useState(false);
  const [addHodError, setAddHodError] = useState('');
  const [addTeacherError, setAddTeacherError] = useState('');
  const [showTempCredentialModal, setShowTempCredentialModal] = useState(false);
  const [tempCredentialData, setTempCredentialData] = useState({
    role: '',
    name: '',
    mobile: '',
    tempPassword: ''
  });
  const [hodForm, setHodForm] = useState({
    name: '',
    mobile: '',
    selectedBranches: [],
    selectedSemesters: [],
    selectedSubjects: []
  });
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    mobile: '',
    selectedBranches: [],
    selectedSemesters: [],
    selectedSubjects: []
  });
  const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
  const [coordinatorForm, setCoordinatorForm] = useState({
    branchId: '',
    semesterIds: [],
    academicYear: '',
    validFrom: '',
    validTill: ''
  });
  const [showModifyHodModal, setShowModifyHodModal] = useState(false);
  const [modifyHodUser, setModifyHodUser] = useState(null);
  const [modifyHodBranches, setModifyHodBranches] = useState([]);
  const [modifyHodLoading, setModifyHodLoading] = useState(false);
  const [modifyHodError, setModifyHodError] = useState('');

  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [currentUser, setCurrentUser] = useState(storedUser);
  const role = currentUser?.role || 'teacher';
  const hasAdminAccess = currentUser?.role === 'admin' || currentUser?.adminAccess === true;
  const isAdminMode = location.pathname.startsWith('/admin');
  const navRole = isAdminMode ? 'admin' : role;
  const { navItems, loading: navLoading } = useRoleNav(navRole);
  const panelLabel = isAdminMode ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : role === 'coordinator' ? 'Coordinator Panel' : 'Teacher Panel';
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Academic Assignment Modal State
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [academicForm, setAcademicForm] = useState({
    branch: '',
    semester: '',
    status: 'active'
  });

  // Profile Update Required State
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const [profileUpdateAction, setProfileUpdateAction] = useState('single'); // 'single' or 'bulk'

  const toDateInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

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

  const fetchAcademicMeta = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [branchesRes, semestersRes] = await Promise.all([
        fetch('/api/academic/branches', { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
        fetch('/api/academic/semesters', { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json())
      ]);

      if (branchesRes?.success) setBranches(branchesRes.data || []);
      if (semestersRes?.success) setSemesters(semestersRes.data || []);
    } catch (error) {
      console.error('Error fetching academic metadata:', error);
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
    if (isAdminMode || role === 'hod') {
      fetchAcademicMeta();
    }
  }, [fetchAcademicMeta, fetchPermissionModules, fetchUsers, hasAdminAccess, isAdminMode, navigate, role]);

  const getUserBranchIds = (user) => {
    if (!user) return [];
    const ids = [];
    if (user.branch) ids.push(user.branch._id || user.branch);
    if (user.department) ids.push(user.department._id || user.department);
    if (Array.isArray(user.branches)) ids.push(...user.branches.map((b) => b?._id || b));
    return ids.filter(Boolean).map(String);
  };

  const getUserSemesterIds = (user) => {
    if (!user) return [];
    const ids = [];
    if (user.semester) ids.push(user.semester._id || user.semester);
    if (Array.isArray(user.semesters)) ids.push(...user.semesters.map((s) => s?._id || s));
    return ids.filter(Boolean).map(String);
  };

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

    if (branchFilter) {
      filtered = filtered.filter((u) => getUserBranchIds(u).includes(String(branchFilter)));
    }

    if (semesterFilter) {
      filtered = filtered.filter((u) => getUserSemesterIds(u).includes(String(semesterFilter)));
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter, branchFilter, semesterFilter]);

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
      } else {
        setErrorMessage(data.message || 'Failed to update admin access');
      }
    } catch (error) {
      console.error('Error updating admin access:', error);
      setErrorMessage('Error updating admin access');
    }
  };

  const handleOpenCoordinatorModal = (user) => {
    setSelectedUser(user);
    const existing = user?.coordinator || {};
    setCoordinatorForm({
      branchId: existing.branch || '',
      semesterIds: Array.isArray(existing.semesters) ? existing.semesters : [],
      academicYear: existing.academicYear || '',
      validFrom: toDateInputValue(existing.validFrom),
      validTill: toDateInputValue(existing.validTill)
    });
    setShowCoordinatorModal(true);
  };

  const handleAssignCoordinator = async () => {
    if (!selectedUser) return;
    if (!coordinatorForm.branchId || coordinatorForm.semesterIds.length === 0) {
      setErrorMessage('Please select branch and at least one semester');
      return;
    }
    if (!coordinatorForm.academicYear) {
      setErrorMessage('Please provide academic year');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/coordinator`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branchId: coordinatorForm.branchId,
          semesterIds: coordinatorForm.semesterIds,
          academicYear: coordinatorForm.academicYear,
          validFrom: coordinatorForm.validFrom,
          validTill: coordinatorForm.validTill
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowCoordinatorModal(false);
        setSuccessMessage('Coordinator assigned successfully');
        fetchUsers();
      } else {
        setErrorMessage(data.message || 'Failed to assign coordinator');
      }
    } catch (error) {
      console.error('Error assigning coordinator:', error);
      setErrorMessage('Error assigning coordinator');
    }
  };

  const handleRevokeCoordinator = async (user) => {
    if (!user) return;
    if (!window.confirm('Revoke coordinator role for this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}/coordinator`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMessage('Coordinator revoked successfully');
        fetchUsers();
      } else {
        setErrorMessage(data.message || 'Failed to revoke coordinator');
      }
    } catch (error) {
      console.error('Error revoking coordinator:', error);
      setErrorMessage('Error revoking coordinator');
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
      } else {
        setErrorMessage(data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setErrorMessage('Error updating permissions');
    }
  };

  const fetchSubjectsForHod = useCallback(async (branchIds, semesterIds) => {
    if (branchIds.length === 0 || semesterIds.length === 0) {
      setHodSubjects([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: '1', limit: '200' });
      branchIds.forEach((id) => params.append('branchId', id));
      semesterIds.forEach((id) => params.append('semesterId', id));

      const response = await fetch(`/api/academic/subjects/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      setHodSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching HOD subjects:', error);
    }
  }, [handleLogout]);

  const fetchSubjectsForTeacher = useCallback(async (branchIds, semesterIds) => {
    if (branchIds.length === 0 || semesterIds.length === 0) {
      setTeacherSubjects([]);
      setTeacherForm((prev) => ({ ...prev, selectedSubjects: [] }));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: '1', limit: '200' });
      branchIds.forEach((id) => params.append('branchId', id));
      semesterIds.forEach((id) => params.append('semesterId', id));

      const response = await fetch(`/api/academic/subjects/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      const subjects = data.subjects || [];
      setTeacherSubjects(subjects);
      const allowedIds = new Set(subjects.map((subject) => String(subject._id)));
      setTeacherForm((prev) => ({
        ...prev,
        selectedSubjects: prev.selectedSubjects.filter((id) => allowedIds.has(String(id)))
      }));
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
    }
  }, [handleLogout]);

  const handleHodBranchToggle = (branchId) => {
    setHodForm((prev) => {
      const selectedBranches = prev.selectedBranches.includes(branchId)
        ? prev.selectedBranches.filter((id) => id !== branchId)
        : [...prev.selectedBranches, branchId];
      fetchSubjectsForHod(selectedBranches, prev.selectedSemesters);
      return { ...prev, selectedBranches };
    });
  };

  const handleHodSemesterToggle = (semesterId) => {
    setHodForm((prev) => {
      const selectedSemesters = prev.selectedSemesters.includes(semesterId)
        ? prev.selectedSemesters.filter((id) => id !== semesterId)
        : [...prev.selectedSemesters, semesterId];
      fetchSubjectsForHod(prev.selectedBranches, selectedSemesters);
      return { ...prev, selectedSemesters };
    });
  };

  const handleHodSubjectToggle = (subjectId) => {
    setHodForm((prev) => {
      const selectedSubjects = prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter((id) => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];
      return { ...prev, selectedSubjects };
    });
  };

  const handleTeacherBranchToggle = (branchId) => {
    setTeacherForm((prev) => {
      const selectedBranches = prev.selectedBranches.includes(branchId)
        ? prev.selectedBranches.filter((id) => id !== branchId)
        : [...prev.selectedBranches, branchId];
      fetchSubjectsForTeacher(selectedBranches, prev.selectedSemesters);
      return { ...prev, selectedBranches };
    });
  };

  const handleTeacherSemesterToggle = (semesterId) => {
    setTeacherForm((prev) => {
      const selectedSemesters = prev.selectedSemesters.includes(semesterId)
        ? prev.selectedSemesters.filter((id) => id !== semesterId)
        : [...prev.selectedSemesters, semesterId];
      fetchSubjectsForTeacher(prev.selectedBranches, selectedSemesters);
      return { ...prev, selectedSemesters };
    });
  };

  const handleTeacherSubjectToggle = (subjectId) => {
    setTeacherForm((prev) => {
      const selectedSubjects = prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter((id) => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];
      return { ...prev, selectedSubjects };
    });
  };

  const handleCreateHod = async () => {
    setAddHodError('');
    if (!hodForm.name || !hodForm.mobile) {
      setAddHodError('Name and mobile number are required');
      return;
    }
    if (hodForm.selectedBranches.length === 0) {
      setAddHodError('Select at least one branch');
      return;
    }
    if (hodForm.selectedSemesters.length === 0) {
      setAddHodError('Select at least one semester');
      return;
    }

    setAddHodLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: hodForm.name,
        mobile: hodForm.mobile,
        branchIds: hodForm.selectedBranches,
        semesterIds: hodForm.selectedSemesters,
        subjectIds: hodForm.selectedSubjects,
        addedBy: currentUser?._id,
        addedByRole: currentUser?.role
      };
      const response = await fetch('/api/admin/add-hod', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        setShowAddHodModal(false);
        setHodForm({ name: '', mobile: '', selectedBranches: [], selectedSemesters: [], selectedSubjects: [] });
        setHodSubjects([]);
        fetchUsers();

        const generatedTempPassword = data?.data?.tempPassword || '';
        if (generatedTempPassword) {
          setTempCredentialData({
            role: 'HOD',
            name: data?.data?.name || hodForm.name,
            mobile: data?.data?.mobile || hodForm.mobile,
            tempPassword: generatedTempPassword
          });
          setShowTempCredentialModal(true);
          setSuccessMessage('HOD added successfully! Temporary password generated.');
        } else {
          setSuccessMessage('HOD added successfully! Temporary credentials sent.');
        }
      } else {
        setAddHodError(data.message || 'Error adding HOD');
      }
    } catch (error) {
      console.error('Error adding HOD:', error);
      setAddHodError('Error adding HOD');
    } finally {
      setAddHodLoading(false);
    }
  };

  const handleCopyTempPassword = async () => {
    try {
      if (!tempCredentialData.tempPassword) return;
      await navigator.clipboard.writeText(tempCredentialData.tempPassword);
      setSuccessMessage('Temporary password copied to clipboard.');
    } catch (error) {
      setErrorMessage('Failed to copy temporary password.');
    }
  };

  const handleModifyHodBranches = async () => {
    setModifyHodError('');
    if (!modifyHodBranches.length) {
      setModifyHodError('Select at least one branch');
      return;
    }
    setModifyHodLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/hod/${modifyHodUser._id}/branches`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branchIds: modifyHodBranches })
      });
      if (response.status === 401) { handleLogout(); return; }
      const data = await response.json();
      if (response.ok && data.success) {
        setShowModifyHodModal(false);
        setModifyHodUser(null);
        setModifyHodBranches([]);
        fetchUsers();
        setSuccessMessage('HOD branches updated successfully!');
      } else {
        setModifyHodError(data.message || 'Error updating HOD branches');
      }
    } catch (error) {
      console.error('Error updating HOD branches:', error);
      setModifyHodError('Error updating HOD branches');
    } finally {
      setModifyHodLoading(false);
    }
  };

  const handleCloseTempCredentialModal = () => {
    setShowTempCredentialModal(false);
    setTempCredentialData({ role: '', name: '', mobile: '', tempPassword: '' });
  };

  const handleCreateTeacher = async () => {
    setAddTeacherError('');
    if (!teacherForm.name || !teacherForm.mobile) {
      setAddTeacherError('Name and mobile number are required');
      return;
    }

    setAddTeacherLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: teacherForm.name,
        mobile: teacherForm.mobile,
        branchIds: teacherForm.selectedBranches,
        semesterIds: teacherForm.selectedSemesters,
        subjectIds: teacherForm.selectedSubjects,
        addedBy: currentUser?._id,
        addedByRole: currentUser?.role
      };
      const response = await fetch('/api/admin/add-teacher', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        setShowAddTeacherModal(false);
        setTeacherForm({ name: '', mobile: '', selectedBranches: [], selectedSemesters: [], selectedSubjects: [] });
        setTeacherSubjects([]);
        fetchUsers();

        const generatedTempPassword = data?.data?.tempPassword || '';
        if (generatedTempPassword) {
          setTempCredentialData({
            role: 'TEACHER',
            name: data?.data?.name || teacherForm.name,
            mobile: data?.data?.mobile || teacherForm.mobile,
            tempPassword: generatedTempPassword
          });
          setShowTempCredentialModal(true);
          setSuccessMessage('Teacher added successfully! Temporary password generated.');
        } else {
          setSuccessMessage('Teacher added successfully! Temporary credentials sent.');
        }
      } else {
        setAddTeacherError(data.message || 'Error adding teacher');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      setAddTeacherError('Error adding teacher');
    } finally {
      setAddTeacherLoading(false);
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
      } else {
        setErrorMessage(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrorMessage('Error deleting user');
    }
  };

  // Academic Assignment Handlers
  const handleOpenAcademicModal = (user) => {
    setSelectedUser(user);
    setAcademicForm({
      branch: user?.branch?._id || user?.branch || '',
      semester: user?.semester?._id || user?.semester || '',
      status: user?.status || 'active'
    });
    setShowAcademicModal(true);
  };

  const handleAcademicAssignmentSave = async () => {
    if (!selectedUser) return;
    if (!academicForm.branch || !academicForm.semester) {
      setErrorMessage('Please select both branch and semester');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/academic-assignment`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: academicForm.branch,
          semester: academicForm.semester,
          status: academicForm.status
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, branch: academicForm.branch, semester: academicForm.semester, status: academicForm.status } : u));
        setShowAcademicModal(false);
        setSuccessMessage('Student academic assignment updated successfully!');
        fetchUsers();
      } else {
        setErrorMessage(data.message || 'Failed to update academic assignment');
      }
    } catch (error) {
      console.error('Error updating academic assignment:', error);
      setErrorMessage('Error updating academic assignment');
    }
  };

  // Profile Update Required Handlers
  const handleOpenProfileUpdateModal = (user, action = 'single') => {
    setSelectedUser(user);
    setProfileUpdateAction(action);
    setShowProfileUpdateModal(true);
  };

  const handleProfileUpdateRequiredSave = async (required = true) => {
    try {
      const token = localStorage.getItem('token');
      
      if (profileUpdateAction === 'single' && selectedUser) {
        const response = await fetch(`/api/admin/users/${selectedUser._id}/profile-update-required`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ required })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setUsers(users.map(u => u._id === selectedUser._id ? { ...u, profileUpdateRequired: required } : u));
          setShowProfileUpdateModal(false);
          setSuccessMessage(required ? 'Student will be prompted to update profile' : 'Profile update requirement cleared');
          fetchUsers();
        } else {
          setErrorMessage(data.message || 'Failed to update profile requirement');
        }
      } else if (profileUpdateAction === 'bulk') {
        // Bulk update for filtered students
        const payload = {
          required,
          branchId: branchFilter || undefined,
          semesterId: semesterFilter || undefined
        };

        const response = await fetch(`/api/admin/users/profile-update-required/bulk`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setShowProfileUpdateModal(false);
          setSuccessMessage(`${data.data.modifiedCount || 0} student(s) updated successfully`);
          fetchUsers();
        } else {
          setErrorMessage(data.message || 'Failed to bulk update profile requirement');
        }
      }
    } catch (error) {
      console.error('Error updating profile requirement:', error);
      setErrorMessage('Error updating profile requirement');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      hod: 'bg-purple-100 text-purple-800',
      coordinator: 'bg-emerald-100 text-emerald-800',
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
    if (user.role === 'coordinator') return 'COORDINATOR';
    return user.role?.toUpperCase() || 'USER';
  };

  const getBranchName = (user) => {
    if (!user || user.role !== 'student') return null;
    const branchId = user.branch?._id || user.branch;
    if (!branchId) return 'Not assigned';
    const branch = branches.find(b => b._id === branchId);
    return branch ? `${branch.code}` : 'Unknown';
  };

  const getSemesterName = (user) => {
    if (!user || user.role !== 'student') return null;
    const semesterId = user.semester?._id || user.semester;
    if (!semesterId) return 'Not assigned';
    const semester = semesters.find(s => s._id === semesterId);
    return semester ? `Sem ${semester.semesterNumber}` : 'Unknown';
  };

  // Build a map of branchId -> { hodId, hodName } for all currently assigned HOD branches
  const takenBranchMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      if (u.role === 'hod') {
        (Array.isArray(u.branches) ? u.branches : []).forEach((b) => {
          const id = String(b?._id || b);
          if (id && !map[id]) map[id] = { hodId: String(u._id), hodName: u.name };
        });
      }
    });
    return map;
  }, [users]);

  const roleOptions = useMemo(() => {
    if (isAdminMode) {
      return [
        { value: 'all', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'hod', label: 'HOD' },
        { value: 'coordinator', label: 'Coordinator' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'student', label: 'Student' }
      ];
    }

    if (role === 'hod') {
      return [
        { value: 'all', label: 'All Roles' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'coordinator', label: 'Coordinator' },
        { value: 'student', label: 'Student' }
      ];
    }

    return [
      { value: 'all', label: 'All Roles' },
      { value: 'student', label: 'Student' }
    ];
  }, [isAdminMode, role]);

  const canEditRole = (user) => isAdminMode && user.role !== 'student' && user.role !== 'coordinator';
  const canToggleStudentBlock = (user) => (isAdminMode || role === 'coordinator') && user.role === 'student';
  const canEditPermissions = (user) => isAdminMode && ['admin', 'hod', 'teacher', 'coordinator'].includes(user.role);
  const canToggleAdminAccess = (user) => isAdminMode && ['teacher', 'hod'].includes(user.role);
  const canManageCoordinator = (user) => (isAdminMode || role === 'hod') && ['teacher', 'coordinator'].includes(user.role);
  const canDeleteUser = () => true;
  const canEditAcademicAssignment = (user) => (isAdminMode || role === 'hod' || role === 'coordinator') && user.role === 'student';
  const canManageProfileUpdate = (user) => (isAdminMode || role === 'hod' || role === 'coordinator') && user.role === 'student';
  const canViewTempPassword = (user) => isAdminMode && user?.passwordChangeRequired === true;

  const handleViewTempPassword = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}/temp-password`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (response.ok && data?.success && data?.data?.tempPassword) {
        setTempCredentialData({
          role: String(data.data.role || user.role || '').toUpperCase(),
          name: data.data.name || user.name,
          mobile: data.data.mobile || user.mobile,
          tempPassword: data.data.tempPassword
        });
        setShowTempCredentialModal(true);
      } else {
        setErrorMessage(data?.message || 'Temporary password not available');
      }
    } catch (error) {
      console.error('Error fetching temporary password:', error);
      setErrorMessage('Error fetching temporary password');
    }
  };

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
      <div className="space-y-4 sm:space-y-5">

        {/* Professional Header */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-white text-2xl sm:text-3xl">group</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">User Management</h1>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3.5 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            {/* Search Bar */}
            <div className="w-full lg:flex-1 lg:min-w-[220px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search by name, email or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 h-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium w-[calc(50%-0.4rem)] sm:w-auto"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {(isAdminMode || role === 'hod') && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-10 px-3.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium w-[calc(50%-0.4rem)] sm:w-auto"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>{branch.name} ({branch.code})</option>
                ))}
              </select>
            )}

            {(isAdminMode || role === 'hod') && (
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="h-10 px-3.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium w-[calc(50%-0.4rem)] sm:w-auto"
              >
                <option value="">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    Sem {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium w-[calc(50%-0.4rem)] sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>

            {/* Add User Buttons (Role-Based) */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 lg:ml-auto w-full lg:w-auto lg:justify-end">
              {isAdminMode && (
                <>
                  <button
                    onClick={() => {
                      setAddHodError('');
                      setShowAddHodModal(true);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all h-10 w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-xl">badge</span>
                    Add HOD
                  </button>
                  <button
                    onClick={() => {
                      setAddTeacherError('');
                      setShowAddTeacherModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all h-10 w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-xl">school</span>
                    Add Teacher
                  </button>
                  <button
                    onClick={() => setShowAdminModal(true)}
                    className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-slate-500/20 hover:opacity-90 transition-all h-10 w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                    Add Admin
                  </button>
                </>
              )}
              {role === 'hod' && !isAdminMode && (
                <button
                  onClick={() => {
                    setAddTeacherError('');
                    setTeacherForm({ name: '', mobile: '', selectedBranches: [], selectedSemesters: [], selectedSubjects: [] });
                    setTeacherSubjects([]);
                    setShowAddTeacherModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all h-10 w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-xl">school</span>
                  Add Teacher
                </button>
              )}
              {(isAdminMode || role === 'hod' || role === 'coordinator') && filteredUsers.filter(u => u.role === 'student').length > 0 && (
                <button
                  onClick={() => handleOpenProfileUpdateModal(null, 'bulk')}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all h-10 w-full sm:w-auto"
                  title="Request all filtered students to update their profile"
                >
                  <span className="material-symbols-outlined text-xl">campaign</span>
                  Alert All Students
                </button>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">group</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Total</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Active</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.filter(u => u.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">schedule</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Pending</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.filter(u => u.status === 'pending').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-3 rounded-lg">
                  <span className="material-symbols-outlined text-2xl">block</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Disabled</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{filteredUsers.filter(u => u.status === 'disabled').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] xl:min-w-[980px]">
              <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User Details</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contact</th>
                  {(isAdminMode || role === 'hod' || role === 'coordinator') && (
                    <>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Branch</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Semester</th>
                    </>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="hidden xl:table-cell px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3">
                        <div className="text-sm space-y-1">
                          <p className="text-gray-900 font-medium">{user.email}</p>
                          <p className="text-gray-500">{user.mobile || 'N/A'}</p>
                        </div>
                      </td>
                      {(isAdminMode || role === 'hod' || role === 'coordinator') && (
                        <>
                          <td className="px-3 py-3">
                            {user.role === 'student' ? (
                              <span className="text-sm text-gray-900 font-medium">
                                {getBranchName(user) || '-'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {user.role === 'student' ? (
                              <span className="text-sm text-gray-900 font-medium">
                                {getSemesterName(user) || '-'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === 'active' ? 'bg-emerald-500' :
                            user.status === 'pending' ? 'bg-amber-500' :
                            'bg-gray-400'
                          }`}></div>
                          {user.status?.toUpperCase()}
                        </div>
                      </td>
                      <td className="hidden xl:table-cell px-3 py-3">
                        <p className="text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
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
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Change Role"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          {isAdminMode && user.role === 'hod' && (
                            <button
                              onClick={() => {
                                const existingIds = (user.branches || []).map((b) => String(b?._id || b));
                                setModifyHodUser(user);
                                setModifyHodBranches(existingIds);
                                setModifyHodError('');
                                setShowModifyHodModal(true);
                              }}
                              className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Modify HOD Branches"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 2h8a2 2 0 012 2v5a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3l3 3-9 9H7v-3l9-9z" />
                              </svg>
                            </button>
                          )}
                          {canToggleStudentBlock(user) && (
                            <button
                              onClick={() => handleStatusChange(user, user.status === 'disabled' ? 'active' : 'disabled')}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
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
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Permissions"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8v-2m0 2a2 2 0 100 4m0-4a2 2 0 110 4m12-8v-2m0 2a2 2 0 100 4m0-4a2 2 0 110 4" />
                              </svg>
                            </button>
                          )}
                          {canManageCoordinator(user) && (
                            <button
                              onClick={() => handleOpenCoordinatorModal(user)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title={user.role === 'coordinator' ? 'Edit Coordinator' : 'Assign Coordinator'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m-6 7a7 7 0 1114 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a7 7 0 016-6z" />
                              </svg>
                            </button>
                          )}
                          {canToggleAdminAccess(user) && (
                            <button
                              onClick={() => handleAdminAccessToggle(user, !user.adminAccess)}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title={user.adminAccess ? 'Revoke Admin Access' : 'Grant Admin Access'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3zm0 0v3m0 4h.01M4 21h16a1 1 0 001-1v-2a7 7 0 10-14 0v2a1 1 0 001 1z" />
                              </svg>
                            </button>
                          )}
                          {canViewTempPassword(user) && (
                            <button
                              onClick={() => handleViewTempPassword(user)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View Temporary Password"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 .37-.042.73-.121 1.076A4 4 0 1016 16h2a2 2 0 002-2v-1a2 2 0 00-2-2h-1.17A6.003 6.003 0 006 12a6 6 0 106 6v-2" />
                              </svg>
                            </button>
                          )}
                          {canEditAcademicAssignment(user) && (
                            <button
                              onClick={() => handleOpenAcademicModal(user)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Branch/Semester"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </button>
                          )}
                          {canManageProfileUpdate(user) && (
                            <button
                              onClick={() => handleOpenProfileUpdateModal(user, 'single')}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title={user.profileUpdateRequired ? 'Clear Update Required' : 'Request Profile Update'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </button>
                          )}
                          {canDeleteUser(user) && (
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    <td colSpan={isAdminMode || role === 'hod' || role === 'coordinator' ? "8" : "6"} className="px-6 py-12 text-center">
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
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 font-medium">
              Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span> ({filteredUsers.length} total users)
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm w-full sm:w-auto"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm w-full sm:w-auto"
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
              {isAdminMode && selectedUser && canEditPermissions(selectedUser) && (
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
      {showPermissionsModal && selectedUser && isAdminMode && canEditPermissions(selectedUser) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
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

            <div className="p-5 sm:p-6 overflow-y-auto">
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

            <div className="px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
              <h3 className="text-xl font-bold text-white">Change User Role</h3>
              <p className="text-sm text-white/90 mt-1">Update system access permissions for this user.</p>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
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

            <div className="bg-gray-50 border-t border-gray-200 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
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

      {/* Coordinator Assignment Modal */}
      {showCoordinatorModal && selectedUser && (isAdminMode || role === 'hod') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Coordinator Assignment</h3>
                    <p className="text-xs text-white/80 mt-0.5">{selectedUser.name} • {selectedUser.role?.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCoordinatorModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-white text-base">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Branch */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch *</label>
                <select
                  value={coordinatorForm.branchId}
                  onChange={(e) => setCoordinatorForm((prev) => ({ ...prev, branchId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-0 outline-none transition-colors text-sm font-medium"
                >
                  <option value="">Select branch...</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Semesters */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Semesters *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {semesters.map((semester) => {
                    const checked = coordinatorForm.semesterIds.includes(semester._id);
                    return (
                      <label
                        key={semester._id}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium select-none ${
                          checked
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setCoordinatorForm((prev) => ({
                              ...prev,
                              semesterIds: isChecked
                                ? [...prev.semesterIds, semester._id]
                                : prev.semesterIds.filter((id) => id !== semester._id)
                            }));
                          }}
                        />
                        <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                          checked ? 'bg-teal-500 border-teal-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {checked && <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>}
                        </span>
                        Sem {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={coordinatorForm.academicYear}
                  onChange={(e) => setCoordinatorForm((prev) => ({ ...prev, academicYear: e.target.value }))}
                  placeholder="2025-2026"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-0 outline-none transition-colors text-sm"
                />
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valid From</label>
                  <input
                    type="date"
                    value={coordinatorForm.validFrom}
                    onChange={(e) => setCoordinatorForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-0 outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valid Till</label>
                  <input
                    type="date"
                    value={coordinatorForm.validTill}
                    onChange={(e) => setCoordinatorForm((prev) => ({ ...prev, validTill: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-0 outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <span className="material-symbols-outlined text-amber-500 text-xl flex-shrink-0 mt-0.5">info</span>
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  Coordinator access is limited to the selected branch and semesters. Validity dates auto-expire the role.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-5 sm:px-6 py-4">
              <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                {selectedUser.role === 'coordinator' && (
                  <button
                    onClick={() => handleRevokeCoordinator(selectedUser)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Revoke Access
                  </button>
                )}
                <div className="flex gap-2.5 flex-1 justify-end">
                  <button
                    onClick={() => setShowCoordinatorModal(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignCoordinator}
                    className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:opacity-90 shadow-md shadow-teal-500/25 transition-all"
                  >
                    Save Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 overflow-hidden">
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

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
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

            <div className="bg-gray-50 border-t border-gray-200 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
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

      {/* Add HOD Modal */}
      {showAddHodModal && isAdminMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[92vh] border-0 sm:border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="sticky top-0 z-10 p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add New HOD</h3>
                <button
                  onClick={() => setShowAddHodModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-white/90 mt-1">Create a new HOD account with branch and subject assignment.</p>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {addHodError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {addHodError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    value={hodForm.name}
                    onChange={(e) => setHodForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter HOD name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                  <input
                    value={hodForm.mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setHodForm((prev) => ({ ...prev, mobile: value }));
                    }}
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Assign Branches *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {branches.map((branch) => {
                    const takenBy = takenBranchMap[branch._id];
                    return (
                      <label key={branch._id} className={`flex items-center p-3 border rounded-lg ${takenBy ? 'border-red-200 bg-red-50 opacity-70 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50 cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={hodForm.selectedBranches.includes(branch._id)}
                          onChange={() => !takenBy && handleHodBranchToggle(branch._id)}
                          disabled={!!takenBy}
                          className="w-4 h-4 text-purple-500 rounded"
                        />
                        <span className="ml-3 text-gray-700 text-sm">
                          {branch.name}
                          {takenBy && <span className="block text-xs text-red-500 mt-0.5">Assigned to {takenBy.hodName}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Assign Semesters *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {semesters.map((semester) => (
                    <label key={semester._id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hodForm.selectedSemesters.includes(semester._id)}
                        onChange={() => handleHodSemesterToggle(semester._id)}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <span className="ml-3 text-gray-700">Sem {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              {hodForm.selectedBranches.length > 0 && hodForm.selectedSemesters.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Subjects <span className="text-gray-500">(Optional)</span>
                  </label>
                  {hodSubjects.length === 0 ? (
                    <p className="text-sm text-gray-600">No subjects available for selected branches and semesters</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {hodSubjects.map((subject) => (
                        <label key={subject._id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                          <input
                            type="checkbox"
                            checked={hodForm.selectedSubjects.includes(subject._id)}
                            onChange={() => handleHodSubjectToggle(subject._id)}
                            className="w-4 h-4 text-purple-500 rounded"
                          />
                          <span className="ml-3 text-gray-700">{subject.name} ({subject.code})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  Temporary credentials will be sent to the HOD's mobile number.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowAddHodModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHod}
                disabled={addHodLoading}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {addHodLoading ? 'Adding...' : 'Add HOD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify HOD Branches Modal */}
      {showModifyHodModal && isAdminMode && modifyHodUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Modify HOD Branches</h3>
                <p className="text-sm text-white/90 mt-1">{modifyHodUser.name}</p>
              </div>
              <button
                onClick={() => setShowModifyHodModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {modifyHodError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{modifyHodError}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Branches *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {branches.map((branch) => {
                    const branchId = String(branch._id);
                    const takenEntry = takenBranchMap[branchId];
                    // Disable if taken by a DIFFERENT HOD
                    const takenByOther = takenEntry && takenEntry.hodId !== String(modifyHodUser._id);
                    return (
                      <label key={branch._id} className={`flex items-center p-3 border rounded-lg ${takenByOther ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={modifyHodBranches.includes(branchId)}
                          onChange={() => {
                            if (takenByOther) return;
                            setModifyHodBranches((prev) =>
                              prev.includes(branchId)
                                ? prev.filter((id) => id !== branchId)
                                : [...prev, branchId]
                            );
                          }}
                          disabled={takenByOther}
                          className="w-4 h-4 text-violet-500 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          {branch.name}
                          {takenByOther && (
                            <span className="block text-xs text-red-500 mt-0.5">Assigned to {takenEntry.hodName}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Removing a branch will affect this HOD's scope for subjects and semesters in that branch.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModifyHodModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleModifyHodBranches}
                disabled={modifyHodLoading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 text-sm"
              >
                {modifyHodLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Credential Modal */}
      {showTempCredentialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-green-500">
              <h3 className="text-xl font-bold text-white">{tempCredentialData.role} Created</h3>
              <p className="text-sm text-white/90 mt-1">Share this temporary password securely.</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{tempCredentialData.name || '-'}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-2">Mobile</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{tempCredentialData.mobile || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temporary Password</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-gray-900 px-4 py-3 border-2 border-emerald-400">
                    <p className="text-lg font-mono font-bold text-emerald-300 tracking-wider text-center">
                      {tempCredentialData.tempPassword || 'N/A'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTempPassword}
                    className="px-3 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    title="Copy password"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">
                  First login required: user must change password after login.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleCloseTempCredentialModal}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (isAdminMode || (role === 'hod' && !isAdminMode)) && (
        role === 'hod' && !isAdminMode ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Teacher</h2>
                  <p className="text-xs md:text-sm text-gray-500">Create a teacher account for your branches</p>
                </div>
                <button
                  onClick={() => setShowAddTeacherModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateTeacher();
                }}
                className="p-4 md:p-5 space-y-4"
              >
                {addTeacherError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {addTeacherError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      placeholder="Teacher name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile *</label>
                    <input
                      value={teacherForm.mobile}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setTeacherForm((prev) => ({ ...prev, mobile: value }));
                      }}
                      maxLength={10}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      placeholder="10-digit mobile"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branches (Optional)</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {branches.map((branch) => (
                        <label key={branch._id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={teacherForm.selectedBranches.includes(branch._id)}
                            onChange={() => handleTeacherBranchToggle(branch._id)}
                          />
                          {branch.name}
                        </label>
                      ))}
                      {branches.length === 0 && (
                        <p className="text-xs text-gray-500">No branches available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Semesters (Optional)</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {semesters.map((semester) => (
                        <label key={semester._id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={teacherForm.selectedSemesters.includes(semester._id)}
                            onChange={() => handleTeacherSemesterToggle(semester._id)}
                          />
                          {semester.name || `Semester ${semester.semesterNumber}`}
                        </label>
                      ))}
                      {semesters.length === 0 && (
                        <p className="text-xs text-gray-500">No semesters available</p>
                      )}
                    </div>
                  </div>
                </div>

                {teacherForm.selectedBranches.length > 0 && teacherForm.selectedSemesters.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subjects (Optional)</label>
                    {teacherSubjects.length === 0 ? (
                      <p className="text-xs text-gray-500">No subjects found for selected branch and semester.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {teacherSubjects.map((subject) => (
                          <label key={subject._id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={teacherForm.selectedSubjects.includes(subject._id)}
                              onChange={() => handleTeacherSubjectToggle(subject._id)}
                            />
                            {subject.name} ({subject.code})
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddTeacherModal(false)}
                    className="px-3.5 py-2 text-sm rounded-lg border border-gray-300 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addTeacherLoading}
                    className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {addTeacherLoading ? 'Saving...' : 'Create Teacher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[92vh] border-0 sm:border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="sticky top-0 z-10 p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-cyan-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Add New Teacher</h3>
                  <button
                    onClick={() => setShowAddTeacherModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-white/90 mt-1">Create a new teacher account with branch and subject assignment.</p>
              </div>

              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {addTeacherError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {addTeacherError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter teacher name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                    <input
                      value={teacherForm.mobile}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setTeacherForm((prev) => ({ ...prev, mobile: value }));
                      }}
                      maxLength={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Branches (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {branches.map((branch) => (
                      <label key={branch._id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacherForm.selectedBranches.includes(branch._id)}
                          onChange={() => handleTeacherBranchToggle(branch._id)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="ml-3 text-gray-700">{branch.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Semesters (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {semesters.map((semester) => (
                      <label key={semester._id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacherForm.selectedSemesters.includes(semester._id)}
                          onChange={() => handleTeacherSemesterToggle(semester._id)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="ml-3 text-gray-700">Sem {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {teacherForm.selectedBranches.length > 0 && teacherForm.selectedSemesters.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Subjects (Optional)</label>
                    {teacherSubjects.length === 0 ? (
                      <p className="text-sm text-gray-600">No subjects available for selected branches and semesters</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {teacherSubjects.map((subject) => (
                          <label key={subject._id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                            <input
                              type="checkbox"
                              checked={teacherForm.selectedSubjects.includes(subject._id)}
                              onChange={() => handleTeacherSubjectToggle(subject._id)}
                              className="w-4 h-4 text-blue-500 rounded"
                            />
                            <span className="ml-3 text-gray-700">{subject.name} ({subject.code})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Temporary credentials will be sent to the teacher's mobile number.
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeacher}
                  disabled={addTeacherLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {addTeacherLoading ? 'Adding...' : 'Add Teacher'}
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Add Admin Modal */}
      {showAdminModal && isAdminMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
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

            <div className="p-5 sm:p-6 overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-5">
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

            <div className="px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
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

      {/* Academic Assignment Modal */}
      {showAcademicModal && selectedUser && (isAdminMode || role === 'hod' || role === 'coordinator') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-500">
              <h3 className="text-xl font-bold text-white">Edit Academic Assignment</h3>
              <p className="text-sm text-white/90 mt-1">Update student branch and semester</p>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                <select
                  value={academicForm.branch}
                  onChange={(e) => setAcademicForm({ ...academicForm, branch: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Semester</label>
                <select
                  value={academicForm.semester}
                  onChange={(e) => setAcademicForm({ ...academicForm, semester: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Semester {semester.semesterNumber}{semester.academicYear ? ` (${semester.academicYear})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={academicForm.status}
                  onChange={(e) => setAcademicForm({ ...academicForm, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowAcademicModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAcademicAssignmentSave}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Update Required Modal */}
      {showProfileUpdateModal && (isAdminMode || role === 'hod' || role === 'coordinator') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-500 to-red-500">
              <h3 className="text-xl font-bold text-white">
                {profileUpdateAction === 'single' ? 'Profile Update Alert' : 'Bulk Profile Update Alert'}
              </h3>
              <p className="text-sm text-white/90 mt-1">
                {profileUpdateAction === 'single' 
                  ? 'Request student to update their profile' 
                  : 'Send update request to all filtered students'}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {profileUpdateAction === 'single' && selectedUser && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  {selectedUser.profileUpdateRequired && (
                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
                      Update Already Required
                    </span>
                  )}
                </div>
              )}

              {profileUpdateAction === 'bulk' && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-gray-700 font-semibold mb-2">
                    📢 Alert will be sent to: <strong className="text-orange-600">{filteredUsers.filter(u => u.role === 'student').length} students</strong>
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <p className="font-semibold">Current Filters:</p>
                    {roleFilter !== 'all' && roleFilter === 'student' && <p>✓ Role: Students Only</p>}
                    {statusFilter !== 'all' && <p>✓ Status: {statusFilter}</p>}
                    {branchFilter && <p>✓ Branch: {branches.find(b => b._id === branchFilter)?.name}</p>}
                    {semesterFilter && <p>✓ Semester: Sem {semesters.find(s => s._id === semesterFilter)?.semesterNumber}</p>}
                    {roleFilter === 'all' && !branchFilter && !semesterFilter && statusFilter === 'all' && (
                      <p className="text-orange-600 font-semibold">⚠️ All students in system will be alerted!</p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-base">ℹ️</span>
                  <span>
                    <strong>What happens next:</strong><br/>
                    • Students will see "Update Branch & Semester" prompt at next login<br/>
                    • They must update their profile to access the system<br/>
                    • Data will auto-update once they submit the form
                  </span>
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>
                    This action will immediately flag all filtered students for profile update. Use with caution.
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowProfileUpdateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProfileUpdateRequiredSave(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                {profileUpdateAction === 'single' ? 'Send Alert' : `Send Alert to ${filteredUsers.filter(u => u.role === 'student').length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none w-[calc(100vw-2rem)] max-w-sm sm:max-w-md">
        {successMessage && (
          <div
            style={{ animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-2xl shadow-xl shadow-green-500/10"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mt-0.5">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">check_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-0.5">Success</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors mt-0.5"
            >
              <span className="material-symbols-outlined text-gray-400 text-base">close</span>
            </button>
          </div>
        )}
        {errorMessage && (
          <div
            style={{ animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-2xl shadow-xl shadow-red-500/10"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center mt-0.5">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">error</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-0.5">Error</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors mt-0.5"
            >
              <span className="material-symbols-outlined text-gray-400 text-base">close</span>
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>
    </RoleLayout>
  );
};

export default UserManagement;
