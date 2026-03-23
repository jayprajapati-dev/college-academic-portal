import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (_) {
    return {};
  }
};

const ROLE_NAV = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: 'space_dashboard' },
    { key: 'academic-structure', label: 'Academic Structure', to: '/admin/academic-structure', icon: 'account_tree' },
    { key: 'semesters', label: 'Semesters', to: '/admin/semesters', icon: 'calendar_month' },
    { key: 'branches', label: 'Branches', to: '/admin/branches', icon: 'apartment' },
    { key: 'subjects', label: 'Subjects', to: '/admin/subjects', icon: 'menu_book' },
    { key: 'rooms', label: 'Rooms', to: '/admin/rooms', icon: 'meeting_room' },
    { key: 'timetable', label: 'Timetable', to: '/admin/timetable', icon: 'calendar_today' },
    { key: 'notices', label: 'Notice Board', to: '/admin/notices', icon: 'campaign' },
    { key: 'exams', label: 'Exams', to: '/admin/exams', icon: 'quiz' },
    { key: 'users', label: 'Manage Users', to: '/admin/users', icon: 'group' },
    { key: 'contacts', label: 'Contact Requests', to: '/admin/contacts', icon: 'contact_mail' },
    { key: 'activity', label: 'Activity Log', to: '/admin/activity', icon: 'history' }
  ],
  hod: [
    { key: 'dashboard', label: 'Dashboard', to: '/hod/dashboard', icon: 'space_dashboard' },
    { key: 'branches', label: 'Branches', to: '/hod/branches', icon: 'apartment' },
    { key: 'subjects', label: 'Subjects', to: '/hod/subjects', icon: 'menu_book' },
    { key: 'rooms', label: 'Rooms', to: '/hod/rooms', icon: 'meeting_room' },
    { key: 'timetable', label: 'Timetable', to: '/hod/timetable', icon: 'calendar_today' },
    { key: 'notices', label: 'Notice Board', to: '/hod/notices', icon: 'campaign' },
    { key: 'exams', label: 'Exams', to: '/hod/exams', icon: 'quiz' },
    { key: 'add-teacher', label: 'Add Teacher', to: '/hod/add-teacher', icon: 'person_add' },
    { key: 'manage-teachers', label: 'Manage Teachers', to: '/hod/manage-teachers', icon: 'groups' },
    { key: 'users', label: 'Users', to: '/hod/users', icon: 'group' },
    { key: 'reports', label: 'Reports', to: '/hod/reports', icon: 'assessment' }
  ],
  teacher: [
    { key: 'dashboard', label: 'Dashboard', to: '/teacher/dashboard', icon: 'space_dashboard' },
    { key: 'timetable', label: 'Timetable', to: '/teacher/timetable', icon: 'calendar_today' },
    { key: 'subjects', label: 'Subjects', to: '/teacher/subjects', icon: 'menu_book' },
    { key: 'materials', label: 'Materials', to: '/teacher/materials', icon: 'menu_book' },
    { key: 'library', label: 'Library', to: '/teacher/library', icon: 'library_books' },
    { key: 'tasks', label: 'Tasks', to: '/teacher/tasks', icon: 'assignment' },
    { key: 'projects', label: 'Projects', to: '/teacher/projects', icon: 'folder_open' },
    { key: 'notices', label: 'Notice Board', to: '/teacher/notices', icon: 'campaign' },
    { key: 'exams', label: 'Exams', to: '/teacher/exams', icon: 'quiz' },
    { key: 'users', label: 'Manage Users', to: '/teacher/users', icon: 'group' }
  ],
  coordinator: [
    { key: 'dashboard', label: 'Dashboard', to: '/coordinator/dashboard', icon: 'space_dashboard' },
    { key: 'tasks', label: 'Tasks', to: '/coordinator/tasks', icon: 'assignment' },
    { key: 'projects', label: 'Projects', to: '/coordinator/projects', icon: 'folder_open' },
    { key: 'notices', label: 'Notice Board', to: '/coordinator/notices', icon: 'campaign' },
    { key: 'exams', label: 'Exams', to: '/coordinator/exams', icon: 'quiz' },
    { key: 'users', label: 'Students', to: '/coordinator/users', icon: 'group' },
    { key: 'activity', label: 'Activity Log', to: '/coordinator/activity', icon: 'history' }
  ]
};

