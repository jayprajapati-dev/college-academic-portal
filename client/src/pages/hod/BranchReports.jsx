import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleLayout } from '../../components';
import useRoleNav from '../../hooks/useRoleNav';
import useActiveBranch from '../../hooks/useActiveBranch';

const normalizeFileType = (fileType = '') => {
  const clean = String(fileType || '').toLowerCase().replace('.', '').trim();
  if (!clean) return 'other';
  if (['pdf'].includes(clean)) return 'pdf';
  if (['doc', 'docx'].includes(clean)) return 'doc';
  if (['ppt', 'pptx'].includes(clean)) return 'ppt';
  if (['xls', 'xlsx', 'csv'].includes(clean)) return 'sheet';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(clean)) return 'image';
  if (['mp4', 'mkv', 'mov', 'avi'].includes(clean)) return 'video';
  if (['txt', 'md'].includes(clean)) return 'text';
  return 'other';
};

const fileTypeMeta = {
  pdf: { label: 'PDF', color: 'bg-red-500' },
  doc: { label: 'Document', color: 'bg-blue-500' },
  ppt: { label: 'Presentation', color: 'bg-amber-500' },
  sheet: { label: 'Sheet', color: 'bg-emerald-500' },
  image: { label: 'Image', color: 'bg-fuchsia-500' },
  video: { label: 'Video', color: 'bg-violet-500' },
  text: { label: 'Text', color: 'bg-sky-500' },
  other: { label: 'Other', color: 'bg-slate-500' }
};

