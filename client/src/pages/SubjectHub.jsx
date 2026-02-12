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

        const token = localStorage.getItem('token');
        if (!token && isMounted) {
          setMaterials([]);
          setTasks([]);
          setNotices([]);
        }

        const bookRes = await fetch(`/api/library/books/public?subjectId=${id}`);
        const bookData = await bookRes.json();
        if (isMounted) {
          setBooks(Array.isArray(bookData?.data) ? bookData.data : []);
        }

        if (token) {
          const [materialsRes, tasksRes, noticesRes] = await Promise.allSettled([
            fetch(`/api/academic/subjects/${id}/materials`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`/api/tasks/subject/${id}?page=1&limit=4`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch('/api/notices/board?page=1&limit=4&sortBy=newest', {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          if (materialsRes.status === 'fulfilled') {
            const materialsData = await materialsRes.value.json();
            if (isMounted && Array.isArray(materialsData?.materials)) {
              setMaterials(materialsData.materials);
            }
          }

          if (tasksRes.status === 'fulfilled') {
            const tasksData = await tasksRes.value.json();
            if (isMounted && Array.isArray(tasksData?.data)) {
              setTasks(tasksData.data);
            }
          }

          if (noticesRes.status === 'fulfilled') {
            const noticesData = await noticesRes.value.json();
            if (isMounted && Array.isArray(noticesData?.data)) {
              setNotices(noticesData.data);
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
      <div className="max-w-[1200px] mx-auto px-6 pt-28 pb-16 space-y-12">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading subject hub...</div>
        ) : error && !subject ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold"
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

            <section className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                    {subject?.code}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black">{subject?.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                    {subject?.description || 'No description provided for this subject.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {subject?.branchId?.name && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {subject.branchId.name}
                      </span>
                    )}
                    {subject?.semesterId?.semesterNumber && (
                      <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        Semester {subject.semesterId.semesterNumber}
                      </span>
                    )}
                    {subject?.credits && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        Credits {subject.credits}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleJump('materials')}
                    className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition"
                  >
                    Explore Materials
                  </button>
                  <button
                    onClick={() => handleJump('timetable')}
                    className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold hover:opacity-90 transition"
                  >
                    View Timetable
                  </button>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => handleJump('tasks')} className="px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-sm font-semibold hover:border-primary/40">Tasks</button>
                <button onClick={() => handleJump('notices')} className="px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-sm font-semibold hover:border-primary/40">Notices</button>
                <button onClick={() => handleJump('library')} className="px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-sm font-semibold hover:border-primary/40">Library</button>
                <button onClick={() => handleJump('projects')} className="px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 text-sm font-semibold hover:border-primary/40">Projects</button>
              </div>
            </section>

            <section id="materials" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Materials</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes, slides, assignments, and resources.</p>
                </div>
                <button
                  onClick={() => navigate(`/subjects/${id}/materials`)}
                  className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  View Full Library
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Log in to view full subject materials.</p>
                  <button onClick={() => navigate('/login')} className="mt-3 px-5 py-2 bg-primary text-white rounded-lg font-semibold">Login</button>
                </div>
              ) : materialPreview.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No materials added yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materialPreview.map((item, index) => (
                    <div key={item._id || index} className="p-4 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title || item.name || 'Material'}</p>
                        {item.category && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{item.description || item.type || 'Academic resource'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="timetable" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Timetable</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Weekly schedule for this subject.</p>
                </div>
                <button
                  onClick={() => navigate('/student/timetable')}
                  className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Open Full Timetable
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Log in to view the timetable.</p>
                </div>
              ) : (
                <SubjectTimetableView subjectId={id} subjectName={subject?.name || 'Subject'} />
              )}
            </section>

            <section id="tasks" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Tasks</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assignments, submissions, and timelines.</p>
                </div>
                <button
                  onClick={() => navigate(`/subjects/${id}/tasks`)}
                  className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  View All Tasks
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Log in to view tasks for this subject.</p>
                </div>
              ) : taskPreview.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No tasks available right now.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taskPreview.map((task) => (
                    <div key={task._id} className="p-4 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {task.description?.slice(0, 120) || 'Subject task'}
                          </p>
                        </div>
                        {task.status && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {task.status}
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-3">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="notices" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Notices</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Latest announcements from the department.</p>
                </div>
                <button
                  onClick={() => navigate('/notices')}
                  className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Open Notice Board
                </button>
              </div>
              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Log in to view notices.</p>
                </div>
              ) : noticePreview.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No notices yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {noticePreview.map((notice) => (
                    <div key={notice._id} className="p-4 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <p className="font-semibold text-gray-900 dark:text-white">{notice.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notice.content?.slice(0, 120) || 'Notice'}
                      </p>
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="library" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Library</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recommended books and references.</p>
                </div>
                <button
                  onClick={() => navigate(`/student/library?subjectId=${id}`)}
                  className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Open Library
                </button>
              </div>
              {libraryPreview.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No books listed for this subject.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {libraryPreview.map((book) => (
                    <div key={book._id} className="p-4 rounded-xl border border-[#dcdee5] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <p className="font-semibold text-gray-900 dark:text-white">{book.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{book.author || 'Author not specified'}</p>
                      {book.publisher && (
                        <p className="text-xs text-gray-500 mt-2">{book.publisher}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="projects" className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Projects</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Capstones, mini-projects, and lab work.</p>
                </div>
                <button
                  onClick={() => navigate(`/subjects/${id}/tasks`)}
                  className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  View Project Tasks
                </button>
              </div>
              <div className="text-center py-10 text-gray-500">Project workspace is coming soon.</div>
            </section>
          </>
        )}
      </div>
    </LandingFrame>
  );
};

export default SubjectHub;
