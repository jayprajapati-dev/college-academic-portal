import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubjectMaterialsManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    resourceType: 'Notes'
  });

  const itemsPerPage = 10;
  const resourceTypes = ['Notes', 'Video', 'Assignment', 'Reference', 'Practice'];

  const fetchSubjectDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/academic/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubject(response.data.data);
    } catch (error) {
      console.error('Error fetching subject:', error);
      showToast('Failed to load subject details', 'error');
    }
  }, [id]);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/academic/subjects/${id}/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaterials(response.data.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      showToast('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubjectDetails();
    fetchMaterials();
  }, [fetchSubjectDetails, fetchMaterials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (modalMode === 'add') {
        await axios.post(`/api/academic/subjects/${id}/materials`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Material link added successfully', 'success');
      } else {
        await axios.put(`/api/academic/subjects/${id}/materials/${selectedMaterial._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Material link updated successfully', 'success');
      }
      
      fetchMaterials();
      closeModal();
    } catch (error) {
      console.error('Error saving material:', error);
      showToast(error.response?.data?.message || 'Failed to save material', 'error');
    }
  };

  const handleDelete = async (materialId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/academic/subjects/${id}/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Material deleted successfully', 'success');
      fetchMaterials();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting material:', error);
      showToast('Failed to delete material', 'error');
    }
  };

  const handleClick = async (materialId, url) => {
    // Track click
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/academic/subjects/${id}/materials/${materialId}/click`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    
    // Open link in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard', 'success');
  };

  const openModal = (mode, material = null) => {
    setModalMode(mode);
    setSelectedMaterial(material);
    if (mode === 'edit' && material) {
      setFormData({
        title: material.title,
        url: material.url,
        description: material.description || '',
        resourceType: material.resourceType
      });
    } else {
      setFormData({
        title: '',
        url: '',
        description: '',
        resourceType: 'Notes'
      });
    }
  };

  const closeModal = () => {
    setSelectedMaterial(null);
    setFormData({
      title: '',
      url: '',
      description: '',
      resourceType: 'Notes'
    });
  };

  const showToast = (message, type) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Filter and sort materials
  const filteredMaterials = materials
    .filter(mat => {
      const matchesSearch = mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (mat.description && mat.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || mat.resourceType === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.addedAt) - new Date(a.addedAt);
      if (sortBy === 'oldest') return new Date(a.addedAt) - new Date(b.addedAt);
      if (sortBy === 'clicks') return (b.clickCount || 0) - (a.clickCount || 0);
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTypeIcon = (type) => {
    const icons = {
      'Notes': 'article',
      'Video': 'play_circle',
      'Assignment': 'assignment',
      'Reference': 'book',
      'Practice': 'fitness_center'
    };
    return icons[type] || 'link';
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'Notes': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Video': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'Assignment': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'Reference': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Practice': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const totalClicks = materials.reduce((sum, mat) => sum + (mat.clickCount || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#111318] dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#dcdfe5] dark:border-gray-700 bg-white dark:bg-background-dark px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-primary">
            <div className="w-6 h-6">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Academic Portal</h2>
          </div>
          <nav className="flex items-center gap-9">
            <button onClick={() => navigate('/admin/dashboard')} className="text-[#636f88] dark:text-gray-400 text-sm font-medium hover:text-primary transition-colors">Dashboard</button>
            <button onClick={() => navigate('/admin/subjects')} className="text-primary text-sm font-semibold border-b-2 border-primary py-4 -mb-4">Subjects</button>
            <button className="text-[#636f88] dark:text-gray-400 text-sm font-medium hover:text-primary transition-colors">Students</button>
            <button className="text-[#636f88] dark:text-gray-400 text-sm font-medium hover:text-primary transition-colors">Faculty</button>
          </nav>
        </div>
        <div className="flex flex-1 justify-end gap-8 items-center">
          <label className="flex flex-col min-w-40 h-10 max-w-64">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
              <div className="text-[#636f88] flex border-none bg-[#f0f2f4] dark:bg-gray-800 items-center justify-center pl-4 rounded-l-xl">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <input className="form-input flex w-full min-w-0 flex-1 border-none bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white focus:ring-0 h-full placeholder:text-[#636f88] px-4 rounded-r-xl text-sm font-normal" placeholder="Search resources..." />
            </div>
          </label>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#636f88] cursor-pointer">notifications</span>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-9 h-9 border border-gray-200" style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=Admin&background=195de6&color=fff")'}}></div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate('/admin/subjects')} className="text-[#636f88] dark:text-gray-400 font-medium hover:text-primary transition-colors">Subject Management</button>
          <span className="text-[#636f88] dark:text-gray-400">/</span>
          <span className="text-[#111318] dark:text-white font-semibold">Material Links</span>
        </div>
        {/* Subject Overview Card */}
        <div className="flex items-stretch justify-between gap-6 rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-[2_2_0px] flex-col justify-between py-1">
            <div className="flex flex-col gap-2">
              <span className="text-primary text-xs font-bold uppercase tracking-wider">Course Overview</span>
              <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
                {subject?.name} ({subject?.code})
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
                Semester: {subject?.semester?.name} | Branch: {subject?.branch?.name}
              </p>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-lg">ads_click</span>
                <span className="text-sm font-semibold">{totalClicks} Total Link Clicks</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block w-72 rounded-xl border border-gray-100 dark:border-gray-700" 
               style={{background: 'linear-gradient(135deg, #195de6 0%, #6366f1 100%)'}}>
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-white/40">link</span>
            </div>
          </div>
        </div>

        {/* Add Material Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-gray-900 dark:text-white text-xl font-bold mb-6">Add Material Link</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-gray-900 dark:text-gray-200 text-sm font-semibold pb-2">Material Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="flex w-full rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-12 px-4 text-sm"
                  placeholder="e.g., Dijkstra's Algorithm Visualization"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-900 dark:text-gray-200 text-sm font-semibold pb-2">Material URL</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-gray-600 text-xl">link</span>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="flex w-full rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-12 pl-10 pr-4 text-sm"
                    placeholder="https://youtube.com/..."
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-900 dark:text-gray-200 text-sm font-semibold pb-2">Resource Type</label>
                <select
                  value={formData.resourceType}
                  onChange={(e) => setFormData({...formData, resourceType: e.target.value})}
                  className="flex w-full rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-12 px-4 text-sm"
                >
                  {resourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="bg-primary text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_link</span>
                Save Link
              </button>
            </div>
          </form>
        </div>

        {/* Materials Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">External Resources</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="clicks">Most Clicked</option>
              </select>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                selectedType === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              All
            </button>
            {resourceTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  selectedType === type 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {paginatedMaterials.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">link_off</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No material links added yet</p>
              <button
                onClick={() => openModal('add')}
                className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90"
              >
                Add First Material Link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Resource Type</th>
                    <th className="px-6 py-4">URL/Link</th>
                    <th className="px-6 py-4">Added At</th>
                    <th className="px-6 py-4 text-center">Clicks/Visits</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedMaterials.map(material => (
                    <tr key={material._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{material.title}</span>
                          {material.description && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">{material.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium ${getTypeBadgeColor(material.resourceType)}`}>
                          <span className="material-symbols-outlined text-[16px]">{getTypeIcon(material.resourceType)}</span>
                          {material.resourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleClick(material._id, material.url)}
                          className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                        >
                          {material.url.length > 30 ? material.url.substring(0, 30) + '...' : material.url}
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getRelativeTime(material.addedAt)}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-sm">
                        {material.clickCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(material.url)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                            title="Copy Link"
                          >
                            <span className="material-symbols-outlined text-xl">content_copy</span>
                          </button>
                          <button
                            onClick={() => openModal('edit', material)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(material._id)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {paginatedMaterials.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
              <span>Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} links</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark py-6 px-10 text-center text-[#636f88] text-sm">
        © 2023 Enterprise Academic Portal. All Rights Reserved.
      </footer>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this material link? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectMaterialsManagement;
