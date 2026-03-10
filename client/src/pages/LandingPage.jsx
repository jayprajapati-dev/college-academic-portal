import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const LandingPage = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState({
    students: 0,
    faculty: 0,
    studentPerformance: 0,
    facultyEngagement: 0,
    resourceUtilization: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const isStudentLoggedIn = isLoggedIn && currentUser?.role === 'student';

  const getDashboardPath = (user) => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'admin' || user.adminAccess === true) return '/admin/dashboard';
    if (user.role === 'hod') return '/hod/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'coordinator') return '/coordinator/dashboard';
    return '/';
  };

  const formatCount = (value) => new Intl.NumberFormat('en', { notation: 'compact' }).format(value || 0);
  const formatPercent = (value) => `${Math.min(100, Math.max(0, value || 0))}%`;

  useEffect(() => {
    if (userProfile?.semester?._id) {
      setSelectedSemester(userProfile.semester._id);
    }
    if (userProfile?.branch?._id) {
      setSelectedBranch(userProfile.branch._id);
    }
  }, [userProfile]);

  // Handle View Materials button click
  const handleViewMaterials = (subject) => {
    setSelectedSubject(subject);

    if (isLoggedIn) {
      navigate(`/subjects/${subject._id}`);
    } else {
      setShowMaterialsModal(true);
    }
  };

  const handleOpenMaterialsPage = () => {
    if (!selectedSubject?._id) return;
    setShowMaterialsModal(false);
    navigate(`/subjects/${selectedSubject._id}`);
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [semRes, branchRes, subjRes, analyticsRes] = await Promise.all([
          fetch('/api/academic/semesters').then(r => r.json()),
          fetch('/api/academic/branches').then(r => r.json()),
          fetch('/api/academic/subjects').then(r => r.json()),
          fetch('/api/academic/analytics/public').then(r => r.json())
        ]);

        setSemesters(semRes.data || []);
        setBranches(branchRes.data || []);
        setSubjects(subjRes.data || []);
        if (analyticsRes?.success) {
          setAnalytics(analyticsRes.data);
        }

        const fetchedSemesters = semRes.data || [];
        const fetchedBranches = branchRes.data || [];
        const profileSemesterId = userProfile?.semester?._id;
        const profileBranchId = userProfile?.branch?._id;

        const semesterExistsInList = fetchedSemesters.some((sem) => sem._id === profileSemesterId);
        const branchExistsInList = fetchedBranches.some((branch) => branch._id === profileBranchId);

        // Student defaults must follow profile context first; fallback only if profile values are missing.
        if (isLoggedIn && currentUser?.role === 'student') {
          if (profileSemesterId && semesterExistsInList) {
            setSelectedSemester(profileSemesterId);
          } else {
            setSelectedSemester((prev) => prev || fetchedSemesters[0]?._id || '');
          }

          if (profileBranchId && branchExistsInList) {
            setSelectedBranch(profileBranchId);
          } else {
            setSelectedBranch((prev) => prev || fetchedBranches[0]?._id || '');
          }
        } else {
          setSelectedSemester((prev) => prev || fetchedSemesters[0]?._id || '');
          setSelectedBranch((prev) => prev || fetchedBranches[0]?._id || '');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, currentUser?.role, userProfile?.semester?._id, userProfile?.branch?._id]);

  // Filter subjects based on selected semester and branch
  const filteredSubjects = subjects.filter(sub => 
    sub.semesterId === selectedSemester && sub.branchId === selectedBranch
  );

  const isSubjectProfileAllowed = (subject) => {
    if (!isStudentLoggedIn || !userProfile?.semester?._id || !userProfile?.branch?._id) return true;
    return (
      subject.semesterId === userProfile.semester._id &&
      subject.branchId === userProfile.branch._id
    );
  };

  const formatSubjectType = (type) => {
    if (type === 'practical') return 'Practical';
    if (type === 'theory+practical') return 'Theory + Practical';
    return 'Theory';
  };

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <section className="max-w-[1100px] mx-auto pt-24 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black mb-8 border border-primary/20 tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          SMART COLLEGE PORTAL
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-[-0.03em] mb-5">
          Find Subject Materials <br />
          <span className="text-primary">Fast and Clear</span>
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Select semester and branch, open your subject, and get notes, assignments, and papers from one place.
        </p>
        <div className="max-w-xl mx-auto mb-6">
          <div className="p-3 bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-3">
            <a
              href={isLoggedIn ? getDashboardPath(currentUser) : '/login'}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold text-center hover:opacity-90 transition-opacity"
            >
              {isLoggedIn ? 'Go to My Dashboard' : 'Login to Dashboard'}
            </a>
            <a href="#academic-explorer" className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-sm font-bold text-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              Browse Academic Explorer
            </a>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 text-sm font-bold">
          <span className="text-gray-400 uppercase tracking-widest text-[10px]">You can quickly browse:</span>
          <a href="#academic-explorer" className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors">
            Notes
          </a>
          <a href="#academic-explorer" className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors">
            Syllabus
          </a>
          <a href="#academic-explorer" className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors">
            Assignments
          </a>
          <a href="#academic-explorer" className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors">
            Exam Papers
          </a>
        </div>
      </section>
      <section className="max-w-[1000px] mx-auto px-6 py-8" id="academic-explorer">
        <div className="bg-white dark:bg-background-dark/50 border border-[#dcdee5] dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 md:px-7 pt-5 md:pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#f0f1f4] dark:border-white/5 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                {isStudentLoggedIn ? (
                  <>Welcome, {currentUser?.name}!</>
                ) : (
                  <>Academic Explorer</>
                )}
              </h2>
              {isStudentLoggedIn && userProfile && (
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {userProfile.branch?.name} • Semester {userProfile.semester?.semesterNumber}
                </p>
              )}
              {!isLoggedIn && (
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Guest mode: You can browse subjects now. Login required to open full materials.
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 md:gap-5">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-xs">1</span>
                Select Semester
              </div>
              <div className="w-8 md:w-12 h-px bg-[#dcdee5] dark:bg-white/10"></div>
              <div className="flex items-center gap-2 text-gray-400 font-bold text-xs">
                <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">2</span>
                Select Branch
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {isStudentLoggedIn && userProfile && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-xs md:text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong>Your profile semester and branch are selected by default.</strong> You can still change them below.</span>
                </p>
              </div>
            )}
            <div className="mb-4 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-[#f8fafc] dark:bg-white/5 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-[#e6e8ef] dark:border-white/10">1. Select Semester</span>
                <span className="px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-[#e6e8ef] dark:border-white/10">2. Choose Branch</span>
                <span className="px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-[#e6e8ef] dark:border-white/10">3. Open Subject</span>
                <span className="px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-[#e6e8ef] dark:border-white/10">Guest: Login for full materials</span>
              </div>
            </div>
            <div className="max-w-md mx-auto mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Step 1: Select Semester</p>
              <label className="flex flex-col w-full">
                <span className="text-[#111318] dark:text-gray-200 text-sm font-semibold pb-1.5">Semester</span>
                <select 
                  value={selectedSemester} 
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="form-select w-full rounded-xl border-[#dcdee5] dark:border-white/10 bg-[#f8fafc] dark:bg-white/5 h-12 px-3.5 text-sm focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">Select semester...</option>
                  {semesters.map(sem => (
                    <option key={sem._id} value={sem._id}>
                      Semester {sem.semesterNumber}{sem.academicYear ? ` - ${sem.academicYear}` : ''}
                      {sem.startDate && sem.endDate && ` (${new Date(sem.startDate).toLocaleDateString()} to ${new Date(sem.endDate).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Step 2: Choose Branch</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {loading ? (
                  <div className="col-span-2 md:col-span-4 text-center py-8">
                    <p className="text-gray-500">Loading branches...</p>
                  </div>
                ) : branches.length === 0 ? (
                  <div className="col-span-2 md:col-span-4 text-center py-8">
                    <p className="text-gray-500">No branches available</p>
                  </div>
                ) : (
                  branches.map((branch) => (
                    <button
                      type="button"
                      key={branch._id}
                      onClick={() => setSelectedBranch(branch._id)}
                      className={`group cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 ${
                        selectedBranch === branch._id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        selectedBranch === branch._id 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 group-hover:bg-primary group-hover:text-white'
                      }`}>
                        <span className="material-symbols-outlined">
                          {branch.code === 'CS' && 'terminal'}
                          {branch.code === 'ME' && 'settings'}
                          {branch.code === 'EE' && 'bolt'}
                          {branch.code === 'CE' && 'apartment'}
                          {!['CS', 'ME', 'EE', 'CE'].includes(branch.code) && 'school'}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-center leading-snug">{branch.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">
            {isStudentLoggedIn ? 'My Study Materials' : 'Study Materials'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading resources...' : filteredSubjects.length === 0 ? 'Select a semester and branch to view subjects.' : `${filteredSubjects.length} subject(s) available.`}
          </p>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading academic data...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-gray-500 mb-4">No subjects found for this selection</p>
            <p className="text-sm text-gray-400">Please select a valid semester and branch combination</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredSubjects.slice(0, 3).map((subject) => (
              <div key={subject._id} className="p-6 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-lg transition-all">
                {isStudentLoggedIn && !isSubjectProfileAllowed(subject) && (
                  <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    Profile mismatch
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">book</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase">
                    {formatSubjectType(subject.type)}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">[{subject.code}] {subject.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Subject Type: <span className="font-semibold">{formatSubjectType(subject.type)}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {subject.description || 'Open this subject to view available materials.'}
                </p>
                {isStudentLoggedIn && !isSubjectProfileAllowed(subject) ? (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Open action hidden because this subject is not in your profile semester/branch.
                  </p>
                ) : (
                  <button
                    onClick={() => handleViewMaterials(subject)}
                    className="text-primary text-sm font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {isLoggedIn ? 'Open Subject' : 'Open Subject (Login for Full Access)'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                )}
              </div>
            ))}
            {filteredSubjects.length > 3 && (
              <div className="p-6 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-lg transition-all flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">+{filteredSubjects.length - 3}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">More subjects</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Materials Access Modal for Non-Logged-In Users */}
      {showMaterialsModal && !isLoggedIn && selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
          <div className="w-full max-w-md max-h-[92vh] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.55)] flex flex-col">
              <div className="relative px-4 sm:px-5 py-4 sm:py-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                <button
                  type="button"
                  onClick={() => setShowMaterialsModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-start gap-2.5 pr-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold">Restricted Access</p>
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight">Login To Open Full Subject Materials</h3>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-4 space-y-4 overflow-y-auto">
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">Selected Subject</p>
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">{selectedSubject.name}</h4>
                    <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                      {selectedSubject.code}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>
                      Login karke aapko full notes, PDFs, assignments aur previous papers milenge.
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">After Login You Get</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Subject Notes
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Slides and PDFs
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Assignments
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Previous Papers
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80">
                <div className="grid gap-2">
                  <a
                    href="/login"
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold text-center hover:opacity-95 transition-opacity"
                  >
                    Login Now
                  </a>
                  <button
                    type="button"
                    onClick={handleOpenMaterialsPage}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    Continue to Subject Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMaterialsModal(false)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Continue Browsing
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2.5">
                  Don't have an account?
                  <a href="/register" className="text-primary font-semibold hover:opacity-80"> Create one</a>
                </p>
              </div>
          </div>
        </div>
      )}

      <section className="max-w-[1280px] mx-auto px-6 py-24 mb-12">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-5">Institutional Analytics</h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              View current academic trends from live data: student activity, faculty engagement, and content usage.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </div>
                <span className="text-base md:text-lg font-semibold">Student Performance Snapshot</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </div>
                <span className="text-base md:text-lg font-semibold">Branch-wise Insights</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </div>
                <span className="text-base md:text-lg font-semibold">Resource Usage Monitoring</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity text-center" 
                href="/login"
              >
                Go to Dashboard
              </a>
              <a 
                className="px-6 py-3 bg-gray-200 dark:bg-white/10 text-[#111318] dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-white/20 transition-all text-center" 
                href="/about"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="enterprise-card p-5 md:p-7 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span className="material-symbols-outlined text-primary/10 text-9xl">insights</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black">Live Monitor</h4>
                <span className="text-xs font-bold px-3 py-1 bg-green-500 text-white rounded uppercase tracking-tighter flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="space-y-8 mb-10">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-500">Overall Student Performance</span>
                    <span className="text-primary font-black">{formatPercent(analytics.studentPerformance)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: formatPercent(analytics.studentPerformance) }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-500">Faculty Engagement Rate</span>
                    <span className="text-primary font-black">{formatPercent(analytics.facultyEngagement)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: formatPercent(analytics.facultyEngagement) }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-500">Resource Utilization</span>
                    <span className="text-primary font-black">{formatPercent(analytics.resourceUtilization)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: formatPercent(analytics.resourceUtilization) }}></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-[#dcdee5] dark:border-white/10">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Students</p>
                  <p className="text-2xl font-black">{formatCount(analytics.students)}</p>
                </div>
                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-[#dcdee5] dark:border-white/10">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Faculty</p>
                  <p className="text-2xl font-black">{formatCount(analytics.faculty)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingFrame>
  );
};

export default LandingPage;
