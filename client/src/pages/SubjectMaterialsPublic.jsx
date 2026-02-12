import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const SubjectMaterialsPublic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSubject = location.state?.subject || null;
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState(initialSubject);
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
  }, [id, initialSubject]);

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
  const hasMarks = [
    marks?.theory?.internal,
    marks?.theory?.external,
    marks?.theory?.total,
    marks?.practical?.internal,
    marks?.practical?.external,
    marks?.practical?.total,
    marks?.totalMarks,
    marks?.passingMarks
  ].some((value) => Number(value) > 0);
  const hasSyllabus = Boolean(subject?.syllabus);
  const hasFaculty = Boolean(
    subject?.faculty?.name ||
    subject?.faculty?.email ||
    subject?.faculty?.office
  );

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <main className="max-w-[1200px] mx-auto px-6 py-10 pt-28 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(`/subjects/${id}`)}
            className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10"
          >
            Back to Subject Hub
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Home
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
                {error} Showing basic subject information.
              </div>
            )}
            <section className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                    {subject?.code}
                  </div>
                  <h2 className="text-2xl font-bold mt-3">{subject?.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-3xl">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-[#dcdee5] dark:border-white/10">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Course Type</p>
                    <p className="text-lg font-bold capitalize">{subject?.type || 'theory'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-[#dcdee5] dark:border-white/10">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Credits</p>
                    <p className="text-lg font-bold">{subject?.credits ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">grading</span>
                  Marks Distribution
                </h3>
                {hasMarks ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2">Component</th>
                          <th className="py-2">Internal</th>
                          <th className="py-2">External</th>
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
                        <tr className="border-t border-[#f0f1f4] dark:border-white/10">
                          <td className="py-2 font-semibold">Overall</td>
                          <td className="py-2" colSpan={2}>Total Marks</td>
                          <td className="py-2 font-bold">{marks?.totalMarks ?? 0}</td>
                        </tr>
                        <tr className="border-t border-[#f0f1f4] dark:border-white/10">
                          <td className="py-2 font-semibold">Passing</td>
                          <td className="py-2" colSpan={2}>Passing Marks</td>
                          <td className="py-2 font-bold">{marks?.passingMarks ?? 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Marks distribution has not been updated yet.</div>
                )}
              </div>

              <div className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Subject Details
                </h3>
                {hasSyllabus || hasFaculty ? (
                  <div className="space-y-4 text-sm">
                    {hasSyllabus && (
                      <div className="border-b border-[#f0f1f4] dark:border-white/10 pb-3">
                        <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Syllabus</p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{subject?.syllabus}</p>
                      </div>
                    )}
                    {hasFaculty && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Faculty</p>
                            <p className="text-gray-700 dark:text-gray-300 font-semibold">{subject?.faculty?.name || 'Not Assigned'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Email</p>
                            <p className="text-gray-700 dark:text-gray-300 font-semibold break-all text-xs">{subject?.faculty?.email || 'Not Available'}</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Office Location</p>
                          <p className="text-gray-700 dark:text-gray-300 font-semibold">{subject?.faculty?.office || 'Not Available'}</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Subject details have not been updated yet.</div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-white/5 border border-[#dcdee5] dark:border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_open</span>
                Study Materials
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filter by Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
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
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
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

              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">folder_open</span>
                  No materials available {selectedCategory !== 'All' ? `in "${selectedCategory}" category` : ''}.
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((mat) => (
                    <div key={mat._id} className="border border-[#f0f1f4] dark:border-white/10 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{mat.title}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {mat.category}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 capitalize">
                              {mat.addedByRole}
                            </span>
                          </div>
                          {mat.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{mat.description}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Uploaded on {formatDate(mat.uploadedAt)}
                          </p>
                        </div>
                        <a
                          href={mat.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Open Link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </LandingFrame>
  );
};

export default SubjectMaterialsPublic;
