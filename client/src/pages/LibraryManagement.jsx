import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, Button, Card, HodLayout, Input, LoadingSpinner, Modal, Pagination, TeacherLayout } from '../components';
import axios from 'axios';

const LibraryManagement = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role;
  const Layout = useMemo(() => {
    if (role === 'admin') return AdminLayout;
    if (role === 'hod') return HodLayout;
    return TeacherLayout;
  }, [role]);

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    subjectId: '',
    branchId: '',
    semesterId: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subjectId: '',
    description: '',
    coverUrl: '',
    isbn: '',
    publisher: '',
    edition: '',
    status: 'active'
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchMetadata = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const requests = [
        axios.get('/api/academic/semesters'),
        role === 'hod'
          ? axios.get('/api/academic/subjects/hod', { headers: { Authorization: `Bearer ${token}` } })
          : axios.get('/api/academic/subjects'),
        role === 'admin' ? axios.get('/api/academic/branches') : Promise.resolve({ data: { success: true, data: [] } })
      ];

      const [semestersRes, subjectsRes, branchesRes] = await Promise.all(requests);
      if (semestersRes?.data?.success) setSemesters(semestersRes.data.data || []);
      if (subjectsRes?.data?.success) {
        let subjectList = subjectsRes.data.data || [];
        if (role === 'teacher' && storedUser?.branch) {
          subjectList = subjectList.filter((subject) => String(subject.branchId) === String(storedUser.branch));
        }
        setSubjects(subjectList);
      }
      if (branchesRes?.data?.success) setBranches(branchesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  }, [role, storedUser?.branch]);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search: searchTerm || undefined,
        subjectId: filters.subjectId || undefined,
        branchId: filters.branchId || undefined,
        semesterId: filters.semesterId || undefined
      };

      const res = await axios.get('/api/library/books', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setBooks(res.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
          pages: res.data.pages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      alert('Error fetching library books');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, searchTerm, filters]);

  useEffect(() => {
    if (!role) {
      navigate('/login');
      return;
    }
    fetchMetadata();
  }, [role, fetchMetadata, navigate]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      subjectId: '',
      description: '',
      coverUrl: '',
      isbn: '',
      publisher: '',
      edition: '',
      status: 'active'
    });
    setEditingBook(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      subjectId: book.subjectId?._id || book.subjectId || '',
      description: book.description || '',
      coverUrl: book.coverUrl || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      edition: book.edition || '',
      status: book.status || 'active'
    });
    setShowModal(true);
  };

  const handleSaveBook = async () => {
    if (!formData.title || !formData.subjectId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        author: formData.author,
        subjectId: formData.subjectId,
        description: formData.description,
        coverUrl: formData.coverUrl,
        isbn: formData.isbn,
        publisher: formData.publisher,
        edition: formData.edition,
        status: formData.status
      };

      if (editingBook) {
        const res = await axios.put(`/api/library/books/${editingBook._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          alert('Library book updated successfully');
        }
      } else {
        const res = await axios.post('/api/library/books', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          alert('Library book created successfully');
        }
      }

      setShowModal(false);
      resetForm();
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      alert(error.response?.data?.message || 'Error saving library book');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/library/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert('Library book deleted successfully');
        fetchBooks();
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting library book');
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  if (loading) {
    return (
      <Layout title="Library Management" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Library Management" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-emerald-500">library_books</span>
              Library Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Curate subject-based library resources for students
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search books"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700">
              + Add Book
            </Button>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <select
              value={filters.subjectId}
              onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code || 'N/A'})
                </option>
              ))}
            </select>

            <select
              value={filters.semesterId}
              onChange={(e) => setFilters((prev) => ({ ...prev, semesterId: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.name || `Semester ${semester.semesterNumber}`}
                </option>
              ))}
            </select>

            {role === 'admin' && (
              <select
                value={filters.branchId}
                onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No library books found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Author</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book._id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {book.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {book.author || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {book.subjectId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          book.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {book.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(book)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book._id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200"
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

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBook ? 'Edit Library Book' : 'Add Library Book'}
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter book title"
          />
          <Input
            label="Author"
            value={formData.author}
            onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
            placeholder="Enter author name"
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData((prev) => ({ ...prev, subjectId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Cover Image URL"
            value={formData.coverUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, coverUrl: e.target.value }))}
            placeholder="https://"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="ISBN"
              value={formData.isbn}
              onChange={(e) => setFormData((prev) => ({ ...prev, isbn: e.target.value }))}
              placeholder="ISBN number"
            />
            <Input
              label="Edition"
              value={formData.edition}
              onChange={(e) => setFormData((prev) => ({ ...prev, edition: e.target.value }))}
              placeholder="Edition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Publisher"
              value={formData.publisher}
              onChange={(e) => setFormData((prev) => ({ ...prev, publisher: e.target.value }))}
              placeholder="Publisher name"
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Short description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBook} disabled={saving}>
              {saving ? 'Saving...' : 'Save Book'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default LibraryManagement;