const BranchReports = () => {
  const navigate = useNavigate();
  const { navItems, loading: navLoading } = useRoleNav('hod');
  const { activeBranchId, activeBranchName } = useActiveBranch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    teachers: 0,
    subjects: 0,
    students: 0
  });
  const [reportData, setReportData] = useState({
    totalMaterials: 0,
    totalDownloads: 0,
    recentUploads: 0,
    subjectsWithMaterials: 0,
    subjectsWithoutMaterials: 0,
    teacherActive: 0,
    teacherPending: 0,
    teacherInactive: 0,
    teacherTotal: 0,
    fileTypeDistribution: []
  });

  const handleAuthError = useCallback((err) => {
    const status = err?.status || err?.response?.status;
    if (status === 401 || String(err?.message || '').includes('401')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchJson = useCallback(async (url, token) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      const authError = new Error('401 unauthorized');
      authError.status = 401;
      throw authError;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || `Request failed: ${url}`);
    }
    return data;
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const profileData = await fetchJson('/api/profile/me', token);
      const profile = profileData?.data;
      if (!profile) {
        throw new Error('Unable to load profile');
      }
      setUser(profile);

      const branchId = activeBranchId || profile?.branch?._id;
      const branchStatsUrl = branchId ? `/api/academic/branch-stats?branchId=${branchId}` : '/api/academic/branch-stats';

      const [branchStatsData, subjectsData, teachersData] = await Promise.all([
        fetchJson(branchStatsUrl, token),
        fetchJson('/api/academic/subjects/hod', token),
        fetchJson('/api/admin/users?page=1&limit=200&role=teacher&scope=role', token)
      ]);

      const allSubjects = Array.isArray(subjectsData?.data) ? subjectsData.data : [];
      const scopedSubjects = branchId
        ? allSubjects.filter((subject) => {
            const subjectBranch = typeof subject?.branchId === 'string' ? subject.branchId : subject?.branchId?._id;
            return String(subjectBranch || '') === String(branchId);
          })
        : allSubjects;

      const teachers = Array.isArray(teachersData?.data) ? teachersData.data : [];
      const teacherActive = teachers.filter((item) => item?.status === 'active').length;
      const teacherPending = teachers.filter((item) => item?.status === 'pending').length;
      const teacherInactive = Math.max(teachers.length - teacherActive - teacherPending, 0);

      const materialResults = await Promise.all(
        scopedSubjects.map(async (subject) => {
          try {
            const materialData = await fetchJson(`/api/academic/subjects/${subject._id}/materials`, token);
            const materials = Array.isArray(materialData?.materials) ? materialData.materials : [];
            return { subjectId: subject._id, materials };
          } catch (_) {
            return { subjectId: subject._id, materials: [] };
          }
        })
      );

      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      let totalMaterials = 0;
      let totalDownloads = 0;
      let recentUploads = 0;
      let subjectsWithMaterials = 0;
      const fileTypeMap = new Map();

      materialResults.forEach((entry) => {
        const materials = Array.isArray(entry.materials) ? entry.materials : [];
        if (materials.length > 0) subjectsWithMaterials += 1;

        materials.forEach((material) => {
          totalMaterials += 1;
          totalDownloads += Number(material?.downloadCount || 0);

          const uploadedAt = material?.uploadedAt ? new Date(material.uploadedAt).getTime() : 0;
          if (uploadedAt && now - uploadedAt <= thirtyDaysMs) {
            recentUploads += 1;
          }

          const typeKey = normalizeFileType(material?.fileType);
          fileTypeMap.set(typeKey, (fileTypeMap.get(typeKey) || 0) + 1);
        });
      });

      const fileTypeDistribution = Array.from(fileTypeMap.entries())
        .map(([key, count]) => ({
          key,
          count,
          label: fileTypeMeta[key]?.label || 'Other',
          color: fileTypeMeta[key]?.color || 'bg-slate-500'
        }))
        .sort((a, b) => b.count - a.count);

      const branchStats = branchStatsData?.data || {};
      setStats({
        teachers: Number(branchStats.teachers || teachers.length || 0),
        students: Number(branchStats.students || 0),
        subjects: Number(branchStats.subjects || scopedSubjects.length || 0)
      });

      setReportData({
        totalMaterials,
        totalDownloads,
        recentUploads,
        subjectsWithMaterials,
        subjectsWithoutMaterials: Math.max(scopedSubjects.length - subjectsWithMaterials, 0),
        teacherActive,
        teacherPending,
        teacherInactive,
        teacherTotal: teachers.length,
        fileTypeDistribution
      });
    } catch (err) {
      if (handleAuthError(err)) return;
      console.error('Branch reports load failed:', err);
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, fetchJson, handleAuthError, navigate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const materialCoverage = stats.subjects > 0
    ? Math.round((reportData.subjectsWithMaterials / stats.subjects) * 100)
    : 0;
  const materialsPerSubject = stats.subjects > 0
    ? (reportData.totalMaterials / stats.subjects).toFixed(1)
    : '0.0';
  const avgDownloadsPerMaterial = reportData.totalMaterials > 0
    ? (reportData.totalDownloads / reportData.totalMaterials).toFixed(1)
    : '0.0';

  const topCategory = useMemo(() => {
    if (reportData.fileTypeDistribution.length === 0) return null;
    return reportData.fileTypeDistribution[0];
  }, [reportData.fileTypeDistribution]);

  if (loading) {
    return (
      <RoleLayout
        title="Branch Reports"
        userName={user?.name || 'HOD'}
        onLogout={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
        navItems={navItems} navLoading={navLoading} panelLabel="Branch Reports"
        profileLinks={[{ label: 'Profile', to: '/hod/profile' }]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Branch Reports"
      userName={user?.name || 'HOD'}
      onLogout={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
      navItems={navItems} navLoading={navLoading} panelLabel="Branch Reports"
      profileLinks={[{ label: 'Profile', to: '/hod/profile' }]}
    >
      <div className="px-3 sm:px-5 lg:px-6 pb-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/hod/dashboard')}
              className="h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-blue-600 hover:border-blue-200 transition"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-800">Branch Reports</h1>
              <p className="text-xs md:text-sm text-gray-500">Ultra-minimal live overview</p>
            </div>
            <button
              onClick={loadReports}
              className="ml-auto px-3 py-2 rounded-lg border border-gray-300 text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh Data
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <section className="rounded-2xl bg-gradient-to-r from-[#0f766e] via-[#0891b2] to-[#2563eb] text-white p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100">Department Intelligence</p>
                <h2 className="text-xl md:text-2xl font-black mt-1">{activeBranchName || user?.branch?.name || 'Branch'} Snapshot</h2>
                <p className="text-sm text-cyan-100 mt-1">All metrics are calculated from live branch APIs.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-center">Teachers: {stats.teachers}</span>
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-center">Subjects: {stats.subjects}</span>
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-center">Materials: {reportData.totalMaterials}</span>
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-center">Students: {stats.students}</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5 space-y-5">
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">Core KPIs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-blue-700 font-semibold">Active Teachers</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{reportData.teacherActive}</p>
                  <p className="text-xs text-blue-700 mt-1">out of {reportData.teacherTotal}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold">Materials</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{reportData.totalMaterials}</p>
                  <p className="text-xs text-emerald-700 mt-1">{reportData.recentUploads} in last 30 days</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-violet-700 font-semibold">Coverage</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{materialCoverage}%</p>
                  <p className="text-xs text-violet-700 mt-1">{reportData.subjectsWithMaterials}/{stats.subjects} subjects</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold">Downloads</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{reportData.totalDownloads}</p>
                  <p className="text-xs text-amber-700 mt-1">avg {avgDownloadsPerMaterial}/material</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">Needs Attention</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-sm font-semibold text-gray-800">Subjects Without Materials</p>
                  <p className="text-xl font-black text-rose-600 mt-1">{reportData.subjectsWithoutMaterials}</p>
                  <p className="text-xs text-gray-500 mt-1">Upload starter content for these subjects.</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-sm font-semibold text-gray-800">Pending Teachers</p>
                  <p className="text-xl font-black text-amber-600 mt-1">{reportData.teacherPending}</p>
                  <p className="text-xs text-gray-500 mt-1">Review onboarding and profile setup status.</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-sm font-semibold text-gray-800">Top Content Type</p>
                  <p className="text-xl font-black text-blue-600 mt-1">{topCategory ? topCategory.label : 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">{topCategory ? `${topCategory.count} files` : 'No uploads found yet.'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Avg materials per subject: {materialsPerSubject}</p>
            </div>
          </section>

          <section>
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/hod/manage-teachers')}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition text-left"
              >
                <p className="text-sm font-bold text-gray-800">Manage Teachers</p>
                <p className="text-xs text-gray-600 mt-1">Open branch faculty management</p>
              </button>

              <button
                onClick={() => navigate('/hod/materials')}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition text-left"
              >
                <p className="text-sm font-bold text-gray-800">Review Materials</p>
                <p className="text-xs text-gray-600 mt-1">Check content and uploads</p>
              </button>

              <button
                onClick={() => navigate('/hod/dashboard')}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition text-left"
              >
                <p className="text-sm font-bold text-gray-800">Back to Dashboard</p>
                <p className="text-xs text-gray-600 mt-1">Return to HOD home panel</p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </RoleLayout>
  );
};

export default BranchReports;
