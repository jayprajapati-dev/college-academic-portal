import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'medium',
  icon = null,
  className = '' 
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-[10px]',
    medium: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
      {children}
    </span>
  );
};

// Status Badge Component with predefined status types
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { variant: 'success', text: 'Active', icon: 'check_circle' },
    inactive: { variant: 'default', text: 'Inactive', icon: 'cancel' },
    pending: { variant: 'warning', text: 'Pending', icon: 'schedule' },
    draft: { variant: 'info', text: 'Draft', icon: 'edit_note' },
    published: { variant: 'success', text: 'Published', icon: 'publish' },
    archived: { variant: 'default', text: 'Archived', icon: 'archive' },
    deleted: { variant: 'danger', text: 'Deleted', icon: 'delete' }
  };

  const config = statusConfig[status?.toLowerCase()] || { variant: 'default', text: status, icon: null };

  return (
    <Badge variant={config.variant} icon={config.icon}>
      {config.text}
    </Badge>
  );
};

export default Badge;
