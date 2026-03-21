import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LandingFrame, StudentLayout } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const SubjectMaterialsPublic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSubject = location.state?.subject || null;
  const sourceFromState = location.state?.source;
  const sourceFromQuery = new URLSearchParams(location.search).get('source');
  const isStudentContext = sourceFromState === 'student-panel' || sourceFromQuery === 'student-panel';
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (_) {
      return {};
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [assignedFaculty, setAssignedFaculty] = useState([]);
  const [subjectTimetableRows, setSubjectTimetableRows] = useState([]);
  const [subjectTasks, setSubjectTasks] = useState([]);
  const [subjectLibraryBooks, setSubjectLibraryBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/academic/subjects/${id}/public`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load subject');
        }
        setSubject(data.subject);

        // If logged in, try fetching full materials list
        if (token) {
          try {
            const matRes = await fetch(`/api/academic/subjects/${id}/materials`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const matData = await matRes.json();
            if (matData?.success && Array.isArray(matData.materials)) {
              setSubject((prev) => ({
                ...prev,
                materials: matData.materials
              }));
            }
          } catch (matErr) {
            console.error('Failed to load materials with auth:', matErr);
          }

          if (isStudentContext) {
            try {
              const [ttRes, taskRes, libraryRes] = await Promise.all([
                fetch(`/api/timetable/subject/${id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`/api/tasks/subject/${id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`/api/library/books/public?subjectId=${id}`)
              ]);

              const ttData = await ttRes.json();
              const taskData = await taskRes.json();
              const libraryData = await libraryRes.json();

              const rows = Array.isArray(ttData?.data) ? ttData.data : [];
              const taskRows = Array.isArray(taskData?.data) ? taskData.data : [];
              const bookRows = Array.isArray(libraryData?.data) ? libraryData.data : [];

              setSubjectTasks(taskRows);
              setSubjectLibraryBooks(bookRows);
              setSubjectTimetableRows(rows);

              const teachersMap = new Map();
              rows.forEach((row) => {
                const teacherId = row?.teacherId?._id;
                if (!teacherId) return;
                if (!teachersMap.has(teacherId)) {
                  teachersMap.set(teacherId, {
                    id: teacherId,
                    name: String(row?.teacherId?.name || '').trim(),
                    email: String(row?.teacherId?.email || '').trim()
                  });
                }
              });
              setAssignedFaculty(Array.from(teachersMap.values()));
            } catch (facultyErr) {
              console.error('Failed to load student module data:', facultyErr);
              setSubjectTasks([]);
              setSubjectLibraryBooks([]);
              setSubjectTimetableRows([]);
              setAssignedFaculty([]);
            }
          }
        }
      } catch (err) {
        const message = err.message || 'Failed to load subject';
        setError(message);
        if (initialSubject) {
          setSubject(initialSubject);
        } else {
          try {
            const fallbackRes = await fetch('/api/academic/subjects');
            const fallbackData = await fallbackRes.json();
            const fallbackSubject = fallbackData?.data?.find((item) => item._id === id);
            if (fallbackSubject) {
              setSubject(fallbackSubject);
              setError('Detailed materials are not available.');
            }
          } catch (fallbackErr) {
            setError(message);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSubject();
  }, [id, initialSubject, isStudentContext]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/academic/subjects/${id}/materials/categories`);
        const data = await res.json();
        if (data?.success) {
          const apiCategories = Array.isArray(data.categories) ? data.categories : [];
          const cleaned = apiCategories.filter((cat) => cat && cat !== 'All');
          setCategories(cleaned);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    if (id) fetchCategories();
  }, [id]);

  const materials = useMemo(() => {
    const allMaterials = subject?.materials || [];
    if (selectedCategory === 'All') return allMaterials;
    return allMaterials.filter(mat => mat.category === selectedCategory);
  }, [subject, selectedCategory]);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  const marks = subject?.marks || {};
  const rawSyllabus = typeof subject?.syllabus === 'string' ? subject.syllabus.trim() : '';
  const isSyllabusUrl = /^https?:\/\//i.test(rawSyllabus) || /^\/[^\s]+/.test(rawSyllabus);
  const syllabusLink = isSyllabusUrl ? rawSyllabus : '';

  const fallbackFaculty = {
    id: 'subject-faculty',
    name: typeof subject?.faculty?.name === 'string' ? subject.faculty.name.trim() : '',
    email: typeof subject?.faculty?.email === 'string' ? subject.faculty.email.trim() : ''
  };

  const facultyList = (isStudentContext ? assignedFaculty : [fallbackFaculty])
    .map((item, index) => ({
      id: String(item?.id || item?._id || `faculty-${index}`),
      name: String(item?.name || '').trim(),
      email: String(item?.email || '').trim()
    }))
    .filter((item, index, array) => item.name && array.findIndex((x) => x.name === item.name && x.email === item.email) === index);

  const hasFacultyName = facultyList.length > 0;
  const hasFacultyEmail = facultyList.some((item) => Boolean(item.email));
  const hasMarks = [
    marks?.theory?.internal,
    marks?.theory?.external,
    marks?.theory?.total,
    marks?.practical?.internal,
    marks?.practical?.external,
    marks?.practical?.total,
    marks?.totalMarks
  ].some((value) => Number(value) > 0);
  const hasSyllabus = Boolean(syllabusLink);
  const materialCount = Array.isArray(subject?.materials) ? subject.materials.length : 0;

  const latestTasks = subjectTasks
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 2);

  const latestLibraryBooks = subjectLibraryBooks
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 2);

  const timetablePreviewRows = subjectTimetableRows
    .slice()
    .sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayDiff = dayOrder.indexOf(String(a.dayOfWeek)) - dayOrder.indexOf(String(b.dayOfWeek));
      if (dayDiff !== 0) return dayDiff;
      return Number(a.slot || 1) - Number(b.slot || 1);
    })
    .slice(0, 3);

  const pageContent = (
    <main className={`mx-auto space-y-4 sm:space-y-8 ${isStudentContext ? 'max-w-[1400px] px-2 sm:px-5 py-3 sm:py-5' : 'max-w-[1200px] px-4 sm:px-6 py-8 pt-24 sm:pt-28'}`}>
      <div className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 ${isStudentContext ? 'sticky top-2 z-20 bg-white/90 dark:bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-[#e5e7eb] dark:border-white/10' : ''}`}>
        <button
          onClick={() => navigate(isStudentContext ? '/student/subjects' : `/subjects/${id}`)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-primary text-primary font-semibold text-sm sm:text-base hover:bg-primary/10"
        >
          {isStudentContext ? 'Back to My Subjects' : 'Back to Subject Hub'}
        </button>
        <button
          onClick={() => navigate(isStudentContext ? '/student/dashboard' : '/')}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
        >
          {isStudentContext ? 'Go to Dashboard' : 'Go to Home'}
        </button>
      </div>
      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500">Loading subject details...</p>
        </div>
      ) : error && !subject ? (
        <div className="text-center py-20">
          <p className="text-red-500 font-semibold">{error}</p>
          <button
            onClick={() => navigate(isStudentContext ? '/student/subjects' : '/')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold"
          >
            {isStudentContext ? 'Back to My Subjects' : 'Back to Home'}
          </button>
        </div>
      ) : (
          <>
            {error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-200">
                {error} Showing basic subject information.
              </div>
            )}
            <section className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase break-all">
                    {subject?.code}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mt-3 break-words">{subject?.name}</h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 max-w-3xl break-words">
                    {subject?.description || 'No description provided for this subject.'}
                  </p>
                  {(subject?.branchId?.name || subject?.semesterId?.semesterNumber) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
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
                    </div>
                  )}
                </div>
                <div className="w-full md:w-auto rounded-xl bg-gray-50 dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Course Type: <span className="capitalize">{subject?.type || 'N/A'}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    Credits: {subject?.credits ?? 'N/A'}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-3 sm:gap-6">
              <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">grading</span>
                  Marks Distribution
                </h3>
                {hasMarks ? (
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-2">Type</th>
                          <th className="py-2 pr-2">Internal</th>
                          <th className="py-2 pr-2">External</th>
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 dark:text-gray-300">
                        <tr className="border-t border-[#f0f1f4] dark:border-white/10">
                          <td className="py-2 font-semibold">Theory</td>
                          <td className="py-2">{marks?.theory?.internal ?? 0}</td>
                          <td className="py-2">{marks?.theory?.external ?? 0}</td>
                          <td className="py-2">{marks?.theory?.total ?? 0}</td>
                        </tr>
                        <tr className="border-t border-[#f0f1f4] dark:border-white/10">
                          <td className="py-2 font-semibold">Practical</td>
                          <td className="py-2">{marks?.practical?.internal ?? 0}</td>
                          <td className="py-2">{marks?.practical?.external ?? 0}</td>
                          <td className="py-2">{marks?.practical?.total ?? 0}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
                      Total Marks: {marks?.totalMarks ?? 0}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Marks distribution has not been updated yet.</div>
                )}
              </div>

              <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Faculty Assignment
                </h3>
                {facultyList.length === 0 ? (
                  <div className="rounded-lg border border-[#f0f1f4] dark:border-white/10 bg-[#f8fafc] dark:bg-white/5 p-3 text-sm text-amber-700 dark:text-amber-300">
                    No teacher is assigned for this subject yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {facultyList.map((faculty, idx) => (
                      <div key={faculty.id} className="rounded-lg border border-[#f0f1f4] dark:border-white/10 bg-[#f8fafc] dark:bg-white/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Teacher {idx + 1}</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 break-words">{faculty.name}</p>
                        {faculty.email ? (
                          <a href={`mailto:${faculty.email}`} className="text-xs font-semibold text-primary break-all hover:underline mt-1 inline-block">{faculty.email}</a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6">
              <details className="mb-4 sm:mb-6 rounded-xl border border-[#f0f1f4] dark:border-white/10 bg-[#fffdf5] dark:bg-amber-900/10 p-3 sm:p-4">
                <summary className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 cursor-pointer flex items-center gap-2">
                  Data Completeness Tracker
                </summary>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mt-2">
                  {!hasSyllabus && <p>• Syllabus file is not uploaded by faculty/admin.</p>}
                  {!hasFacultyName && <p>• Teacher name is not assigned yet.</p>}
                  {!hasFacultyEmail && <p>• Teacher email is not added yet.</p>}
                  {!hasMarks && <p>• Marks pattern is not published yet.</p>}
                  {materialCount === 0 && <p>• Study materials are not uploaded yet.</p>}
                  {hasSyllabus && hasFacultyName && hasFacultyEmail && hasMarks && materialCount > 0 && (
                    <p className="text-green-700 dark:text-green-300 font-semibold">All major academic details are available.</p>
                  )}
                </div>
              </details>

              <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border border-[#f0f1f4] dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                      Syllabus
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open official syllabus file.</p>
                  </div>
                  {syllabusLink ? (
                    <a
                      href={syllabusLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Open Syllabus
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">Syllabus file not uploaded yet.</span>
                  )}
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_open</span>
                Study Materials
              </h3>

              {/* Category Filter */}
              <div className="mb-4 sm:mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filter by Category</p>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-1">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                      selectedCategory === 'All'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  </div>
                </div>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500 space-y-2">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">folder_open</span>
                  <p>No materials available {selectedCategory !== 'All' ? `in "${selectedCategory}" category` : ''}.</p>
                  <p className="text-xs text-gray-500">
                    Files appear here once faculty uploads links, notes, or references for this subject.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((mat) => (
                    <div key={mat._id} className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white break-words">{mat.title}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {mat.category || 'Uncategorized'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 capitalize">
                              {mat.addedByRole || 'staff'}
                            </span>
                          </div>
                          {mat.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">{mat.description}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 break-words">
                            Uploaded on {formatDate(mat.uploadedAt)}
                          </p>
                        </div>
                        <a
                          href={mat.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full sm:w-auto justify-center items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Open Link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isStudentContext && (
                <div className="mt-5 sm:mt-8 space-y-5 sm:space-y-8">
                  <div className="space-y-2.5 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">assignment</span>
                      Subject Tasks
                    </h3>
                    {latestTasks.length === 0 ? (
                      <div className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-4 text-sm text-gray-500">
                        No tasks assigned for this subject yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {latestTasks.map((task) => (
                          <div key={task._id} className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white break-words">{task.title || 'Untitled Task'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Due: {task?.dueDate ? formatDate(task.dueDate) : 'N/A'}
                                </p>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 capitalize">
                                {String(task.status || 'pending').replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">local_library</span>
                      Subject Library Resources
                    </h3>
                    {latestLibraryBooks.length === 0 ? (
                      <div className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-4 text-sm text-gray-500">
                        No library resources linked to this subject yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {latestLibraryBooks.map((book) => (
                          <div key={book._id} className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-3 sm:p-4">
                            <p className="font-semibold text-gray-900 dark:text-white break-words">{book.title || 'Untitled Resource'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Author: {book.author || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">calendar_month</span>
                      Subject Timetable Slots
                    </h3>
                    {timetablePreviewRows.length === 0 ? (
                      <div className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-4 text-sm text-gray-500">
                        No timetable slots assigned for this subject yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {timetablePreviewRows.map((row) => (
                          <div key={row._id} className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white">{row.dayOfWeek || 'Day N/A'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Slot {row.slot || '-'} | {row.lectureType || 'Class'} | Room {row?.roomId?.roomNo || '-'}
                                </p>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                                {row.division || 'General'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
  );

  if (isStudentContext) {
    return (
      <StudentLayout title={subject?.name || 'Subject Materials'} userName={storedUser?.name || 'Student'}>
        {pageContent}
      </StudentLayout>
    );
  }

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      {pageContent}
    </LandingFrame>
  );
};

export default SubjectMaterialsPublic;
