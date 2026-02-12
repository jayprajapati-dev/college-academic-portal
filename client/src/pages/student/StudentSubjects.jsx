import React, { useEffect, useState, useCallback } from 'react';
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
      } catch (error) {
        console.error('Error loading subjects:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchProfile, fetchSubjects, navigate]);

  const filtered = subjects.filter((subject) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      subject.name?.toLowerCase().includes(term) ||
      subject.code?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <StudentLayout title="My Subjects" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Subjects" onLogout={handleLogout} userName={profile?.name || 'Student'}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Subjects</h1>
            <p className="text-gray-600 mt-1">
              Browse your subjects and open materials or tasks
            </p>
          </div>
          <div className="w-full lg:w-80">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subject or code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No subjects found for your profile</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((subject) => (
              <Card key={subject._id} className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                  <p className="text-sm text-gray-600">{subject.code || 'No code'}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {subject.type && (
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {subject.type}
                    </span>
                  )}
                  {subject.credits && (
                    <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">
                      {subject.credits} credits
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => navigate(`/subjects/${subject._id}/materials`, { state: { subject } })}
                    className="bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    Materials
                  </Button>
                  <Button
                    onClick={() => navigate(`/subjects/${subject._id}/tasks`)}
                    variant="secondary"
                    className="text-sm"
                  >
                    Tasks
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

export default StudentSubjects;
