import React, { useState } from 'react';
import {
  Filter,
  X,
  Calendar,
  User,
  AlertTriangle,
  FolderOpen,
  Target,
  ChevronDown,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TaskFilters = ({ filters, onFiltersChange, tasks }) => {
  const { t } = useTranslation();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [dateRangeType, setDateRangeType] = useState('all'); // all, today, week, month, custom

  // Extract unique values from tasks
  const getUniqueValues = () => {
    const assignees = new Map();
    const projects = new Map();
    const sprints = new Set();

    tasks.forEach(task => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee);
      }
      if (task.project) {
        projects.set(task.project.id, task.project);
      }
      if (task.sprint) {
        sprints.add(task.sprint);
      }
    });

    return {
      assignees: Array.from(assignees.values()),
      projects: Array.from(projects.values()),
      sprints: Array.from(sprints)
    };
  };

  const { assignees, projects, sprints } = getUniqueValues();

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value !== 'all' && value !== null
  ).length;

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      project: 'all',
      sprint: 'all',
      dateRange: null
    });
    setDateRangeType('all');
  };

  const handleDateRangeChange = (type) => {
    setDateRangeType(type);
    
    const today = new Date();
    let startDate, endDate;

    switch (type) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'all':
        handleFilterChange('dateRange', null);
        return;
      default:
        return;
    }

    handleFilterChange('dateRange', {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  };

  const FilterDropdown = ({ label, icon: Icon, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            value !== 'all' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Icon className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">{label}</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-2 w-64 bg-white dark:bg-[#101010] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="p-2">
                {options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      value === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {option.color && (
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({option.count})
                        </span>
                      )}
                    </div>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilterPanel(!showFilterPanel)}
        className={`flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm ${
          showFilterPanel || activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
        }`}
      >
        <Filter className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
        <span className="font-medium hidden sm:inline">{t('tasks.filters.title')}</span>
        <span className="font-medium sm:hidden">{t('tasks.filters.filter')}</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel - Expandable Section that appears below the button in document flow */}
      {showFilterPanel && (
        <div className="mt-4   rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4  ">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {t('tasks.filters.title')}
            </h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {t('common.clearAll')}
                </button>
              )}
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('tasks.filters.status')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t('common.all') },
                  { value: 'todo', label: t('tasks.status.todo') },
                  { value: 'in_progress', label: t('tasks.status.inProgress') },
                  { value: 'review', label: t('tasks.status.review') },
                  { value: 'done', label: t('tasks.status.completed') }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('status', option.value)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.status === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('tasks.filters.priority')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t('common.all') },
                  { value: 'critical', label: t('tasks.priority.critical'), color: '#EF4444' },
                  { value: 'high', label: t('tasks.priority.high'), color: '#F97316' },
                  { value: 'medium', label: t('tasks.priority.medium'), color: '#EAB308' },
                  { value: 'low', label: t('tasks.priority.low'), color: '#9CA3AF' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('priority', option.value)}
                    className={`flex items-center px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.priority === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.color && (
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('tasks.filters.assignee')}
              </label>
              <select
                value={filters.assignee}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('common.all')}</option>
                <option value="unassigned">{t('tasks.unassigned')}</option>
                {assignees.map(assignee => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('tasks.filters.project')}
              </label>
              <select
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('common.all')}</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sprint Filter */}
            {sprints.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('tasks.filters.sprint')}
                </label>
                <select
                  value={filters.sprint}
                  onChange={(e) => handleFilterChange('sprint', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="backlog">{t('tasks.backlog')}</option>
                  {sprints.map(sprint => (
                    <option key={sprint} value={sprint}>
                      {sprint}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('tasks.filters.dateRange')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t('common.all') },
                  { value: 'today', label: t('common.today') },
                  { value: 'week', label: t('common.thisWeek') },
                  { value: 'month', label: t('common.thisMonth') }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleDateRangeChange(option.value)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      dateRangeType === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {dateRangeType === 'custom' && (
                <div className="mt-2 space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="p-4   flex justify-end gap-2">
            <button
              onClick={() => {
                clearAllFilters();
                setShowFilterPanel(false);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.clearAll')}
            </button>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.applyFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;