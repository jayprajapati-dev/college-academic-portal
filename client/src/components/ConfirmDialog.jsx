import React from 'react';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-lg ${
            variant === 'danger' 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : variant === 'warning'
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <span className={`material-symbols-outlined text-2xl ${
              variant === 'danger' 
                ? 'text-red-600 dark:text-red-400' 
                : variant === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'info'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
