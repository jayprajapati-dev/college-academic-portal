import React from 'react';
import RoleLayout from './RoleLayout';
import useRoleNav from '../hooks/useRoleNav';

const AdminLayout = ({ title, children, userName = 'Admin', onLogout = null }) => {
  const { navItems, loading } = useRoleNav('admin');

  return (
    <RoleLayout
      title={title}
      userName={userName}
      onLogout={onLogout}
      navItems={navItems}
      navLoading={loading}
      panelLabel="Admin Panel"
    >
      {children}
    </RoleLayout>
  );
};

export default AdminLayout;
