import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#111318] text-white hover:opacity-90 focus:ring-[#111318] shadow-sm',
    secondary: 'bg-[#E6E9EF] text-[#111318] hover:bg-[#DDE1E8]',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
    outline: 'border-2 border-[#111318] text-[#111318] hover:bg-[#111318] hover:text-white',
    ghost: 'text-[#111318] hover:bg-[#F1F5F9]'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-6 py-2.5 text-sm',
    large: 'px-8 py-3 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="material-symbols-outlined text-lg">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="material-symbols-outlined text-lg">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
