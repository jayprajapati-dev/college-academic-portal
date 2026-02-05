import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminLayout, Card, StatsCard, Input, Button } from '../components';

const AcademicStructure = () => {
  const navigate = useNavigate();
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

        // Calculate stats
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

  if (loading) {
    return (
      <AdminLayout title="Academic Structure" onLogout={handleLogout}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Academic Structure" onLogout={handleLogout}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">account_tree</span>
              Academic Structure
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              View and manage the institutional hierarchy in one place.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search semesters, branches, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon="search"
              />
            </div>
            <div className="flex gap-2">
              <Button size="small" variant="secondary" onClick={expandAll}>Expand All</Button>
              <Button size="small" variant="secondary" onClick={collapseAll}>Collapse All</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard icon="calendar_month" label="Total Semesters" value={stats.totalSemesters} bgColor="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatsCard icon="apartment" label="Total Branches" value={stats.totalBranches} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" />
          <StatsCard icon="menu_book" label="Total Subjects" value={stats.totalSubjects} bgColor="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>

        <Card title="Structure Explorer" subtitle="Expand semesters and branches to view subjects">

          <div className="space-y-4">
            {filteredStructure.map((semester) => (
              <div key={semester._id} className="border border-[#E6E9EF] rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSemester(semester._id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#6B7280]">
                      {getSemesterIcon(semester.semesterNumber)}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold">{semester.name || `Semester ${semester.semesterNumber}`}</p>
                      <p className="text-xs text-[#6B7280]">Academic Year: {semester.academicYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold bg-[#E6E9EF] text-[#111318] px-2 py-1 rounded-full">
                      {semester.branches?.length || 0} Branches
                    </span>
                    <span className="material-symbols-outlined text-[#6B7280]">
                      {expandedSemesters.has(semester._id) ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {expandedSemesters.has(semester._id) && semester.branches && (
                  <div className="px-4 py-4 space-y-3 bg-white">
                    {semester.branches.map((branch) => (
                      <div key={branch._id} className="border border-[#E6E9EF] rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleBranch(branch._id)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#6B7280]">apartment</span>
                            <div className="text-left">
                              <p className="text-sm font-semibold">{branch.name}</p>
                              <p className="text-xs text-[#6B7280]">Code: {branch.code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold bg-[#E6E9EF] text-[#111318] px-2 py-1 rounded-full">
                              {branch.subjects?.length || 0} Subjects
                            </span>
                            <span className="material-symbols-outlined text-[#6B7280]">
                              {expandedBranches.has(branch._id) ? 'expand_less' : 'expand_more'}
                            </span>
                          </div>
                        </button>

                        {expandedBranches.has(branch._id) && branch.subjects && (
                          <div className="px-3 py-3 bg-white">
                            {branch.subjects.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {branch.subjects.map((subject) => (
                                  <div key={subject._id} className="border border-[#E6E9EF] rounded-lg p-3 hover:border-[#111318] transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-semibold">{subject.name}</p>
                                        <p className="text-xs text-[#6B7280]">{subject.code}</p>
                                      </div>
                                      <span className="text-xs font-semibold bg-[#F1F5F9] text-[#111318] px-2 py-1 rounded-full">
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
    </AdminLayout>
  );
};

export default AcademicStructure;
