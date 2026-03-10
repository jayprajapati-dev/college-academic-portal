import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, RoleLayout, StatsCard } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';

const RoleAcademicStructure = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [role, setRole] = useState(storedUser?.role || 'teacher');
  const { navItems, loading: navLoading } = useRoleNav(role);

  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSemesters, setExpandedSemesters] = useState(new Set());
  const [expandedBranches, setExpandedBranches] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalSemesters: 0,
    totalBranches: 0,
    totalSubjects: 0
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.success) {
        navigate('/login');
        return;
      }

      setUser(data.data);
      setRole(data.data.role);
    } catch (error) {
      console.error('Profile error:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchStructure = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/academic/structure', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const structureData = response.data.structure || [];
        setStructure(structureData);

        const totalSemesters = structureData.length;
        const totalBranches = structureData.reduce((sum, sem) => sum + (sem.branches?.length || 0), 0);
        const totalSubjects = structureData.reduce((sum, sem) =>
          sum + (sem.branches?.reduce((branchSum, branch) =>
            branchSum + (branch.subjects?.length || 0), 0) || 0), 0);

        setStats({ totalSemesters, totalBranches, totalSubjects });
      }
    } catch (error) {
      console.error('Error fetching structure:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const toggleSemester = (semesterId) => {
    setExpandedSemesters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(semesterId)) {
        newSet.delete(semesterId);
      } else {
        newSet.add(semesterId);
      }
      return newSet;
    });
  };

  const toggleBranch = (branchId) => {
    setExpandedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branchId)) {
        newSet.delete(branchId);
      } else {
        newSet.add(branchId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allSemesterIds = structure.map(s => s._id);
    const allBranchIds = structure.flatMap(s => s.branches?.map(b => b._id) || []);
    setExpandedSemesters(new Set(allSemesterIds));
    setExpandedBranches(new Set(allBranchIds));
  };

  const collapseAll = () => {
    setExpandedSemesters(new Set());
    setExpandedBranches(new Set());
  };

  const getSemesterIcon = (semNumber) => {
    const icons = ['looks_one', 'looks_two', 'looks_3', 'looks_4', 'looks_5', 'looks_6'];
    return icons[semNumber - 1] || 'school';
  };

  const filteredStructure = useMemo(() => {
    if (!searchQuery.trim()) return structure;

    const query = searchQuery.toLowerCase();
    return structure
      .map(semester => ({
        ...semester,
        branches: semester.branches?.filter(branch =>
          branch.name?.toLowerCase().includes(query) ||
          branch.code?.toLowerCase().includes(query) ||
          branch.subjects?.some(subject =>
            subject.name?.toLowerCase().includes(query) ||
            subject.code?.toLowerCase().includes(query)
          )
        ) || []
      }))
      .filter(semester =>
        semester.name?.toLowerCase().includes(query) ||
        semester.academicYear?.toLowerCase().includes(query) ||
        semester.branches.length > 0
      );
  }, [structure, searchQuery]);

  const panelLabel = role === 'admin' ? 'Admin Panel' : role === 'hod' ? 'HOD Panel' : role === 'coordinator' ? 'Coordinator Panel' : 'Teacher Panel';

  if (loading) {
    return (
      <RoleLayout
        title="Academic Structure"
        userName={user?.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={panelLabel}
        profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Academic Structure"
      userName={user?.name || 'User'}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={navLoading}
      panelLabel={panelLabel}
      profileLinks={role === 'admin' ? [] : [{ label: 'Profile', to: `/${role}/profile` }]}
    >
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 sm:gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary">account_tree</span>
              Academic Structure
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 font-medium">
                View semesters, branches, and subjects quickly.
              </p>
              {role !== 'admin' && (
                <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 inline-flex mt-2 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-700/50">
                  Editing is handled in Subjects for your assigned scope.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative w-full sm:w-80 lg:w-[320px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.5 3a5.5 5.5 0 014.358 8.858l3.142 3.142a1 1 0 01-1.414 1.414l-3.142-3.142A5.5 5.5 0 118.5 3zm-3.5 5.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search semesters, branches, or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold bg-white/80 dark:bg-gray-800/80 whitespace-nowrap w-full sm:w-auto"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold bg-white/80 dark:bg-gray-800/80 whitespace-nowrap w-full sm:w-auto"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatsCard icon="calendar_month" label="Total Semesters" value={stats.totalSemesters} bgColor="bg-gradient-to-br from-blue-500 to-blue-600" compact />
          <StatsCard icon="apartment" label="Total Branches" value={stats.totalBranches} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" compact />
          <StatsCard icon="menu_book" label="Total Subjects" value={stats.totalSubjects} bgColor="bg-gradient-to-br from-purple-500 to-purple-600" compact />
        </div>

        <Card title="Structure Explorer" subtitle="Expand semesters and branches to view subjects">
          <div className="space-y-3">
            {filteredStructure.map((semester) => (
              <div key={semester._id} className="border border-[#E6E9EF] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSemester(semester._id)}
                  className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] dark:from-gray-800 dark:to-gray-700 hover:brightness-[0.99] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#6B7280]">
                      {getSemesterIcon(semester.semesterNumber)}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold text-sm sm:text-base">{semester.name || `Semester ${semester.semesterNumber}`}</p>
                      <p className="text-xs text-[#6B7280]">Academic Year: {semester.academicYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold bg-[#E6E9EF] dark:bg-gray-600 text-[#111318] dark:text-gray-100 px-2 py-0.5 rounded-full">
                      {semester.branches?.length || 0} Branches
                    </span>
                    <span className="material-symbols-outlined text-[#6B7280]">
                      {expandedSemesters.has(semester._id) ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {expandedSemesters.has(semester._id) && semester.branches && (
                  <div className="px-3.5 sm:px-4 py-3.5 space-y-2.5 bg-white dark:bg-gray-900">
                    {semester.branches.map((branch) => (
                      <div key={branch._id} className="border border-[#E6E9EF] dark:border-gray-700 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleBranch(branch._id)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-[#F8FAFC] dark:bg-gray-800 hover:bg-[#F1F5F9] dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#6B7280]">apartment</span>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{branch.name}</p>
                              <p className="text-xs text-[#6B7280]">Code: {branch.code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold bg-[#E6E9EF] dark:bg-gray-600 text-[#111318] dark:text-gray-100 px-2 py-0.5 rounded-full">
                              {branch.subjects?.length || 0} Subjects
                            </span>
                            <span className="material-symbols-outlined text-[#6B7280]">
                              {expandedBranches.has(branch._id) ? 'expand_less' : 'expand_more'}
                            </span>
                          </div>
                        </button>

                        {expandedBranches.has(branch._id) && branch.subjects && (
                          <div className="px-3 py-3 bg-white dark:bg-gray-900">
                            {branch.subjects.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                                {branch.subjects.map((subject) => (
                                  <div key={subject._id} className="border border-[#E6E9EF] dark:border-gray-700 rounded-lg p-2.5 hover:border-[#111318] dark:hover:border-gray-400 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{subject.name}</p>
                                        <p className="text-xs text-[#6B7280]">{subject.code}</p>
                                      </div>
                                      <span className="text-[11px] font-semibold bg-[#F1F5F9] dark:bg-gray-700 text-[#111318] dark:text-gray-100 px-2 py-0.5 rounded-full capitalize">
                                        {subject.type || 'theory'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-[#6B7280] text-center py-4">No subjects found</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </RoleLayout>
  );
};

export default RoleAcademicStructure;
