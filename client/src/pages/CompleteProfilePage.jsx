import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    branch: '',
    semester: '',
    subjects: [],
    hod: ''
  });

  const fetchAcademicMeta = useCallback(async () => {
    try {
      const [branchesRes, semestersRes] = await Promise.all([
        fetch('/api/academic/branches'),
        fetch('/api/academic/semesters')
      ]);

      const [branchesData, semestersData] = await Promise.all([
        branchesRes.json(),
        semestersRes.json()
      ]);

      if (branchesData?.success) setBranches(branchesData.data || []);
      if (semestersData?.success) setSemesters(semestersData.data || []);
    } catch (error) {
      console.error('Error loading branches/semesters:', error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/profile/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProfileData({
          name: data.data.name || '',
          email: data.data.email || '',
          mobile: data.data.mobile || '',
          role: data.data.role || '',
          branch: data.data.branch?._id || data.data.branch || '',
          semester: data.data.semester?._id || data.data.semester || '',
          subjects: data.data.assignedSubjects?.map((s) => s.name) || [],
          hod: data.data.assignedHOD?.name || 'Not Assigned'
        });
      } else {
        setMessage({ type: 'error', text: 'Unable to load profile details.' });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchProfile(), fetchAcademicMeta()]);
    };
    load();
  }, [fetchAcademicMeta, fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      if (profileData.role === 'student' && (!profileData.branch || !profileData.semester)) {
        setMessage({ type: 'error', text: 'Please select branch and semester to continue.' });
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/profile/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          mobile: profileData.mobile,
          branch: profileData.branch,
          semester: profileData.semester
        })
      });

      const data = await response.json();

      if (data.success) {
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...existingUser,
          name: data?.data?.name || profileData.name,
          email: data?.data?.email || profileData.email,
          mobile: data?.data?.mobile || profileData.mobile,
          branch: data?.data?.branch || profileData.branch,
          semester: data?.data?.semester || profileData.semester,
          profileUpdateRequired: false,
          profileCompletionRequired: false
        }));

        const dashboardMap = {
          student: '/student/dashboard',
          teacher: '/teacher/dashboard',
          hod: '/hod/dashboard',
          admin: '/admin/dashboard',
          coordinator: '/coordinator/dashboard'
        };

        navigate(dashboardMap[profileData.role] || '/');
      } else {
        setMessage({ type: 'error', text: data.message || 'Unable to complete profile.' });
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      setMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = useMemo(() => {
    if (!profileData.role) return 'N/A';
    return String(profileData.role).toUpperCase();
  }, [profileData.role]);

  const formatSemesterOptionLabel = (semester) => {
    const semesterPart = semester?.name || (semester?.semesterNumber ? `Sem ${semester.semesterNumber}` : 'Semester');
    const yearPart = semester?.academicYear ? ` (${semester.academicYear})` : '';
    return `${semesterPart}${yearPart}`;
  };

  const showStudentAcademicSelects = profileData.role === 'student';

  if (loading) {
    return (
      <LandingFrame
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        userProfile={userProfile}
        notifications={notifications}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#194ce6] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile details...</p>
          </div>
        </div>
      </LandingFrame>
    );
  }

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <section className="max-w-[1180px] mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          <aside className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#0891b2] text-white p-5 md:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100">Profile Setup</p>
            <h1 className="text-2xl md:text-3xl font-black mt-2">Complete Your Profile</h1>
            <p className="text-sm text-blue-100 mt-2">
              Finish this step once to access your dashboard with the right branch and semester mapping.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl bg-white/10 px-3.5 py-3">
                <p className="text-[11px] text-blue-100 uppercase tracking-wide">Role</p>
                <p className="font-bold mt-1">{roleLabel}</p>
              </div>
              {profileData.mobile && (
                <div className="rounded-xl bg-white/10 px-3.5 py-3">
                  <p className="text-[11px] text-blue-100 uppercase tracking-wide">Mobile</p>
                  <p className="font-bold mt-1">{profileData.mobile}</p>
                </div>
              )}
              {profileData.role === 'teacher' && (
                <div className="rounded-xl bg-white/10 px-3.5 py-3">
                  <p className="text-[11px] text-blue-100 uppercase tracking-wide">Assigned HOD</p>
                  <p className="font-bold mt-1">{profileData.hod || 'N/A'}</p>
                </div>
              )}
            </div>
          </aside>

          <div className="lg:col-span-8 rounded-2xl bg-white border border-[#E6E9EF] shadow-sm p-5 md:p-6">
            <div className="mb-5 pb-4 border-b border-[#EDF0F5]">
              <h2 className="text-xl md:text-2xl font-black text-[#111318]">Profile Details</h2>
              <p className="text-sm text-[#6B7280] mt-1">Editable fields are enabled below. System-assigned fields are read only.</p>
            </div>

            {message.text && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                  message.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-[#D7DCE5] rounded-lg focus:ring-2 focus:ring-[#194ce6]/20 focus:border-[#194ce6] outline-none transition"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {profileData.role === 'student' ? (
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-[#D7DCE5] rounded-lg focus:ring-2 focus:ring-[#194ce6]/20 focus:border-[#194ce6] outline-none transition"
                      placeholder="Enter your email"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Email</label>
                    <input
                      type="text"
                      value={profileData.email || 'N/A'}
                      disabled
                      className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#64748B]"
                    />
                  </div>
                )}
              </div>

              {showStudentAcademicSelects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                      Select Branch <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="branch"
                      value={profileData.branch || ''}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-[#D7DCE5] rounded-lg bg-white focus:ring-2 focus:ring-[#194ce6]/20 focus:border-[#194ce6] outline-none transition"
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                      Select Semester <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="semester"
                      value={profileData.semester || ''}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-[#D7DCE5] rounded-lg bg-white focus:ring-2 focus:ring-[#194ce6]/20 focus:border-[#194ce6] outline-none transition"
                      required
                    >
                      <option value="">Select semester</option>
                      {semesters.map((semester) => (
                        <option key={semester._id} value={semester._id}>
                          {formatSemesterOptionLabel(semester)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Branch</label>
                    <input
                      type="text"
                      value={profileData.branch?.name || profileData.branch || 'Not Assigned'}
                      disabled
                      className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#64748B]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Semester</label>
                    <input
                      type="text"
                      value={profileData.semester?.name || profileData.semester || 'Not Assigned'}
                      disabled
                      className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#64748B]"
                    />
                  </div>
                </div>
              )}

              {profileData.subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-2">Assigned Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-[#194ce6] to-[#4f46e5] text-white text-xs font-semibold rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5">
                <p className="text-sm font-semibold text-blue-800">Important</p>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  System fields are maintained by administration. If details look incorrect, contact your admin/HOD.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#194ce6] to-[#4f46e5] text-white py-3 rounded-lg text-sm font-bold hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving Profile...' : 'Complete Profile & Continue'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </LandingFrame>
  );
};

export default CompleteProfilePage;
