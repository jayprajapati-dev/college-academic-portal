import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  helper = '',
  className = '',
  ...props
}) => {
  const inputClasses = `form-input flex w-full rounded-xl text-[#111318] focus:ring-2 focus:ring-[#111318] border ${
    error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-[#D7DBE3]'
  } bg-white h-12 px-4 text-sm font-normal placeholder:text-[#6B7280] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[#111318] text-sm font-semibold pb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span className="material-symbols-outlined absolute left-3 top-3 text-[#6B7280] text-xl">
            {icon}
          </span>
        )}
        
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${inputClasses} ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${icon && iconPosition === 'right' ? 'pr-10' : ''}`}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <span className="material-symbols-outlined absolute right-3 top-3 text-[#6B7280] text-xl">
            {icon}
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p className="text-[#6B7280] text-xs">{helper}</p>
      )}
    </div>
  );
};

// Select Component
export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  required = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[#111318] text-sm font-semibold pb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`form-select flex w-full rounded-xl text-[#111318] focus:ring-2 focus:ring-[#111318] border ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-[#D7DBE3]'
        } bg-white h-12 px-4 text-sm font-normal disabled:bg-[#F1F5F9] disabled:cursor-not-allowed`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

// Textarea Component
export const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  rows = 4,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[#111318] text-sm font-semibold pb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`form-textarea flex w-full rounded-xl text-[#111318] focus:ring-2 focus:ring-[#111318] border ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-[#D7DBE3]'
        } bg-white p-4 text-sm font-normal placeholder:text-[#6B7280] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed resize-none`}
      />
      
      {error && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
