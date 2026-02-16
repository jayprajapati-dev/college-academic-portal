import { useEffect, useMemo, useState } from 'react';

const ROLE_NAV = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: 'space_dashboard' },
    { key: 'academic-structure', label: 'Academic Structure', to: '/admin/academic-structure', icon: 'account_tree' },
    { key: 'semesters', label: 'Semesters', to: '/admin/semesters', icon: 'calendar_month' },
    { key: 'branches', label: 'Branches', to: '/admin/branches', icon: 'apartment' },
    { key: 'subjects', label: 'Subjects', to: '/admin/subjects', icon: 'menu_book' },
    { key: 'library', label: 'Library', to: '/admin/library', icon: 'library_books' },
    { key: 'timetable', label: 'Timetable', to: '/admin/timetable', icon: 'calendar_today' },
    { key: 'notices', label: 'Notice Board', to: '/admin/notices', icon: 'notifications' },
    { key: 'attendance', label: 'Attendance', to: '/admin/attendance', icon: 'fact_check' },
    { key: 'exams', label: 'Exams', to: '/admin/exams', icon: 'quiz' },
    { key: 'users', label: 'Manage Users', to: '/admin/users', icon: 'group' },
    { key: 'contacts', label: 'Contact Requests', to: '/admin/contacts', icon: 'contact_mail' },
    { key: 'activity', label: 'Activity Log', to: '/admin/activity', icon: 'history' }
  ],
  hod: [
    { key: 'dashboard', label: 'Dashboard', to: '/hod/dashboard', icon: 'space_dashboard' },
    { key: 'manage-teachers', label: 'Manage Teachers', to: '/hod/manage-teachers', icon: 'group' },
    { key: 'notices', label: 'Notices', to: '/hod/notices', icon: 'notifications' },
    { key: 'tasks', label: 'Tasks', to: '/hod/tasks', icon: 'assignment' },
    { key: 'materials', label: 'Materials', to: '/hod/materials', icon: 'menu_book' },
    { key: 'library', label: 'Library', to: '/hod/library', icon: 'library_books' },
    { key: 'attendance', label: 'Attendance', to: '/hod/attendance', icon: 'fact_check' },
    { key: 'exams', label: 'Exams', to: '/hod/exams', icon: 'quiz' },
    { key: 'reports', label: 'Reports', to: '/hod/reports', icon: 'insights' },
    { key: 'timetable', label: 'Timetable', to: '/hod/timetable', icon: 'calendar_today' },
    { key: 'users', label: 'Manage Users', to: '/hod/users', icon: 'group' }
  ],
  teacher: [
    { key: 'dashboard', label: 'Dashboard', to: '/teacher/dashboard', icon: 'space_dashboard' },
    { key: 'materials', label: 'Materials', to: '/teacher/materials', icon: 'menu_book' },
    { key: 'library', label: 'Library', to: '/teacher/library', icon: 'library_books' },
    { key: 'tasks', label: 'Tasks', to: '/teacher/tasks', icon: 'assignment' },
    { key: 'notices', label: 'Notices', to: '/teacher/notices', icon: 'notifications' },
    { key: 'attendance', label: 'Attendance', to: '/teacher/attendance', icon: 'fact_check' },
    { key: 'exams', label: 'Exams', to: '/teacher/exams', icon: 'quiz' },
    { key: 'users', label: 'Manage Users', to: '/teacher/users', icon: 'group' }
  ],
  coordinator: [
    { key: 'dashboard', label: 'Dashboard', to: '/coordinator/dashboard', icon: 'space_dashboard' },
    { key: 'tasks', label: 'Tasks', to: '/coordinator/tasks', icon: 'assignment' },
    { key: 'notices', label: 'Notices', to: '/coordinator/notices', icon: 'notifications' },
    { key: 'attendance', label: 'Attendance', to: '/coordinator/attendance', icon: 'fact_check' },
    { key: 'users', label: 'Students', to: '/coordinator/users', icon: 'group' },
    { key: 'activity', label: 'Activity Log', to: '/coordinator/activity', icon: 'history' }
  ]
};

const useRoleNav = (role) => {
  const defaultItems = useMemo(() => ROLE_NAV[role] || [], [role]);
  const [navItems, setNavItems] = useState(defaultItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) {
            setNavItems(defaultItems);
          }
          return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdminMode = role === 'admin';
        const canUseAdminMode = storedUser?.role === 'admin' || storedUser?.adminAccess === true;
        const modeParam = isAdminMode && canUseAdminMode ? '?mode=admin' : '';

        const res = await fetch(`/api/permissions/me${modeParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load permissions');
        }

        if (!isMounted) return;

        if (Object.prototype.hasOwnProperty.call(data, 'allowedModules')) {
          const allowed = Array.isArray(data.allowedModules) ? data.allowedModules : [];
          const allowedSet = new Set(allowed);
          if (role === 'teacher' || role === 'hod' || role === 'coordinator') {
            allowedSet.add('users');
          }
          const hasTeachingSubjects = Array.isArray(storedUser?.assignedSubjects) && storedUser.assignedSubjects.length > 0;
          if (role === 'hod' && hasTeachingSubjects) {
            allowedSet.add('tasks');
          }
          const filtered = defaultItems.filter((item) => allowedSet.has(item.key));
          setNavItems(filtered);
        } else {
          setNavItems(defaultItems);
        }
      } catch (err) {
        if (isMounted) {
          setNavItems(defaultItems);
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
  }, [defaultItems, role]);

  return { navItems, loading };
};

export default useRoleNav;
