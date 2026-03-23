import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoleLayout, Card, LoadingSpinner } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const TeacherSubjectWorkspace = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const [user, setUser] = useState(storedUser);
  const [subject, setSubject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { navItems, loading: navLoading } = useRoleNav(role);

  const panelLabel = role === 'admin'
    ? 'Admin Panel'
    : role === 'hod'
      ? 'HOD Panel'
      : role === 'coordinator'
        ? 'Coordinator Panel'
        : 'Teacher Panel';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const profileRes = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (!profileRes.ok || !profileData?.success) {
          navigate('/login');
          return;
        }

        const profile = profileData.data;
        setUser(profile);
        setRole(profile.role || 'teacher');

        const teacherId = profile?._id || profile?.id;
        if (!teacherId || !subjectId) {
          setError('Invalid subject workspace link.');
          return;
        }

        const subjectRes = await fetch(`/api/academic/teacher/${teacherId}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const subjectData = await subjectRes.json();

        if (!subjectRes.ok || !subjectData?.success) {
          setError(subjectData?.message || 'Unable to load subject workspace');
          return;
        }

        const subjectList = Array.isArray(subjectData?.subjects) ? subjectData.subjects : [];
        const selected = subjectList.find((item) => String(item?._id) === String(subjectId));

        if (!selected) {
          setError('This subject is not assigned to you.');
          return;
        }

        setSubject(selected);

        const sid = String(selected._id);
        const [materialsRes, tasksRes, projectsRes, booksRes, timetableRes] = await Promise.all([
          fetch(`/api/academic/subjects/${sid}/materials`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`/api/tasks/subject/${sid}?page=1&limit=4`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`/api/projects/subject/${sid}?page=1&limit=4&status=all`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`/api/library/books/public?subjectId=${sid}`),
          fetch(`/api/timetable/subject/${sid}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setMaterials(Array.isArray(materialsData?.materials) ? materialsData.materials : []);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(Array.isArray(tasksData?.data) ? tasksData.data : []);
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(Array.isArray(projectsData?.data) ? projectsData.data : []);
        }

        if (booksRes.ok) {
          const booksData = await booksRes.json();
          setBooks(Array.isArray(booksData?.data) ? booksData.data.slice(0, 5) : []);
        }

        if (timetableRes.ok) {
          const timetableData = await timetableRes.json();
          const active = Array.isArray(timetableData?.data)
            ? timetableData.data.filter((entry) => entry?.status === 'active').slice(0, 5)
            : [];
          setTimetableEntries(active);
        }
      } catch (err) {
        console.error('Teacher subject workspace error:', err);
        setError('Failed to load subject workspace');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, subjectId]);

  const stats = useMemo(() => ({
    materials: materials.length,
    tasks: tasks.length,
    projects: projects.length,
    books: books.length,
    timetable: timetableEntries.length
  }), [books.length, materials.length, projects.length, tasks.length, timetableEntries.length]);

  const openWithSubject = (path) => {
    if (!subject?._id) return;
    navigate(`${path}?subjectId=${subject._id}`, { state: { subjectId: subject._id, subject } });
  };

  return (
    <RoleLayout
      title="Subject Workspace"
      userName={user?.name || 'Teacher'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      {loading ? (
        <div className="min-h-[55vh] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-10 space-y-3">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/teacher/subjects')}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
            >
              Back to Subjects
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e40af] to-[#0f766e] text-white p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-100">Teacher Subject Workspace</p>
            <h1 className="text-2xl md:text-3xl font-black mt-2">{subject?.name || 'Subject'}</h1>
            <p className="text-sky-100 mt-2 text-sm md:text-base">
              {subject?.code ? `${subject.code} • ` : ''}
              {subject?.branchId?.name || 'Branch N/A'}
              {' • '}
              Semester {subject?.semesterId?.semesterNumber || 'N/A'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-white/15">Materials: {stats.materials}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Tasks: {stats.tasks}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Projects: {stats.projects}</span>
              <span className="px-3 py-1 rounded-full bg-white/15">Books: {stats.books}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Materials</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{materials.length}</span>
                </div>
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-500">No materials yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {materials.slice(0, 3).map((item) => (
                      <li key={item._id} className="truncate">• {item.title || item.link || 'Untitled material'}</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => openWithSubject('/teacher/materials')} className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">
                  Open Materials
                </button>
              </div>
            </Card>

            <Card className="border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Tasks</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 font-semibold">{tasks.length}</span>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {tasks.slice(0, 3).map((item) => (
                      <li key={item._id} className="truncate">• {item.title || 'Untitled task'}</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => openWithSubject('/teacher/tasks')} className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">
                  Open Tasks
                </button>
              </div>
            </Card>

            <Card className="border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Projects</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">{projects.length}</span>
                </div>
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500">No projects yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {projects.slice(0, 3).map((item) => (
                      <li key={item._id} className="truncate">• {item.title || 'Untitled project'}</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => openWithSubject('/teacher/projects')} className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">
                  Open Projects
                </button>
              </div>
            </Card>

            <Card className="border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Timetable</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{timetableEntries.length}</span>
                </div>
                {timetableEntries.length === 0 ? (
                  <p className="text-sm text-gray-500">No timetable entries yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {timetableEntries.slice(0, 3).map((item) => (
                      <li key={item._id} className="truncate">• {item.dayOfWeek} - Slot {item.slot}</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => openWithSubject('/teacher/timetable')} className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">
                  Open Timetable
                </button>
              </div>
            </Card>

            <Card className="border border-gray-200 md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Library</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">{books.length}</span>
                </div>
                {books.length === 0 ? (
                  <p className="text-sm text-gray-500">No library books found for this subject.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                    {books.slice(0, 4).map((book) => (
                      <div key={book._id || `${book.title}-${book.author}`} className="rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
                        <p className="font-semibold truncate">{book.title || 'Untitled Book'}</p>
                        <p className="text-xs text-gray-500 truncate">{book.author || 'Unknown Author'}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => navigate('/teacher/library')} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">
                    Open Library
                  </button>
                  <button onClick={() => navigate('/teacher/subjects')} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700">
                    Change Subject
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default TeacherSubjectWorkspace;