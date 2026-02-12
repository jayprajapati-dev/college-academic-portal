import React from 'react';
import RoleLayout from './RoleLayout';
import useRoleNav from '../hooks/useRoleNav';

const HodLayout = ({ title, children, userName = 'HOD', onLogout = null }) => {
  const { navItems, loading } = useRoleNav('hod');

  return (
    <RoleLayout
      title={title}
      userName={userName}
      onLogout={onLogout}
      navItems={navItems}
      navLoading={loading}
      panelLabel="HOD Panel"
      topLinks={[
        { label: 'Home', to: '/' },
        { label: 'About', to: '/about' },
        { label: 'Contact', to: '/contact' }
      ]}
      profileLinks={[{ label: 'Profile', to: '/hod/profile' }]}
    >
      {children}
    </RoleLayout>
  );
};

export default HodLayout;
