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

  const fetchSubjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/academic/subjects/student', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return [];

    return data.data;
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

        const subjectList = await fetchSubjects();
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
        <section className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#0f766e] to-[#14b8a6] text-white p-6 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Knowledge Hub</p>
              <h1 className="text-2xl md:text-3xl font-black mt-1">Library Resources</h1>
              <p className="text-sm md:text-base text-emerald-100 mt-1">
                Curated books by subject to speed up your daily study flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-white/15">Books: {books.length}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Subjects: {subjects.length}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or author"
              className="w-full sm:w-72 px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900"
            />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
            >
              <option value="">All Subjects</option>
              {filteredSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code || 'N/A'})
                </option>
              ))}
            </select>
        </div>

        {books.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No library resources found</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book) => (
              <Card key={book._id} className="space-y-4 border border-[#E2E8F0] hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-200 overflow-hidden flex items-center justify-center border border-emerald-300/40">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-emerald-700">book</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{book.title}</h3>
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
