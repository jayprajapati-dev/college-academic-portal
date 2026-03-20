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
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]';
  
  const variantClasses = {
    primary: 'bg-[linear-gradient(135deg,#111318_0%,#1f2937_100%)] text-white hover:brightness-110 focus:ring-[#111318] shadow-[0_10px_22px_rgba(17,19,24,0.2)]',
    secondary: 'bg-[#E6E9EF] text-[#111318] hover:bg-[#DDE1E8] border border-[#d6dae2]',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
    outline: 'border-2 border-[#111318] text-[#111318] hover:bg-[#111318] hover:text-white',
    ghost: 'text-[#111318] hover:bg-[#F1F5F9] border border-transparent hover:border-[#e2e8f0]'
  };

  const sizeClasses = {
    small: 'px-3 py-2 text-xs',
    medium: 'px-5 py-2.5 text-sm',
    large: 'px-7 py-3 text-base'
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
