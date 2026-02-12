import React from 'react';
import RoleLayout from './RoleLayout';
import useRoleNav from '../hooks/useRoleNav';

const TeacherLayout = ({ title, children, userName = 'Teacher', onLogout = null }) => {
  const { navItems, loading } = useRoleNav('teacher');

  return (
    <RoleLayout
      title={title}
      userName={userName}
      onLogout={onLogout}
      navItems={navItems}
      navLoading={loading}
      panelLabel="Teacher Panel"
      profileLinks={[{ label: 'Profile', to: '/teacher/profile' }]}
    >
      {children}
    </RoleLayout>
  );
};

export default TeacherLayout;
