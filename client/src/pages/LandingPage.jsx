import React from 'react';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const LandingPage = () => {
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();

  const getDashboardPath = (user) => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'admin' || user.adminAccess === true) return '/admin/dashboard';
    if (user.role === 'hod') return '/hod/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'coordinator') return '/coordinator/dashboard';
    return '/';
  };

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <section id="hero" className="max-w-[1200px] mx-auto pt-16 pb-10 px-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black mb-5 border border-primary/20 tracking-wider">
          <span className="material-symbols-outlined" style={{fontSize:'14px'}}>rocket_launch</span>
          SMART ACADEMIC MANAGEMENT SYSTEM
        </div>
        <h1 className="text-2xl md:text-5xl font-black leading-tight tracking-[-0.03em] mb-4">
          Modern Academic Platform <br />
          <span className="text-primary">Built For Daily Campus Workflow</span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-7 leading-relaxed">
          A premium SaaS-style portal to centralize subject resources, assignments, notices, and role-based operations for Admin, HOD, Teacher, and Student.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <a className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/30" href={isLoggedIn ? getDashboardPath(currentUser) : '/login'}>
            {isLoggedIn ? 'Go To Dashboard' : 'Login To Dashboard'}
            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>arrow_forward</span>
          </a>
          <a className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all" href="#cta">
            View System Flow
          </a>
        </div>

        <div className="mt-7 max-w-[980px] mx-auto rounded-2xl border border-[#dbe1ea] dark:border-white/10 bg-white/90 dark:bg-white/5 p-4 shadow-lg text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-1">Quick Working System</p>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Academic Explorer ka simple matlab</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Semester choose karo → Branch select karo → Subject cards dekho → Click karke subject page kholo jahan materials milenge.
              </p>
            </div>
            <a
              href="/academic-explorer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white px-5 py-2.5 font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Open Explorer
              <span className="material-symbols-outlined" style={{fontSize:'16px'}}>travel_explore</span>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl border border-[#e4e8f0] dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-2">1</div>
              <h3 className="text-xs font-bold mb-1">Select Semester</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Choose semester to filter subjects.</p>
            </div>
            <div className="rounded-xl border border-[#e4e8f0] dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-2">2</div>
              <h3 className="text-xs font-bold mb-1">Choose Branch</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Pick CS, CE, EE, ME etc.</p>
            </div>
            <div className="rounded-xl border border-[#e4e8f0] dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-2">3</div>
              <h3 className="text-xs font-bold mb-1">Open Subject</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Click subject for materials.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-3xl font-extrabold mb-2 text-primary dark:text-white">Challenges in Traditional Academic Systems</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Manual communication and disconnected workflows create delays, confusion, and low transparency.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <article className="rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/80 dark:bg-red-900/10 p-4">
            <span className="material-symbols-outlined text-red-600 mb-2" style={{fontSize:'24px'}}>folder_off</span>
            <h3 className="text-sm font-bold mb-1">Scattered Records</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-300">Academic data lives across paper files and disconnected tools.</p>
          </article>
          <article className="rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/80 dark:bg-red-900/10 p-4">
            <span className="material-symbols-outlined text-red-600 mb-2" style={{fontSize:'24px'}}>campaign</span>
            <h3 className="text-sm font-bold mb-1">Delayed Notices</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-300">Important updates are often missed due to manual flow.</p>
          </article>
          <article className="rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/80 dark:bg-red-900/10 p-4">
            <span className="material-symbols-outlined text-red-600 mb-2" style={{fontSize:'24px'}}>hub</span>
            <h3 className="text-sm font-bold mb-1">Disconnected Teams</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-300">No single workflow connecting admin, faculty, and students.</p>
          </article>
        </div>
      </section>

      <section id="solution" className="bg-white dark:bg-white/5 border-y border-[#dcdee5] dark:border-white/10 py-8">
        <div className="max-w-[1200px] mx-auto px-4 grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <h2 className="text-xl md:text-3xl font-extrabold mb-3 text-primary dark:text-white">Smart Academic Management System</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">One integrated platform to run campus communication, content, tasks, and progress tracking.</p>
            <div className="space-y-2">
              <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50/70 dark:bg-green-900/10 p-3 text-xs">Centralized notices and academic resources.</div>
              <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50/70 dark:bg-green-900/10 p-3 text-xs">Role-based dashboards for each user type.</div>
              <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50/70 dark:bg-green-900/10 p-3 text-xs">Mobile-friendly experience across all devices.</div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#dcdee5] dark:border-white/10 bg-background-light dark:bg-white/5 p-6 shadow-lg">
            <h3 className="text-base font-bold mb-3">Unified Workflow Blocks</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white dark:bg-white/10 border border-[#e7e9ef] dark:border-white/10 p-3">
                <p className="font-bold text-xs">Notice Board</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Instant communication</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-white/10 border border-[#e7e9ef] dark:border-white/10 p-3">
                <p className="font-bold text-xs">Subject Hub</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Structured resources</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-white/10 border border-[#e7e9ef] dark:border-white/10 p-3">
                <p className="font-bold text-xs">Task Management</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Assignment lifecycle</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-white/10 border border-[#e7e9ef] dark:border-white/10 p-3">
                <p className="font-bold text-xs">Progress Tracking</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Academic visibility</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-8 bg-primary text-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-3xl font-extrabold mb-2">How System Works</h2>
            <p className="text-blue-100/80 max-w-xl mx-auto text-xs">Step-by-step academic flow from setup to daily execution and monitoring.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <div className="w-8 h-8 rounded-full bg-white text-primary font-bold flex items-center justify-center text-sm mb-3">1</div>
              <h3 className="text-sm font-bold mb-1">Configure</h3>
              <p className="text-[11px] text-blue-100/85">Set departments, semesters, users, and permissions.</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <div className="w-8 h-8 rounded-full bg-white text-primary font-bold flex items-center justify-center text-sm mb-3">2</div>
              <h3 className="text-sm font-bold mb-1">Operate</h3>
              <p className="text-[11px] text-blue-100/85">Run notices, assignments, and content workflows daily.</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <div className="w-8 h-8 rounded-full bg-white text-primary font-bold flex items-center justify-center text-sm mb-3">3</div>
              <h3 className="text-sm font-bold mb-1">Measure</h3>
              <p className="text-[11px] text-blue-100/85">Track engagement and outcomes across all roles.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-3xl font-extrabold mb-2 text-primary dark:text-white">Core Features</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Essential building blocks for a complete academic SaaS experience.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'24px'}}>travel_explore</span>
            <h3 className="text-sm font-bold mb-1">Subject Hub</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2">Semester and branch wise subject navigation.</p>
            <a href="/academic-explorer" className="text-primary text-[11px] font-bold hover:underline">Open Explorer</a>
          </article>
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'24px'}}>task_alt</span>
            <h3 className="text-sm font-bold mb-1">Assignment Tracking</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Create, assign, submit, and monitor tasks easily.</p>
          </article>
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'24px'}}>folder_code</span>
            <h3 className="text-sm font-bold mb-1">Project Repository</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Store and review projects with structured access.</p>
          </article>
          <article className="rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <span className="material-symbols-outlined text-primary mb-2" style={{fontSize:'24px'}}>local_library</span>
            <h3 className="text-sm font-bold mb-1">Digital Library</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Centralized notes, guides, and reference materials.</p>
          </article>
        </div>
      </section>

      <section id="roles" className="py-8 bg-white dark:bg-white/5 border-y border-[#dcdee5] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-3xl font-extrabold mb-2 text-primary dark:text-white">User Roles</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Clear role cards for Admin, HOD, Teacher, and Student journeys.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <article className="rounded-xl p-4 bg-gradient-to-br from-slate-900 to-primary text-white shadow-lg">
              <span className="material-symbols-outlined text-sky-300 mb-3" style={{fontSize:'28px'}}>admin_panel_settings</span>
              <h3 className="text-sm font-bold mb-1">Admin</h3>
              <p className="text-[11px] text-slate-200">Full governance of users, security, and configurations.</p>
            </article>
            <article className="rounded-xl p-4 bg-sky-50 dark:bg-white/5 border border-sky-100 dark:border-white/10">
              <span className="material-symbols-outlined text-sky-600 mb-3" style={{fontSize:'28px'}}>corporate_fare</span>
              <h3 className="text-sm font-bold mb-1">HOD</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Department operations, faculty allocation, and reporting.</p>
            </article>
            <article className="rounded-xl p-4 bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10">
              <span className="material-symbols-outlined text-primary mb-3" style={{fontSize:'28px'}}>person_book</span>
              <h3 className="text-sm font-bold mb-1">Teacher</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Content publication, assignments, and student evaluation.</p>
            </article>
            <article className="rounded-xl p-4 bg-amber-50 dark:bg-white/5 border border-amber-100 dark:border-white/10">
              <span className="material-symbols-outlined text-amber-600 mb-3" style={{fontSize:'28px'}}>face</span>
              <h3 className="text-sm font-bold mb-1">Student</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Access resources, tasks, timetable, and progress.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="cta" className="max-w-[800px] mx-auto px-4 py-10 text-center">
        <h2 className="text-xl sm:text-3xl font-extrabold text-primary dark:text-white mb-3">Ready To Explore Full Academic Flow?</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Check complete system flow and architecture charts for the full portal journey.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-primary/40 transition-all" href="/site/system-flow.html">
            View System Flow
          </a>
          <a className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-slate-700 dark:text-slate-100 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-all" href="/site/architecture.html">
            Open Flowcharts
          </a>
        </div>
      </section>
    </LandingFrame>
  );
};

export default LandingPage;
