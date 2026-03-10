import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const SubjectProjects = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/projects/subject/${subjectId}?page=1&limit=50&status=all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load projects');
        }

        if (!isMounted) return;
        setSubject(data.subject || null);
        setProjects(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load projects');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (subjectId) load();

    return () => {
      isMounted = false;
    };
  }, [navigate, subjectId]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;

    return projects.filter((project) =>
      project.title?.toLowerCase().includes(term)
      || project.description?.toLowerCase().includes(term)
      || project.category?.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  const getStatusStyle = (status) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'draft') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <div className="max-w-[1100px] mx-auto px-6 pt-28 pb-16 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Subject Projects</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {subject?.name ? `${subject.name} (${subject.code || 'N/A'})` : 'Projects and practical work'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/subjects/${subjectId}`)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold"
          >
            Back to Subject
          </button>
        </div>

        <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-4">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, category, or description"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading projects...</div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No projects available for this subject.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <article key={project._id} className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{project.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{project.category || 'Project'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(project.status)}`}>
                    {project.status || 'active'}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {project.description || 'No description available.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  {project.teamSize ? <span>Team Size: {project.teamSize}</span> : null}
                  {project.dueDate ? <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span> : null}
                  {project.createdBy?.name ? <span>By: {project.createdBy.name}</span> : null}
                </div>

                {Array.isArray(project.resources) && project.resources.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Resources</p>
                    {project.resources.slice(0, 4).map((resource, idx) => (
                      <a
                        key={`${project._id}-resource-${idx}`}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        {resource.name || 'Project Resource'}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </LandingFrame>
  );
};

export default SubjectProjects;
