import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { HodLayout } from '../components';

const TeacherMaterials = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preferredSubjectId = location.state?.subjectId || new URLSearchParams(location.search).get('subjectId');
  
  const [user, setUser] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isHod = (user?.role || storedUser?.role) === 'hod';
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    link: '',
  });

  const loadSubjects = useCallback(async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Try teacher-specific endpoint first
      let res = await fetch(`/api/academic/teacher/${userId}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fallback to all subjects if teacher endpoint fails
      if (!res.ok) {
        res = await fetch(`/api/academic/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      const data = await res.json();
      if (data?.success || data?.data) {
        const subjects = data.subjects || data.data || [];
        setSubjects(subjects);
        if (subjects.length > 0) {
          const preferred = preferredSubjectId && subjects.find((s) => s._id === preferredSubjectId);
          setSelectedSubject(preferred ? preferred._id : subjects[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load your subjects');
    } finally {
      setLoading(false);
    }
  }, [preferredSubjectId]);

  // Load user and subjects on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!userData._id && !userData.id) {
        console.error('User ID not found in user data');
        navigate('/login');
        return;
      }
      setUser(userData);
      const userId = userData._id || userData.id;
      loadSubjects(userId);
    } catch (err) {
      console.error('Failed to load user:', err);
      navigate('/login');
    }
  }, [navigate, loadSubjects]);

  // Load materials and categories for selected subject
  useEffect(() => {
    if (!selectedSubject || !user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [resMaterials, resCategories] = await Promise.all([
          fetch(`/api/academic/subjects/${selectedSubject}/materials`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/academic/subjects/${selectedSubject}/materials/categories`)
        ]);

        const dataMaterials = await resMaterials.json();
        const dataCategories = await resCategories.json();

        if (dataMaterials?.success) {
          // Filter materials added by current user
          const userId = user._id || user.id;
          const userMaterials = dataMaterials.materials.filter(m => m.addedBy === userId);
          setMaterials(userMaterials);
        }

        if (dataCategories?.success) {
          setCategories(dataCategories.categories);
        }
      } catch (err) {
        console.error('Failed to load materials:', err);
        setError('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSubject, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data?.success) {
        setFormData({ title: '', category: '', description: '', link: '' });
        setShowForm(false);
        setEditingId(null);
        
        // Reload materials
        const resMaterials = await fetch(`/api/academic/subjects/${selectedSubject}/materials`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataMaterials = await resMaterials.json();
        if (dataMaterials?.success) {
          const userId = user._id || user.id;
          const userMaterials = dataMaterials.materials.filter(m => m.addedBy === userId);
          setMaterials(userMaterials);
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (data?.success) {
        setMaterials(prev => prev.filter(m => m._id !== materialId));
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

  if (loading) {
    if (isHod) {
      return (
        <HodLayout title="Materials" userName={storedUser?.name || 'HOD'} onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
          </div>
        </HodLayout>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#194ce6]"></div>
      </div>
    );
  }

  const content = (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Subject Selection */}
          <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6 mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
            >
              <option value="">Choose a subject...</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add New Material Button */}
          {selectedSubject && (
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  if (showForm) handleCancel();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined">add</span>
                {showForm ? 'Cancel' : 'Add New Material'}
              </button>
            </div>
          )}

          {/* Add/Edit Material Form */}
          {showForm && (
            <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">
                {editingId ? 'Edit Material' : 'Add New Material'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Material title"
                      className="w-full px-4 py-2 rounded-lg border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Link *
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 rounded-lg border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the material"
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Material
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Materials List */}
          {selectedSubject && (
            <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">
                Your Materials ({materials.length})
              </h3>

              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">folder_open</span>
                  No materials added yet. Create your first material above!
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map(mat => (
                    <div key={mat._id} className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{mat.title}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {mat.category}
                            </span>
                          </div>
                          {mat.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{mat.description}</p>
                          )}
                          <a
                            href={mat.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {mat.link}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Added: {new Date(mat.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(mat)}
                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(mat._id)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </main>
  );

  if (isHod) {
    return (
      <HodLayout title="Materials" userName={storedUser?.name || 'HOD'} onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }}>
        {content}
      </HodLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      {content}
    </div>
  );
};

export default TeacherMaterials;