const ADMIN_PROXY_SAFE_KEYS = new Set(['dashboard', 'academic-structure', 'semesters', 'branches', 'subjects', 'timetable', 'notices', 'exams', 'users', 'contacts', 'rooms']);

const useRoleNav = (role) => {
  const location = useLocation();
  const storedUser = parseStoredUser();
  const userRole = storedUser?.role;
  const canUseAdminMode = userRole === 'admin' || storedUser?.adminAccess === true;
  const coordinatorBaseRole = ['teacher', 'hod'].includes(storedUser?.coordinator?.baseRole)
    ? storedUser.coordinator.baseRole
    : null;
  const coordinatorActive = Boolean(storedUser?.coordinator?.branch)
    && storedUser?.coordinator?.status !== 'expired';

  const modeSet = new Set(userRole ? [userRole] : []);
  if (canUseAdminMode) {
    modeSet.add('admin');
  }
  if (['teacher', 'hod'].includes(userRole) && coordinatorActive) {
    modeSet.add('coordinator');
  }
  if (userRole === 'coordinator' && coordinatorBaseRole) {
    modeSet.add(coordinatorBaseRole);
  }

  const modeOrder = ['admin', 'coordinator', 'hod', 'teacher'];
  const availableModes = modeOrder.filter((mode) => modeSet.has(mode));
  const assignedSubjectsCount = Array.isArray(storedUser?.assignedSubjects) ? storedUser.assignedSubjects.length : 0;
  const pathMode = availableModes.find((mode) => location.pathname.startsWith(`/${mode}`));
  const effectiveRole = pathMode || role;

  const defaultItems = useMemo(() => ROLE_NAV[effectiveRole] || [], [effectiveRole]);
  const isProxyAdminMode = effectiveRole === 'admin' && userRole !== 'admin';
  const effectiveDefaultItems = useMemo(() => {
    if (!isProxyAdminMode) return defaultItems;
    return defaultItems.filter((item) => ADMIN_PROXY_SAFE_KEYS.has(item.key));
  }, [defaultItems, isProxyAdminMode]);
  const [navItems, setNavItems] = useState(effectiveDefaultItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) {
            setNavItems(effectiveDefaultItems);
          }
          return;
        }

        const modeParam = userRole && effectiveRole !== userRole ? `?mode=${effectiveRole}` : '';

        const res = await fetch(`/api/permissions/me${modeParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
          return;
        }
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load permissions');
        }

        if (!isMounted) return;

        if (Object.prototype.hasOwnProperty.call(data, 'allowedModules')) {
          const allowed = Array.isArray(data.allowedModules) ? data.allowedModules : [];
          const allowedSet = new Set(allowed);
          if (effectiveRole === 'teacher' || effectiveRole === 'hod' || effectiveRole === 'coordinator') {
            allowedSet.add('users');
          }
          if (effectiveRole === 'teacher') {
            allowedSet.add('subjects');
            allowedSet.add('timetable');
          }
          const hasTeachingSubjects = assignedSubjectsCount > 0;
          if (effectiveRole === 'hod' && hasTeachingSubjects) {
            allowedSet.add('tasks');
          }
          // HOD can always manage subjects in their branches
          if (effectiveRole === 'hod') {
            allowedSet.add('subjects');
          }
          const filtered = effectiveDefaultItems.filter((item) => allowedSet.has(item.key));
          setNavItems(filtered);
        } else {
          setNavItems(effectiveDefaultItems);
        }
      } catch (err) {
        if (isMounted) {
          setNavItems(effectiveDefaultItems);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [assignedSubjectsCount, effectiveDefaultItems, effectiveRole, userRole]);

  return { navItems, loading };
};

export default useRoleNav;
