import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-12 w-12 border-2',
    large: 'h-16 w-16 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`animate-spin rounded-full border-primary border-t-transparent ${sizeClasses[size]}`}></div>
      {text && <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-background-dark flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
