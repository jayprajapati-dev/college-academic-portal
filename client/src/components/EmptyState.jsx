import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon = 'inbox',
  title = 'No data available',
  message = '',
  actionText = null,
  onAction = null,
  className = ''
}) => {
  return (
    <div className={`py-16 text-center ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">
            {icon}
          </span>
        </div>
        <div>
          <p className="text-gray-900 dark:text-white text-lg font-bold mb-1">{title}</p>
          {message && (
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">{message}</p>
          )}
        </div>
        {actionText && onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            icon="add"
            className="mt-2"
          >
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
