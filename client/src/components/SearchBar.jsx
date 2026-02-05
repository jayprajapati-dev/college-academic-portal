import React from 'react';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear = null,
  className = ''
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`flex flex-col min-w-40 h-10 max-w-64 ${className}`}>
      <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
        <div className="text-[#636f88] flex border-none bg-[#f0f2f4] dark:bg-gray-800 items-center justify-center pl-4 rounded-l-xl">
          <span className="material-symbols-outlined text-xl">search</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="form-input flex w-full min-w-0 flex-1 border-none bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white focus:ring-0 h-full placeholder:text-[#636f88] px-4 text-sm font-normal"
          placeholder={placeholder}
        />
        {value && (
          <button
            onClick={handleClear}
            className="text-[#636f88] hover:text-[#111318] dark:hover:text-white flex items-center justify-center pr-4 bg-[#f0f2f4] dark:bg-gray-800 rounded-r-xl transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
