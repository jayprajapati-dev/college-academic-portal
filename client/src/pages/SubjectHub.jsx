import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';
import SubjectTimetableView from '../components/SubjectTimetableView';

const SubjectHub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [books, setBooks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subjectAccessDenied, setSubjectAccessDenied] = useState(false);
  const [timetableEntries, setTimetableEntries] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const subjectRes = await fetch(`/api/academic/subjects/${id}/public`);
        const subjectData = await subjectRes.json();
        if (!subjectRes.ok || !subjectData?.success) {
          throw new Error(subjectData?.message || 'Failed to load subject');
        }

        if (!isMounted) return;
        setSubject(subjectData.subject);

        // Fetch timetable entries for this subject
        try {
          const timetableRes = await fetch(`/api/timetable/subject/${id}`);
          if (timetableRes.ok) {
            const timetableData = await timetableRes.json();
            if (isMounted && Array.isArray(timetableData?.data)) {
              const activeEntries = timetableData.data.filter(e => e.status === 'active');
              setTimetableEntries(activeEntries);
            }
          }
        } catch (err) {
          console.error('Error fetching timetable:', err);
        }

        const token = localStorage.getItem('token');
        if (!token && isMounted) {
          setMaterials([]);
          setTasks([]);
          setNotices([]);
          setProjects([]);
          setSubjectAccessDenied(false);
        }

        const bookRes = await fetch(`/api/library/books/public?subjectId=${id}`);
        const bookData = await bookRes.json();
        if (isMounted) {
          setBooks(Array.isArray(bookData?.data) ? bookData.data : []);
        }

        if (token) {
          const materialsRes = await fetch(`/api/academic/subjects/${id}/materials`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (materialsRes.ok) {
            const materialsData = await materialsRes.json();
            if (isMounted && Array.isArray(materialsData?.materials)) {
              setMaterials(materialsData.materials);
            }
          }

          const tasksRes = await fetch(`/api/tasks/subject/${id}?page=1&limit=4`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!tasksRes.ok && (tasksRes.status === 401 || tasksRes.status === 403)) {
            if (isMounted) {
              setSubjectAccessDenied(true);
              setTasks([]);
              setNotices([]);
            }
          } else if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            if (isMounted) {
              setSubjectAccessDenied(false);
              if (Array.isArray(tasksData?.data)) {
                setTasks(tasksData.data);
              }
            }

            const noticesRes = await fetch('/api/notices/board?page=1&limit=4&sortBy=newest', {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (noticesRes.ok) {
              const noticesData = await noticesRes.json();
              if (isMounted && Array.isArray(noticesData?.data)) {
                setNotices(noticesData.data);
              }
            }

            const projectsRes = await fetch(`/api/projects/subject/${id}?page=1&limit=4&status=all`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (projectsRes.ok) {
              const projectsData = await projectsRes.json();
              if (isMounted && Array.isArray(projectsData?.data)) {
                setProjects(projectsData.data);
              }
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load subject');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) load();
    return () => {
      isMounted = false;
    };
  }, [id, isLoggedIn]);

  const materialPreview = useMemo(() => materials.slice(0, 4), [materials]);
  const taskPreview = useMemo(() => tasks.slice(0, 4), [tasks]);
  const noticePreview = useMemo(() => notices.slice(0, 4), [notices]);
  const libraryPreview = useMemo(() => books.slice(0, 4), [books]);
  const projectPreview = useMemo(() => projects.slice(0, 4), [projects]);

  const handleJump = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <div className="max-w-[1200px] mx-auto px-4 pt-12 sm:pt-16 pb-8 space-y-5">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading subject hub...</div>
        ) : error && !subject ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 px-5 py-2 text-sm bg-primary text-white rounded-lg font-semibold"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-200">
                {error} Showing available subject information.
              </div>
            )}

            <section className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase w-fit">
                    {subject?.code}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-black leading-tight break-words">{subject?.name}</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                    {subject?.description || 'No description provided for this subject.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs font-semibold">
                    {subject?.branchId?.name && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {subject.branchId.name}
                      </span>
                    )}
                    {subject?.semesterId?.semesterNumber && (
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        Semester {subject.semesterId.semesterNumber}
                      </span>
                    )}
                    {subject?.credits && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        Credits {subject.credits}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-[180px]">
                  <button
                    onClick={() => handleJump('materials')}
                    className="px-4 py-2.5 text-sm rounded-xl bg-primary text-white font-bold hover:opacity-90 transition"
                  >
                    Explore Materials
                  </button>
                  <button
                    onClick={() => handleJump('timetable')}
                    className="px-4 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold hover:opacity-90 transition"
                  >
                    View Timetable
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => handleJump('library')} className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-xs font-semibold hover:border-primary/40">Library</button>
                {isLoggedIn && !subjectAccessDenied && (
                  <>
                    <button onClick={() => handleJump('tasks')} className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-xs font-semibold hover:border-primary/40">Tasks</button>
                    <button onClick={() => handleJump('notices')} className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-xs font-semibold hover:border-primary/40">Notices</button>
                    <button onClick={() => handleJump('projects')} className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-xs font-semibold hover:border-primary/40">Projects</button>
                  </>
                )}
              </div>

              {!isLoggedIn && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Public view only shows subject details, marks and library. Login to access Tasks, Notices and Projects.
                </div>
              )}

              {isLoggedIn && subjectAccessDenied && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                  You do not have access to subject modules for this subject. Only scoped users can view Tasks, Notices and Projects.
                </div>
              )}

              {/* Exam Type & Marks Section */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Exam Type Card */}
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-[10px] sm:text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">Exam Type</h3>
                  <p className="text-sm sm:text-xl font-black text-blue-700 dark:text-blue-200 capitalize leading-tight">
                    {subject?.type === 'theory+practical' ? 'Theory + Practical' : subject?.type || 'Theory'}
                  </p>
                </div>

                {/* Total Marks Card */}
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-[10px] sm:text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1">Total Marks</h3>
                  <p className="text-sm sm:text-xl font-black text-emerald-700 dark:text-emerald-200">
                    {subject?.marks?.totalMarks || 0}
                  </p>
                </div>
              </div>

              {/* Detailed Marks Breakdown */}
              {(subject?.marks?.theory?.total > 0 || subject?.marks?.practical?.total > 0) && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-[#dcdee5] dark:border-white/10">
                  <h3 className="text-base font-bold mb-4">Marks Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Theory Marks */}
                    {subject?.marks?.theory?.total > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-primary">Theory</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-white/10 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">Internal</span>
                            <span className="font-bold">{subject.marks.theory.internal || 0}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-white/10 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">External</span>
                            <span className="font-bold">{subject.marks.theory.external || 0}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg">
                            <span className="text-gray-900 dark:text-white font-bold">Total</span>
                            <span className="font-black text-primary">{subject.marks.theory.total || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Practical Marks */}
                    {subject?.marks?.practical?.total > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-primary">Practical</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-white/10 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">Internal</span>
                            <span className="font-bold">{subject.marks.practical.internal || 0}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-white/10 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">External</span>
                            <span className="font-bold">{subject.marks.practical.external || 0}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg">
                            <span className="text-gray-900 dark:text-white font-bold">Total</span>
                            <span className="font-black text-primary">{subject.marks.practical.total || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section id="materials" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="mb-4 p-4 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">Syllabus</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Official syllabus PDF for this subject.</p>
                  </div>
                  {subject?.syllabus ? (
                    <a
                      href={subject.syllabus}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-lg bg-primary text-white font-semibold hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      Open Syllabus PDF
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-500">Syllabus not uploaded yet.</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Materials</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Notes, slides, assignments, and resources.</p>
                </div>
                <button
                  onClick={() => navigate(`/subjects/${id}/materials`)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  View Full Library
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Log in to view full subject materials.</p>
                  <button onClick={() => navigate('/login')} className="mt-3 px-4 py-2 text-sm bg-primary text-white rounded-lg font-semibold">Login</button>
                </div>
              ) : materialPreview.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No materials added yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {materialPreview.map((item, index) => (
                    <div key={item._id || index} className="p-3 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{item.title || item.name || 'Material'}</p>
                        {item.category && (
                          <span className="text-[10px] sm:text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">{item.description || item.type || 'Academic resource'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Teachers & Class Information Section */}
            <section id="teachers" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg sm:text-2xl font-bold">Faculty & Class Schedule</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">Teachers assigned to this subject with their class timing and rooms.</p>
              </div>

              {timetableEntries.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">No class schedule available for this subject yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Group timetable entries by teacher */}
                  {(() => {
                    const teacherMap = {};
                    timetableEntries.forEach(entry => {
                      const teacherId = entry?.teacherId?._id || entry?.teacherId;
                      if (!teacherId) return;
                      if (!teacherMap[teacherId]) {
                        teacherMap[teacherId] = {
                          teacher: entry?.teacherId,
                          classes: []
                        };
                      }
                      teacherMap[teacherId].classes.push(entry);
                    });
                    return Object.values(teacherMap);
                  })().map((group, groupIdx) => (
                    <div key={`teacher-${groupIdx}`} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Teacher Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4">
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          {typeof group.teacher === 'object' ? group.teacher?.name : group.teacher}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {typeof group.teacher === 'object' ? group.teacher?.email : ''}
                        </p>
                      </div>

                      {/* Classes for this teacher */}
                      <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {group.classes.sort((a, b) => {
                          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
                          if (dayDiff !== 0) return dayDiff;
                          return (a.slot || 0) - (b.slot || 0);
                        }).map((entry, classIdx) => (
                          <div key={`class-${groupIdx}-${classIdx}`} className="p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {/* Day & Slot */}
                              <div>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">When</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{entry.dayOfWeek}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Slot {entry.slot}</p>
                              </div>

                              {/* Room */}
                              <div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Room</p>
                                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-1">
                                  {typeof entry.roomId === 'object' ? entry.roomId?.roomNo : entry.roomId}
                                </p>
                              </div>

                              {/* Division */}
                              <div>
                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Division</p>
                                <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-1">
                                  {entry.division && entry.division !== 'General' ? entry.division : 'General'}
                                </p>
                              </div>

                              {/* Type */}
                              <div>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Type</p>
                                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">
                                  {entry.lectureType === 'Lab' ? `Lab (${entry.slotSpan || 1} slots)` : 'Theory'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="timetable" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Timetable</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weekly schedule for this subject.</p>
                </div>
                <button
                  onClick={() => navigate('/student/timetable')}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Open Full Timetable
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Log in to view the timetable.</p>
                </div>
              ) : (
                <SubjectTimetableView subjectId={id} subjectName={subject?.name || 'Subject'} />
              )}
            </section>

            {isLoggedIn && !subjectAccessDenied && (
            <section id="tasks" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Tasks</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Assignments, submissions, and timelines.</p>
                </div>
                <button
                  onClick={() => navigate(`/subjects/${id}/tasks`)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  View All Tasks
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Log in to view tasks for this subject.</p>
                </div>
              ) : taskPreview.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No tasks available right now.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {taskPreview.map((task) => (
                    <div key={task._id} className="p-3 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{task.title}</p>
                          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {task.description?.slice(0, 120) || 'Subject task'}
                          </p>
                        </div>
                        {task.status && (
                          <span className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {task.status}
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-2">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            )}

            {isLoggedIn && !subjectAccessDenied && (
            <section id="notices" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Notices</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Latest announcements from the department.</p>
                </div>
                <button
                  onClick={() => navigate('/notices')}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Open Notice Board
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Log in to view notices.</p>
                </div>
              ) : noticePreview.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No notices yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {noticePreview.map((notice) => (
                    <div key={notice._id} className="p-3 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{notice.title}</p>
                      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notice.content?.slice(0, 120) || 'Notice'}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-2">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            )}

            <section id="library" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Library</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Recommended books and references.</p>
                </div>
                <button
                  onClick={() => navigate(`/student/library?subjectId=${id}`)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Open Library
                </button>
              </div>
              {libraryPreview.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No books listed for this subject.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {libraryPreview.map((book) => (
                    <div key={book._id} className="p-3 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{book.title}</p>
                      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">{book.author || 'Author not specified'}</p>
                      {book.publisher && (
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-2">{book.publisher}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isLoggedIn && !subjectAccessDenied && (
            <section id="projects" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Projects</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Capstones, mini-projects, and lab work.</p>
                </div>
                <button
                  onClick={() => navigate(`/subjects/${id}/projects`)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  View All Projects
                </button>
              </div>
              {projectPreview.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No projects available for this subject.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projectPreview.map((project) => (
                    <div key={project._id} className="p-3 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{project.title}</p>
                          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">{project.category || 'Project'}</p>
                        </div>
                        {project.status && (
                          <span className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                            {project.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {project.description || 'No description available.'}
                      </p>
                      {project.dueDate && (
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-2">Due: {new Date(project.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            )}
          </>
        )}
      </div>
    </LandingFrame>
  );
};

export default SubjectHub;
