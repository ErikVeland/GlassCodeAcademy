'use client'

import React, { useState, useRef, useEffect } from 'react';

// Enhanced Search and Filter System that integrates with the 4-tier homepage structure
interface SearchFilterSystemProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTier: string | null;
  onTierChange: (tier: string | null) => void;
  selectedDifficulty: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onClearFilters: () => void;
  totalResults: number;
  filteredResults: number;
}

const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onFocus?: () => void;
  onBlur?: () => void;
}> = ({ value, onChange, placeholder, onFocus, onBlur }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <svg className="search-icon h-6 w-6 text-fg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="8" cy="8" r="4" />
          <line x1="12" y1="12" x2="16" y2="16" />
        </svg>
      </div>
      <input
        ref={inputRef}
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
        className="glass-search-input pl-10 pr-12"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="text-xs text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          ⌘K
        </span>
      </div>
    </div>
  );
};

const SearchFilterSystem: React.FC<SearchFilterSystemProps> = ({
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  totalResults,
  filteredResults
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const hasActiveFilters = searchQuery || selectedTier || selectedDifficulty || selectedCategory || selectedStatus;

  // Quick filter buttons for common searches
  const quickFilters = [
    { label: 'Foundational', type: 'tier', value: 'foundational', icon: '🏗️' },
    { label: 'Backend', type: 'category', value: 'backend', icon: '🔧' },
    { label: 'Frontend', type: 'category', value: 'frontend', icon: '🎨' },
    { label: 'Not Started', type: 'status', value: 'not-started', icon: '⏳' },
    { label: 'In Progress', type: 'status', value: 'in-progress', icon: '🔄' },
    { label: 'Completed', type: 'status', value: 'completed', icon: '✅' }
  ];

  const handleQuickFilter = (type: string, value: string) => {
    switch (type) {
      case 'tier':
        onTierChange(selectedTier === value ? null : value);
        break;
      case 'category':
        onCategoryChange(selectedCategory === value ? null : value);
        break;
      case 'status':
        onStatusChange(selectedStatus === value ? null : value);
        break;
    }
  };

  const isQuickFilterActive = (type: string, value: string) => {
    switch (type) {
      case 'tier': return selectedTier === value;
      case 'category': return selectedCategory === value;
      case 'status': return selectedStatus === value;
      default: return false;
    }
  };

  return (
    <div className="search-filter-system" role="search" aria-label="Search and filter learning modules">
      {/* Main Search Input */}
      <div className="search-input-container">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search modules, topics, or technologies..."
          onFocus={() => setShowAdvancedFilters(true)}
        />
      </div>

      {/* Quick Filters Section */}
      <div className="filters-section mt-4">
        <div className="quick-filters-header">
          <h3 className="quick-filters-heading text-fg font-medium mb-3 text-left">Quick filters</h3>
        </div>
        <div className="quick-filters-row flex flex-wrap items-center gap-2">
          <div className="quick-filters-buttons flex flex-wrap gap-2">
            {quickFilters.map(filter => (
              <button
                key={`${filter.type}-${filter.value}`}
                onClick={() => handleQuickFilter(filter.type, filter.value)}
                className={`glass-filter-tag ${isQuickFilterActive(filter.type, filter.value) ? 'active' : ''}`}
                aria-pressed={isQuickFilterActive(filter.type, filter.value)}
              >
                <span className="filter-icon mr-1">{filter.icon}</span>
                <span className="filter-label">{filter.label}</span>
              </button>
            ))}
          </div>
          
          {/* Advanced Filters Toggle Button - Aligned with Quick Filters */}
          <div className="advanced-filters-toggle-container ml-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`glass-filter-tag ${showAdvancedFilters ? 'active' : ''} flex items-center`}
              aria-expanded={showAdvancedFilters}
              aria-controls="advanced-filters"
            >
              <span className="toggle-icon mr-1">
                {showAdvancedFilters ? '▲' : '▼'}
              </span>
              <span className="toggle-label">
                {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
              </span>
              {hasActiveFilters && (
                <span className="active-filters-indicator ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
                  ({Object.values({
                    tier: selectedTier,
                    difficulty: selectedDifficulty,
                    category: selectedCategory,
                    status: selectedStatus
                  }).filter(Boolean).length})
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      {showAdvancedFilters && (
        <div className="advanced-filters-container bg-white dark:bg-gray-800 rounded-xl p-6 mt-4 border border-gray-200 dark:border-gray-700 shadow-lg" id="advanced-filters">
          <div className="advanced-filters-header flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-left">Advanced Filters</h3>
            {hasActiveFilters && (
              <button 
                onClick={onClearFilters} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="filters-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier Filter */}
            <div className="filter-group">
              <label htmlFor="tier-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Learning Tier
              </label>
              <select
                id="tier-filter"
                value={selectedTier || ''}
                onChange={(e) => onTierChange(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Tiers</option>
                <option value="foundational">🏗️ Foundational</option>
                <option value="core">🔧 Core Technologies</option>
                <option value="specialized">✨ Specialized Skills</option>
                <option value="quality">🔒 Quality & Testing</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="filter-group">
              <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Difficulty Level
              </label>
              <select
                id="difficulty-filter"
                value={selectedDifficulty || ''}
                onChange={(e) => onDifficultyChange(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Levels</option>
                <option value="Beginner">🌱 Beginner</option>
                <option value="Intermediate">🌿 Intermediate</option>
                <option value="Advanced">🚀 Advanced</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Technology Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory || ''}
                onChange={(e) => onCategoryChange(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="programming">💻 Programming</option>
                <option value="web">🌐 Web Development</option>
                <option value="frontend">🎨 Frontend</option>
                <option value="backend">🔧 Backend</option>
                <option value="database">🗄️ Database</option>
                <option value="devops">⚙️ DevOps</option>
                <option value="testing">🧪 Testing</option>
                <option value="performance">⚡ Performance</option>
                <option value="security">🔒 Security</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Progress Status
              </label>
              <select
                id="status-filter"
                value={selectedStatus || ''}
                onChange={(e) => onStatusChange(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="not-started">⏳ Not Started</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="results-summary mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 text-left">
              Showing <span className="font-semibold">{filteredResults}</span> of{' '}
              <span className="font-semibold">{totalResults}</span> modules
            </p>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {(hasActiveFilters || searchQuery) && (
        <div className="search-results-summary bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4" role="status" aria-live="polite">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="results-info">
              {searchQuery && (
                <span className="search-query-info text-gray-700 dark:text-gray-300 text-left">
                  Results for &quot;<strong>{searchQuery}</strong>&quot;
                </span>
              )}
              <span className="results-count text-gray-600 dark:text-gray-400 block md:inline mt-1 md:mt-0 md:ml-2 text-left">
                Showing {filteredResults} of {totalResults} modules
              </span>
            </div>
            {hasActiveFilters && (
              <button 
                onClick={onClearFilters} 
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterSystem;