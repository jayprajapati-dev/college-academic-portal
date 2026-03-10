import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, Card, LoadingSpinner, Button } from '../../components';

const StudentSubjects = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const profileData = await fetchProfile();
        setProfile(profileData);

        const subjectList = await fetchSubjects();
        setSubjects(subjectList);
      } catch (error) {
        console.error('Error loading subjects:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchProfile, fetchSubjects, navigate]);

  const filtered = useMemo(() => {
    return subjects.filter((subject) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        subject.name?.toLowerCase().includes(term) ||
        subject.code?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, subjects]);

  const subjectStats = useMemo(() => {
    const total = subjects.length;
    const theory = subjects.filter((s) => String(s.type || '').toLowerCase().includes('theory')).length;
    const practical = subjects.filter((s) => String(s.type || '').toLowerCase().includes('practical')).length;
    return { total, theory, practical };
  }, [subjects]);

  if (loading) {
    return (
      <StudentLayout title="My Subjects" onLogout={handleLogout}>
        <div className="min-h-[55vh] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Subjects" onLogout={handleLogout} userName={profile?.name || 'Student'}>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e40af] to-[#194ce6] text-white p-6 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Student Workspace</p>
              <h1 className="text-2xl md:text-3xl font-black mt-1">My Subjects</h1>
              <p className="text-sm md:text-base text-blue-100 mt-1">
                Fast access to materials, tasks and library for every subject.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-white/15">Total: {subjectStats.total}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Theory: {subjectStats.theory}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">Practical: {subjectStats.practical}</span>
              </div>
            </div>

            <div className="w-full lg:w-80">
              <label className="block text-xs text-blue-100 font-semibold mb-2">Search Subject</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-blue-100 text-[19px]">
                  search
                </span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subject or code"
                  className="w-full pl-10 pr-4 py-2.5 border border-white/30 rounded-xl bg-white/10 text-white placeholder:text-blue-100"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-[#475569]">
            {filtered.length} subject{filtered.length === 1 ? '' : 's'} visible
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-semibold text-[#194ce6] hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No subjects found for your profile</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((subject) => (
              <Card key={subject._id} className="relative overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -top-12 -right-10 h-28 w-28 rounded-full bg-[#DBEAFE] blur-2xl pointer-events-none" />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#EEF4FF] border border-[#D9E7FF] flex items-center justify-center text-[#194ce6]">
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-[#0F172A] leading-tight truncate">{subject.name}</h3>
                        <p className="text-sm font-semibold text-[#64748B] mt-0.5">{subject.code || 'No code'}</p>
                      </div>
                    </div>

                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#0F172A] text-white text-[11px] font-semibold">
                      {subject.semesterId?.semesterNumber ? `Semester ${subject.semesterId.semesterNumber}` : 'Semester N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                      <p className="text-[#94A3B8] uppercase tracking-wide font-semibold">Type</p>
                      <p className="mt-1 text-[#334155] font-semibold capitalize">{(subject.type || 'N/A').replace('+', ' + ')}</p>
                    </div>
                    <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-right">
                      <p className="text-[#94A3B8] uppercase tracking-wide font-semibold">Credits</p>
                      <p className="mt-1 text-[#334155] font-semibold">{subject.credits ? `${subject.credits}` : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => navigate(`/subjects/${subject._id}/materials`, { state: { subject } })}
                    className="bg-[#194ce6] hover:bg-[#1e40af] text-sm flex-1 min-w-[108px]"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Materials
                  </Button>
                  <Button
                    onClick={() => navigate(`/subjects/${subject._id}/tasks`)}
                    variant="secondary"
                    className="text-sm flex-1 min-w-[88px]"
                  >
                    <span className="material-symbols-outlined text-[16px]">assignment</span>
                    Tasks
                  </Button>
                  <Button
                    onClick={() => navigate(`/student/library?subjectId=${subject._id}`)}
                    variant="secondary"
                    className="text-sm flex-1 min-w-[94px]"
                  >
                    <span className="material-symbols-outlined text-[16px]">local_library</span>
                    Library
                  </Button>
                </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentSubjects;
