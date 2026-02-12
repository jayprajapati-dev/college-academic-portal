import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StudentLayout, Card, LoadingSpinner, Button } from '../../components';

const StudentLibrary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSubjectId = queryParams.get('subjectId') || '';

  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/profile/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Profile not found');
    return data.data;
  }, []);

  const fetchSubjects = useCallback(async (branchId, semesterId) => {
    const res = await fetch('/api/academic/subjects');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return [];

    return data.data.filter((subject) => {
      if (branchId && subject.branchId !== branchId) return false;
      if (semesterId && subject.semesterId !== semesterId) return false;
      return true;
    });
  }, []);

  const fetchBooks = useCallback(async (branchId, semesterId) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (semesterId) params.append('semesterId', semesterId);
    if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
    if (searchTerm) params.append('search', searchTerm);

    const res = await fetch(`/api/library/books/public?${params.toString()}`);
    const data = await res.json();
    if (!data.success) return [];
    return data.data || [];
  }, [searchTerm, selectedSubjectId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const profileData = await fetchProfile();
        setProfile(profileData);

        const branchId = profileData?.branch?._id || profileData?.branchId || profileData?.branch;
        const semesterId = profileData?.semester?._id || profileData?.semesterId || profileData?.semester;

        const subjectList = await fetchSubjects(branchId, semesterId);
        setSubjects(subjectList);

        const bookList = await fetchBooks(branchId, semesterId);
        setBooks(bookList);
      } catch (error) {
        console.error('Error loading library:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchProfile, fetchSubjects, fetchBooks, navigate]);

  useEffect(() => {
    const refreshBooks = async () => {
      if (!profile) return;
      const branchId = profile?.branch?._id || profile?.branchId || profile?.branch;
      const semesterId = profile?.semester?._id || profile?.semesterId || profile?.semester;
      const bookList = await fetchBooks(branchId, semesterId);
      setBooks(bookList);
    };

    refreshBooks();
  }, [fetchBooks, profile]);

  const filteredSubjects = useMemo(() => subjects, [subjects]);

  if (loading) {
    return (
      <StudentLayout title="Library" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Library" onLogout={handleLogout} userName={profile?.name || 'Student'}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Library Resources</h1>
            <p className="text-gray-600 mt-1">
              Browse subject-based books recommended by your department
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or author"
              className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">All Subjects</option>
              {filteredSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {books.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No library resources found</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Card key={book._id} className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-emerald-200 to-teal-200 overflow-hidden flex items-center justify-center">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-emerald-700">book</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
                    <p className="text-sm text-gray-600">{book.author || 'Author not specified'}</p>
                    <p className="text-xs text-emerald-700 mt-1 font-semibold">
                      {book.subjectId?.name || 'General'}
                    </p>
                  </div>
                </div>
                {book.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{book.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {book.publisher && (
                    <span className="px-2 py-1 rounded-full bg-gray-100">{book.publisher}</span>
                  )}
                  {book.edition && (
                    <span className="px-2 py-1 rounded-full bg-gray-100">Edition {book.edition}</span>
                  )}
                  {book.isbn && (
                    <span className="px-2 py-1 rounded-full bg-gray-100">ISBN {book.isbn}</span>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/student/subjects')}
                    className="text-sm"
                  >
                    View Subject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentLibrary;
