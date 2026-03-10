import React from 'react';

const Card = ({ 
  children, 
  title = null,
  subtitle = null,
  footer = null,
  padding = true,
  hover = false,
  onClick = null,
  className = '' 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-[#E6E9EF]
        ${hover ? 'hover:shadow-md transition-shadow' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className={`border-b border-[#E6E9EF] ${padding ? 'p-6' : 'p-0'}`}>
          {title && (
            <h3 className="text-xl font-bold text-[#111318]">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
      
      {footer && (
        <div className={`border-t border-[#E6E9EF] ${padding ? 'p-6' : 'p-0'}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({ icon, title, label, value, trend = null, color = 'blue', bgColor = null, compact = false, singleLine = false }) => {
  // Support both 'title' and 'label' props for backward compatibility
  const displayTitle = label || title;
  
  // If bgColor is provided (new API), use it directly
  if (bgColor) {
    if (singleLine) {
      return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${compact ? 'p-3.5' : 'p-4'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0 gap-2.5">
              <div className={`${bgColor} text-white rounded-lg ${compact ? 'p-2' : 'p-2.5'}`}>
                <span className={`material-symbols-outlined ${compact ? 'text-lg' : 'text-xl'}`}>{icon}</span>
              </div>
              <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide truncate`}>
                {displayTitle}
              </p>
            </div>
            <p className={`${compact ? 'text-lg md:text-xl' : 'text-2xl'} font-black text-gray-900 dark:text-white leading-none shrink-0`}>
              {value}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${compact ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
          <div className={`${bgColor} text-white rounded-lg ${compact ? 'p-2.5' : 'p-4'}`}>
            <span className={`material-symbols-outlined ${compact ? 'text-xl' : 'text-3xl'}`}>{icon}</span>
          </div>
          <div>
            <p className={`${compact ? 'text-[11px]' : 'text-sm'} font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
              {displayTitle}
            </p>
            <p className={`${compact ? 'text-xl md:text-2xl' : 'text-3xl'} font-black text-gray-900 dark:text-white mt-1`}>
              {value}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Original API
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <Card padding={false} className={compact ? 'p-4' : 'p-6'}>
      <div className={`flex justify-between items-start ${compact ? 'mb-3' : 'mb-4'}`}>
        <div className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg ${colorClasses[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            trend.startsWith('+') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-[#6B7280] font-medium`}>{displayTitle}</p>
      <p className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-[#111318] mt-1`}>{value}</p>
    </Card>
  );
};

export default Card;
