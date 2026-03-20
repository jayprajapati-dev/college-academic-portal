import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleMaterials = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preferredSubjectId = location.state?.subjectId || new URLSearchParams(location.search).get('subjectId');

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [user, setUser] = useState(storedUser);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [materials, setMaterials] = useState([]);
  const [, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterRole, setFilterRole] = useState('All');
  const [syllabusLink, setSyllabusLink] = useState('');
  const [savingSyllabus, setSavingSyllabus] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    link: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = role === 'admin';
  const isHod = role === 'hod';

  const loadSubjects = useCallback(async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let res;
      if (isAdmin) {
        res = await fetch('/api/academic/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (isHod) {
        res = await fetch('/api/academic/subjects/hod', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await fetch(`/api/academic/teacher/${userId}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          res = await fetch('/api/academic/subjects', {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      const data = await res.json();
      const subjectList = data.subjects || data.data || [];
      setSubjects(subjectList);
      if (subjectList.length > 0) {
        const preferred = preferredSubjectId && subjectList.find((s) => s._id === preferredSubjectId);
        setSelectedSubject(preferred ? preferred._id : subjectList[0]._id);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHod, preferredSubjectId]);

  useEffect(() => {
    const loadProfile = async () => {
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

        setUser(data.data);
        setRole(data.data.role);
        const userId = data.data._id || data.data.id;
        loadSubjects(userId);
      } catch (err) {
        console.error('Failed to load user:', err);
        navigate('/login');
      }
    };

    loadProfile();
  }, [navigate, loadSubjects]);

  useEffect(() => {
    if (!selectedSubject) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const resMaterials = await fetch(`/api/academic/subjects/${selectedSubject}/materials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resSyllabus = await fetch(`/api/academic/subjects/${selectedSubject}/syllabus`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const dataMaterials = await resMaterials.json();
        const dataSyllabus = await resSyllabus.json();

        if (dataMaterials?.success) {
          if (isAdmin || isHod) {
            const materialsList = dataMaterials.materials || [];
            setMaterials(materialsList);
            setCategories(Array.from(new Set(materialsList.map((m) => m.category).filter(Boolean))));
          } else {
            const userId = user?._id || user?.id;
            const userMaterials = dataMaterials.materials.filter(m => m.addedBy === userId);
            setMaterials(userMaterials);
            setCategories(Array.from(new Set(userMaterials.map((m) => m.category).filter(Boolean))));
          }
        }

        if (dataSyllabus?.success) {
          setSyllabusLink(dataSyllabus?.data?.syllabus || '');
        } else {
          setSyllabusLink('');
        }

      } catch (err) {
        console.error('Failed to load materials:', err);
        setError('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSubject, isAdmin, isHod, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSubject || !formData.title || !formData.category || !formData.link) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = editingId
        ? `/api/academic/subjects/${selectedSubject}/materials/${editingId}/link`
        : `/api/academic/subjects/${selectedSubject}/materials/link`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data?.success) {
        setFormData({ title: '', category: '', description: '', link: '' });
        setShowForm(false);
        setEditingId(null);

        const resMaterials = await fetch(`/api/academic/subjects/${selectedSubject}/materials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataMaterials = await resMaterials.json();
        if (dataMaterials?.success) {
          if (isAdmin || isHod) {
            setMaterials(dataMaterials.materials || []);
          } else {
            const userId = user?._id || user?.id;
            const userMaterials = dataMaterials.materials.filter(m => m.addedBy === userId);
            setMaterials(userMaterials);
          }
        }

        setError('');
      } else {
        setError(data?.message || 'Failed to save material');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      title: material.title,
      category: material.category,
      description: material.description,
      link: material.link
    });
    setEditingId(material._id);
    setShowForm(true);
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/academic/subjects/${selectedSubject}/materials/${materialId}/link`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data?.success) {
        setMaterials((prev) => prev.filter((m) => m._id !== materialId));
        setError('');
      } else {
        setError(data?.message || 'Failed to delete material');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', category: '', description: '', link: '' });
  };

  const handleSaveSyllabus = async () => {
    if (!selectedSubject) return;

    const nextLink = syllabusLink.trim();
    if (nextLink && !/\.pdf($|\?)/i.test(nextLink)) {
      setError('Syllabus must be a direct PDF link (ending with .pdf)');
      return;
    }

    try {
      setSavingSyllabus(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/academic/subjects/${selectedSubject}/syllabus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ syllabus: nextLink })
      });

      const data = await res.json();
      if (!data?.success) {
        setError(data?.message || 'Failed to update syllabus link');
        return;
      }

      setSyllabusLink(data?.data?.syllabus || '');
      setError('');
    } catch (err) {
      console.error('Failed to update syllabus:', err);
      setError('Failed to update syllabus link');
    } finally {
      setSavingSyllabus(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!isAdmin) return materials;
    return filterRole === 'All'
      ? materials
      : materials.filter((m) => m.addedByRole === filterRole);
  }, [materials, filterRole, isAdmin]);

  const materialStats = useMemo(() => {
    const total = filteredMaterials.length;
    const categories = new Set(filteredMaterials.map((m) => m.category).filter(Boolean)).size;
    const withDescription = filteredMaterials.filter((m) => Boolean(m.description)).length;
    const externalLinks = filteredMaterials.filter((m) => /^https?:\/\//i.test(m.link || '')).length;
    return { total, categories, withDescription, externalLinks };
  }, [filteredMaterials]);

  return (
    <RoleLayout
      title="Materials"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : 'Teacher Panel'}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#0f766e] to-[#0ea5e9] text-white p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">Content Vault</p>
              <h1 className="text-3xl md:text-4xl font-black mt-2">Materials Management</h1>
              <p className="text-cyan-100 mt-2 text-sm md:text-base">
                Organize subject resources with links, categories, and role-wise visibility.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-white/15">Total: {materialStats.total}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Categories: {materialStats.categories}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">With Notes: {materialStats.withDescription}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">External Links: {materialStats.externalLinks}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white border border-[#dcdee5] rounded-2xl p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[#dcdee5] bg-white text-gray-900"
          >
            <option value="">Choose a subject...</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) handleCancel();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Close Form' : 'Add Material'}
            </button>

            {isAdmin && (
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="All">All Roles</option>
                <option value="teacher">Teacher</option>
                <option value="hod">HOD</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>
        )}

        {selectedSubject && (
          <div className="bg-white border border-[#dcdee5] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#181311]">Syllabus</h3>
                <p className="text-sm text-gray-600">Upload one PDF link for subject syllabus.</p>
              </div>
              {syllabusLink && (
                <a
                  href={syllabusLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  Open Syllabus PDF
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
              <input
                type="url"
                value={syllabusLink}
                onChange={(e) => setSyllabusLink(e.target.value)}
                placeholder="https://example.com/syllabus.pdf"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleSaveSyllabus}
                disabled={savingSyllabus}
                className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
              >
                {savingSyllabus ? 'Saving...' : 'Save Syllabus'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-[#dcdee5] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Material' : 'Add New Material'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link</label>
                <input
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-white font-semibold">
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button type="button" onClick={handleCancel} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-[#dcdee5] rounded-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No materials found for this subject and role filter.</div>
          ) : (
            <div className="space-y-4">
              {filteredMaterials.map((material) => (
                <div key={material._id} className="border border-[#f0f1f4] rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{material.title}</p>
                      <p className="text-sm text-gray-600">{material.description || 'No description provided.'}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {material.category}
                        </span>
                        {material.addedByRole && (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {material.addedByRole}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={material.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => handleEdit(material)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
};

export default RoleMaterials;
