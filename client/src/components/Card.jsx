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
export const StatsCard = ({ icon, title, label, value, trend = null, color = 'blue', bgColor = null }) => {
  // Support both 'title' and 'label' props for backward compatibility
  const displayTitle = label || title;
  
  // If bgColor is provided (new API), use it directly
  if (bgColor) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className={`${bgColor} text-white p-4 rounded-lg`}>
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {displayTitle}
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
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
    <Card padding={false} className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
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
      <p className="text-[#6B7280] text-sm font-medium">{displayTitle}</p>
      <p className="text-3xl font-black text-[#111318] mt-1">{value}</p>
    </Card>
  );
};

export default Card;
