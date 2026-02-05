import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemCount = true
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="px-6 py-4 border-t border-[#E6E9EF] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
      {showItemCount && (
        <span className="text-[#6B7280] font-medium">
          Showing {startItem} - {endItem} of {totalItems}
        </span>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-[#E6E9EF] hover:bg-[#F1F5F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Previous
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-[#6B7280]">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-[#111318] text-white font-semibold'
                    : 'hover:bg-[#F1F5F9] text-[#6B7280]'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Mobile: Show current page */}
        <div className="sm:hidden px-3 py-1.5 text-[#6B7280] font-medium">
          Page {currentPage} of {totalPages}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-[#E6E9EF] hover:bg-[#F1F5F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          Next
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
