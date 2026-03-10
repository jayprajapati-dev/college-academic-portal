import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Modal, RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Mini Project',
  subjectId: '',
  dueDate: '',
  teamSize: 1,
  status: 'active',
  resources: [{ name: '', url: '' }]
};

const RoleProjects = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const [user, setUser] = useState(storedUser);
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [projects, setProjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const token = localStorage.getItem('token');
  const panelLabel = role === 'admin'
    ? 'Admin Panel'
    : role === 'hod'
      ? 'HOD Panel'
      : role === 'coordinator'
        ? 'Coordinator Panel'
        : 'Teacher Panel';

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const handleAuthError = useCallback((response) => {
    if (response?.status === 401) {
      handleLogout();
      return true;
    }
    return false;
  }, [handleLogout]);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    const response = await fetch('/api/profile/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (!response.ok || !data?.success) {
      if (!handleAuthError(response)) navigate('/login');
      return;
    }

    setUser(data.data);
    setRole(data.data.role);
    localStorage.setItem('user', JSON.stringify(data.data));
  }, [handleAuthError, navigate, token]);

  const fetchSubjects = useCallback(async () => {
    if (!token) return;

    const endpoint = role === 'coordinator'
      ? '/api/academic/subjects/coordinator'
      : role === 'hod'
        ? '/api/academic/subjects/hod'
        : role === 'teacher'
          ? `/api/academic/teacher/${user?._id}/subjects`
          : '/api/academic/subjects';

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (!response.ok || !data?.success) {
      if (!handleAuthError(response)) {
        console.error('Failed to load subjects:', data?.message || response.statusText);
      }
      return;
    }

    const incoming = data.subjects || data.data || [];
    setSubjects(Array.isArray(incoming) ? incoming : []);
  }, [handleAuthError, role, token, user?._id]);

  const fetchProjects = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/all?page=1&limit=100&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        if (!handleAuthError(response)) {
          console.error('Failed to load projects:', data?.message || response.statusText);
        }
        return;
      }

      setProjects(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, statusFilter, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title || '',
      description: project.description || '',
      category: project.category || 'Mini Project',
      subjectId: project.subjectId?._id || '',
      dueDate: project.dueDate ? String(project.dueDate).slice(0, 10) : '',
      teamSize: project.teamSize || 1,
      status: project.status || 'active',
      resources: Array.isArray(project.resources) && project.resources.length > 0
        ? project.resources.map((resource) => ({ name: resource.name || '', url: resource.url || '' }))
        : [{ name: '', url: '' }]
    });
    setShowModal(true);
  };

  const normalizeResources = () => (Array.isArray(formData.resources) ? formData.resources : [])
    .filter((resource) => resource?.url?.trim())
    .map((resource) => ({
      name: resource.name?.trim() || 'Resource',
      url: resource.url.trim()
    }));

  const handleSaveProject = async () => {
    if (!formData.title || !formData.description || !formData.subjectId) {
      alert('Title, description and subject are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subjectId: formData.subjectId,
        dueDate: formData.dueDate || null,
        teamSize: Number(formData.teamSize || 1),
        status: formData.status,
        resources: normalizeResources()
      };

      const endpoint = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects/create';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        alert(data?.message || 'Failed to save project');
        return;
      }

      setShowModal(false);
      setEditingProject(null);
      setFormData(EMPTY_FORM);
      fetchProjects();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;

    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok || !data?.success) {
      alert(data?.message || 'Failed to delete project');
      return;
    }

    fetchProjects();
  };

  const addResourceRow = () => {
    setFormData((prev) => ({
      ...prev,
      resources: [...(prev.resources || []), { name: '', url: '' }]
    }));
  };

  const updateResource = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      resources: (prev.resources || []).map((resource, idx) => (idx === index ? { ...resource, [key]: value } : resource))
    }));
  };

  const removeResource = (index) => {
    setFormData((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((_, idx) => idx !== index)
    }));
  };

  const visibleProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;

    return projects.filter((project) =>
      project.title?.toLowerCase().includes(term)
      || project.description?.toLowerCase().includes(term)
      || project.subjectId?.name?.toLowerCase().includes(term)
      || project.subjectId?.code?.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  const projectStats = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now);
    weekLater.setDate(now.getDate() + 7);

    const total = visibleProjects.length;
    const active = visibleProjects.filter((p) => p.status === 'active').length;
    const drafts = visibleProjects.filter((p) => p.status === 'draft').length;
    const dueSoon = visibleProjects.filter((p) => {
      if (!p.dueDate) return false;
      const due = new Date(p.dueDate);
      return due >= now && due <= weekLater;
    }).length;

    return { total, active, drafts, dueSoon };
  }, [visibleProjects]);

  const getStatusClass = (status) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'draft') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <RoleLayout
      title="Projects"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-primary via-[#f97316] to-[#ea580c] text-white p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100">Project Studio</p>
              <h1 className="text-3xl md:text-4xl font-black mt-2">Project Management</h1>
              <p className="text-orange-100 mt-2 text-sm md:text-base">
                Drive subject projects from draft to delivery with better planning control.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-white/15">Total: {projectStats.total}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Active: {projectStats.active}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Drafts: {projectStats.drafts}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Due Soon: {projectStats.dueSoon}</span>
              </div>
            </div>
            <Button
              onClick={openCreateModal}
              className="bg-white text-[#b45309] hover:bg-orange-50 shadow-lg shadow-orange-900/20 border border-orange-100"
            >
              + New Project
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">All Projects</p>
            <p className="text-2xl font-black text-[#111827] mt-1">{projectStats.total}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Active</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{projectStats.active}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Drafts</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{projectStats.drafts}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#6B7280]">Due In 7 Days</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{projectStats.dueSoon}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Input
          placeholder="Search projects by title, subject, or code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon="search"
        />

        <Card>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading projects...</div>
          ) : visibleProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No projects found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((project) => (
                    <tr key={project._id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">{project.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{project.subjectId?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{project.subjectId?.code || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{project.category || 'Project'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass(project.status)}`}>
                          {project.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditModal(project)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(project._id)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-rose-100 text-rose-700 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!saving) setShowModal(false);
        }}
        title={editingProject ? 'Edit Project' : 'Create Project'}
        size="large"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#896b61] dark:text-[#c4b0a9] mb-3">Basic Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Project title"
              />
              <Input
                label="Description *"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Project scope and instructions"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#896b61] dark:text-[#c4b0a9] mb-3">Academic Setup</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full h-11 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18]"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full h-11 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18]"
                >
                  <option value="Mini Project">Mini Project</option>
                  <option value="Major Project">Major Project</option>
                  <option value="Lab Project">Lab Project</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
              <Input
                label="Team Size"
                type="number"
                value={formData.teamSize}
                onChange={(e) => setFormData((prev) => ({ ...prev, teamSize: e.target.value }))}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full h-11 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18]"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e6dedb] dark:border-[#3a2a24] bg-[#fffdfc] dark:bg-[#211511] p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resources</label>
              <button
                type="button"
                onClick={addResourceRow}
                className="text-xs font-semibold text-primary"
              >
                + Add Resource
              </button>
            </div>

            {(formData.resources || []).map((resource, index) => (
              <div key={`resource-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={resource.name}
                  onChange={(e) => updateResource(index, 'name', e.target.value)}
                  placeholder="Resource name"
                  className="h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18]"
                />
                <input
                  value={resource.url}
                  onChange={(e) => updateResource(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="h-10 px-3 border border-[#e6dedb] dark:border-[#3a2a24] rounded-lg bg-[#f4f1f0] dark:bg-[#2d1e18]"
                />
                <button
                  type="button"
                  onClick={() => removeResource(index)}
                  className="h-10 px-3 rounded-lg bg-rose-100 text-rose-700 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={saving}>
              {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </RoleLayout>
  );
};

export default RoleProjects;
