import React from 'react';
import { Filter, X } from 'lucide-react';
import { DateFilter } from '../../types';

interface FilterBarProps {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  sourceFilter: string | null;
  setSourceFilter: (source: string | null) => void;
  categories: string[];
  sources: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  dateFilter,
  setDateFilter,
  categoryFilter,
  setCategoryFilter,
  sourceFilter,
  setSourceFilter,
  categories,
  sources
}) => {
  const handleClearFilters = () => {
    setDateFilter('all');
    setCategoryFilter(null);
    setSourceFilter(null);
  };

  const dateFilters: { value: DateFilter; label: string }[] = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-6">
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>
        
        {/* Date filter */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time period</label>
          <div className="flex flex-wrap gap-2">
            {dateFilters.map(filter => (
              <button
                key={filter.value}
                className={`text-xs px-3 py-1.5 rounded-full ${
                  dateFilter === filter.value
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } transition-colors duration-200`}
                onClick={() => setDateFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Category filter */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <select
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md p-2 text-sm border-0 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* Source filter */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Source</label>
          <select
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md p-2 text-sm border-0 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            value={sourceFilter || ''}
            onChange={(e) => setSourceFilter(e.target.value || null)}
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
        
        {/* Clear filters button */}
        <div className="flex justify-center md:justify-end">
          <button
            onClick={handleClearFilters}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200"
          >
            <X size={16} className="mr-1" />
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;