import React from 'react';

const Table = ({ 
  columns = [], 
  data = [], 
  loading = false,
  emptyMessage = 'No data available',
  onRowClick = null,
  striped = true,
  hover = true
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">inbox</span>
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#F1F5F9] text-[#6B7280] text-xs font-bold uppercase tracking-wider">
            {columns.map((column, index) => (
              <th 
                key={index}
                className={`px-6 py-4 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E6E9EF]">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`
                ${hover ? 'hover:bg-[#F8FAFC] transition-colors' : ''}
                ${striped && rowIndex % 2 === 1 ? 'bg-[#FAFBFD]' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex}
                  className={`px-6 py-4 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.render ? column.render(row, rowIndex) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
