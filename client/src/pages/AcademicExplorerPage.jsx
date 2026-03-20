import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const AcademicExplorerPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        setLoading(true);
        const [semRes, branchRes, subjectRes] = await Promise.all([
          fetch('/api/academic/semesters').then((r) => r.json()),
          fetch('/api/academic/branches').then((r) => r.json()),
          fetch('/api/academic/subjects').then((r) => r.json())
        ]);

        const fetchedSemesters = semRes?.data || [];
        const fetchedBranches = branchRes?.data || [];
        const fetchedSubjects = subjectRes?.data || [];

        setSemesters(fetchedSemesters);
        setBranches(fetchedBranches);
        setSubjects(fetchedSubjects);

        const profileSemesterId = userProfile?.semester?._id;
        const profileBranchId = userProfile?.branch?._id;

        const hasProfileSemester = fetchedSemesters.some((sem) => sem._id === profileSemesterId);
        const hasProfileBranch = fetchedBranches.some((branch) => branch._id === profileBranchId);

        setSelectedSemester(
          hasProfileSemester ? profileSemesterId : fetchedSemesters[0]?._id || ''
        );
        setSelectedBranch(
          hasProfileBranch ? profileBranchId : fetchedBranches[0]?._id || ''
        );
      } catch (error) {
        console.error('Failed to load academic explorer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAcademicData();
  }, [userProfile?.branch?._id, userProfile?.semester?._id]);

  const filteredSubjects = subjects.filter(
    (subject) => subject.semesterId === selectedSemester && subject.branchId === selectedBranch
  );

  const formatSubjectType = (type) => {
    if (type === 'practical') return 'Practical';
    if (type === 'theory+practical') return 'Theory + Practical';
    return 'Theory';
  };

  const getBranchIcon = (code) => {
    if (code === 'CS') return 'terminal';
    if (code === 'ME') return 'settings';
    if (code === 'EE') return 'bolt';
    if (code === 'CE') return 'apartment';
    return 'school';
  };

  const handleOpenSubject = (subjectId) => {
    navigate(`/subjects/${subjectId}`);
  };

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <section className="max-w-[1100px] mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black mb-4 border border-primary/20 tracking-wider">
          <span className="material-symbols-outlined" style={{fontSize:'14px'}}>travel_explore</span>
          SUBJECT HUB
        </div>
        <h1 className="text-2xl md:text-4xl font-black leading-tight tracking-[-0.03em] mb-3">
          Academic Explorer
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-5">
          Explore branch-wise and semester-wise academic resources from a dedicated page.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <a href="/" className="px-5 py-2.5 text-sm rounded-xl bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
            Back To Landing
          </a>
          <a href={isLoggedIn ? '/student/dashboard' : '/login'} className="px-5 py-2.5 text-sm rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity">
            {isLoggedIn ? 'Open Dashboard' : 'Login To Continue'}
          </a>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary mb-1">How Academic Explorer Works</p>
              <h2 className="text-base font-extrabold mb-1">Semester → Branch → Subject Page</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Pehle semester select hota hai, phir branch choose hoti hai, uske baad subject list show hoti hai. Subject card pe click karte hi subject detail/material page open ho jata hai.
              </p>
            </div>
            <a
              href="#working-explorer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Open Subject Flow
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-left">
            <div className="rounded-xl border border-[#e3e7f0] dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mb-2">1</div>
              <h3 className="text-xs font-bold mb-0.5">Select Semester</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Pick semester to filter scope.</p>
            </div>
            <div className="rounded-xl border border-[#e3e7f0] dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mb-2">2</div>
              <h3 className="text-xs font-bold mb-0.5">Choose Branch</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">CS, CE, EE, ME, etc.</p>
            </div>
            <div className="rounded-xl border border-[#e3e7f0] dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mb-2">3</div>
              <h3 className="text-xs font-bold mb-0.5">Open Subject</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Click card for materials.</p>
            </div>
          </div>
        </div>

        <div id="working-explorer" className="rounded-2xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-base font-extrabold">Working Academic Explorer</h2>
            {!isLoggedIn && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Guest mode active: subject page open kar sakte ho, full access ke liye login karein.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-[1fr_1.4fr] gap-3 mb-4">
            <label className="flex flex-col">
              <span className="text-xs font-bold mb-1.5">Select Semester</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="h-10 rounded-xl border border-[#d8dde8] dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs"
              >
                <option value="">Choose semester</option>
                {semesters.map((sem) => (
                  <option key={sem._id} value={sem._id}>
                    Semester {sem.semesterNumber}{sem.academicYear ? ` - ${sem.academicYear}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="text-xs font-bold mb-1.5">Choose Branch</p>
              <div className="grid grid-cols-2 gap-2">
                {branches.map((branch) => (
                  <button
                    key={branch._id}
                    type="button"
                    onClick={() => setSelectedBranch(branch._id)}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      selectedBranch === branch._id
                        ? 'border-primary bg-primary/5'
                        : 'border-[#d8dde8] dark:border-white/10 bg-slate-50 dark:bg-slate-900/70 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-primary" style={{fontSize:'15px'}}>{getBranchIcon(branch.code)}</span>
                      <span className="text-[10px] font-bold uppercase text-gray-500">{branch.code || 'BR'}</span>
                    </div>
                    <p className="text-xs font-semibold leading-snug">{branch.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-[#e4e8f0] dark:border-white/10 p-8 text-center text-sm text-gray-500">
              Loading semesters, branches and subjects...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-[#e4e8f0] dark:border-white/10 p-8 text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No subjects found for selected semester and branch.</p>
              <p className="text-xs text-gray-500 mt-1">Try another semester/branch combination.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((subject) => (
                <article key={subject._id} className="rounded-xl border border-[#d8dde8] dark:border-white/10 bg-white dark:bg-slate-900 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined" style={{fontSize:'16px'}}>book</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {formatSubjectType(subject.type)}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold mb-1">[{subject.code}] {subject.name}</h3>
                  <p className="text-[10px] text-gray-500 mb-2">Click to open subject page</p>
                  <button
                    type="button"
                    onClick={() => handleOpenSubject(subject._id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
                  >
                    Open Subject
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-3">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'22px'}}>account_tree</span>
            <h2 className="text-xs font-bold mb-1">Branch Navigation</h2>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Discover subjects by branch quickly.</p>
          </article>
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-3">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'22px'}}>view_timeline</span>
            <h2 className="text-xs font-bold mb-1">Semester Filters</h2>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Access study materials by semester.</p>
          </article>
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-3">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'22px'}}>library_books</span>
            <h2 className="text-xs font-bold mb-1">Resource Access</h2>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Notes and references in one place.</p>
          </article>
        </div>
      </section>
    </LandingFrame>
  );
};

export default AcademicExplorerPage;
