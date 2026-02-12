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
        
        // Set defaults
        if (semRes.data?.length > 0) setSelectedSemester(semRes.data[0]._id);
        if (branchRes.data?.length > 0) setSelectedBranch(branchRes.data[0]._id);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter subjects based on selected semester and branch
  const filteredSubjects = subjects.filter(sub => 
    sub.semesterId === selectedSemester && sub.branchId === selectedBranch
  );

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <section className="max-w-[1100px] mx-auto pt-24 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black mb-8 border border-primary/20 tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          ENTERPRISE EDITION 2.0
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-[-0.04em] mb-6">
          Elite Academic <br />
          <span className="text-primary">Resource Management</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          Instant access to research papers, curriculum modules, and advanced analytical tools for global higher education.
        </p>
        <div className="max-w-4xl mx-auto mb-6">
          <div className="p-2 bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="flex items-center flex-1 w-full px-4 gap-3 border-b md:border-b-0 md:border-r border-[#f0f1f4] dark:border-white/10 pb-2 md:pb-0">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-base font-medium placeholder:text-gray-400"
                placeholder="Search resources, journals, or faculty databases..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto px-2">
              <select className="form-select bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold focus:ring-primary h-12">
                <option>Year 2024</option>
                <option>Year 2023</option>
              </select>
              <select className="form-select bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold focus:ring-primary h-12">
                <option>Sem 1</option>
                <option>Sem 2</option>
              </select>
              <button className="size-12 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all" type="button">
                <span className="material-symbols-outlined">analytics</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 text-sm font-bold">
          <span className="text-gray-400 uppercase tracking-widest text-[10px]">Popular:</span>
          <button className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors cursor-pointer">
            #ComputerScience
          </button>
          <button className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors cursor-pointer">
            #QuantumPhysics
          </button>
          <button className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors cursor-pointer">
            #MacroEconomics
          </button>
          <button className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 hover:border-primary/40 transition-colors cursor-pointer">
            #Neuroscience
          </button>
        </div>
      </section>
      <section className="max-w-[1000px] mx-auto px-6 py-12" id="academic-explorer">
        <div className="bg-white dark:bg-background-dark/50 border border-[#dcdee5] dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 pt-8 flex items-center justify-between border-b border-[#f0f1f4] dark:border-white/5 pb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {isLoggedIn && currentUser?.role === 'student' ? (
                  <>Welcome, {currentUser?.name}! 📚</>
                ) : (
                  <>Academic Explorer</>
                )}
              </h2>
              {isLoggedIn && currentUser?.role === 'student' && userProfile && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {userProfile.branch?.name} • Semester {userProfile.semester?.semesterNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-xs">1</span>
                Semester
              </div>
              <div className="w-12 h-px bg-[#dcdee5] dark:bg-white/10"></div>
              <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">2</span>
                Branch
              </div>
            </div>
          </div>
          <div className="p-8">
            {isLoggedIn && currentUser?.role === 'student' && userProfile && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong>Your semester and branch are auto-selected.</strong> You can change the selection below to explore other subjects.</span>
                </p>
              </div>
            )}
            <div className="max-w-md mx-auto mb-12">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Step 1: Configure Context</p>
              <label className="flex flex-col w-full">
                <span className="text-[#111318] dark:text-gray-200 text-base font-semibold pb-2">Select Your Current Semester</span>
                <select 
                  value={selectedSemester} 
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="form-select w-full rounded-xl border-[#dcdee5] dark:border-white/10 bg-[#f8fafc] dark:bg-white/5 h-14 px-4 text-base focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">Select a semester...</option>
                  {semesters.map(sem => (
                    <option key={sem._id} value={sem._id}>
                      Semester {sem.semesterNumber} - {sem.academicYear}
                      {sem.startDate && sem.endDate && ` (${new Date(sem.startDate).toLocaleDateString()} to ${new Date(sem.endDate).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 text-center">Step 2: Choose Your Specialization</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div 
                      key={branch._id}
                      onClick={() => setSelectedBranch(branch._id)}
                      className={`group cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all hover:-translate-y-1 ${
                        selectedBranch === branch._id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
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
                      <span className="font-bold text-sm text-center">{branch.name}</span>
                    </div>
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
            {isLoggedIn && currentUser?.role === 'student' ? 'My Study Materials' : 'Featured Learning Resources'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading resources...' : filteredSubjects.length === 0 ? 'Select a semester and branch to view subjects' : `${filteredSubjects.length} subjects available ${isLoggedIn && currentUser?.role === 'student' ? 'for you' : 'for your selection'}`}
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
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">book</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase">
                    {subject.code}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{subject.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {subject.description || 'Subject materials and resources'}
                </p>
                <button 
                  onClick={() => handleViewMaterials(subject)}
                  className="text-primary text-sm font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  Open Subject <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-cyan-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-2xl">lock</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Subject Access Required</h3>
                </div>
                <button 
                  onClick={() => setShowMaterialsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Subject Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-2">Subject</p>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedSubject.code}</p>
              </div>

              {/* Access Info */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start">
                  <span className="mr-2">ℹ️</span>
                  <span>
                    <strong>Login Required:</strong> You need to be logged in to access subject materials, notes, and resources. All academic content is available to registered users.
                  </span>
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Unlock Access To:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Study Materials & Notes
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Lecture Slides & Videos
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Assignment & Exam Papers
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Gradebook & Performance Tracking
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col gap-3">
              <a
                href="/login"
                className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">login</span>
                Login to Your Account
              </a>
              <button
                type="button"
                onClick={handleOpenMaterialsPage}
                className="w-full px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                Click for More
              </button>
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="w-full px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Browsing
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Don't have an account? 
                <a href="/register" className="text-primary font-semibold hover:opacity-80"> Create one free</a>
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-[1280px] mx-auto px-6 py-24 mb-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Institutional Analytics</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
              Real-time monitoring of academic performance across your institution. Track student progress, faculty performance, and institutional metrics in one dashboard.
            </p>
            <ul className="space-y-6 mb-12">
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </div>
                <span className="text-lg font-semibold">Live Student Performance Tracking</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </div>
                <span className="text-lg font-semibold">Department-wise Analytics</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </div>
                <span className="text-lg font-semibold">Automated Insights & Reports</span>
              </li>
            </ul>
            <div className="flex gap-4">
              <a 
                className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-2xl hover:scale-[1.02] transition-all" 
                href="/login"
              >
                Go to Dashboard
              </a>
              <a 
                className="px-8 py-4 bg-gray-200 dark:bg-white/10 text-[#111318] dark:text-white font-black rounded-2xl hover:bg-gray-300 dark:hover:bg-white/20 transition-all" 
                href="/about"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="enterprise-card p-8 rounded-3xl shadow-2xl relative overflow-hidden">
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
