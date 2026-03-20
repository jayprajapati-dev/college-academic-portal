import React from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from './RoleLayout';
import useRoleNav from '../hooks/useRoleNav';

const AdminLayout = ({ title, children, userName = 'Admin' }) => {
  const navigate = useNavigate();
  const { navItems, loading } = useRoleNav('admin');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <RoleLayout
      title={title}
      userName={userName}
      onLogout={handleLogout}
      navItems={navItems}
      navLoading={loading}
      panelLabel="Admin Panel"
      profileLinks={[{ label: 'Profile', to: '/admin/profile' }]}
    >
      {children}
    </RoleLayout>
  );
};

export default AdminLayout;
