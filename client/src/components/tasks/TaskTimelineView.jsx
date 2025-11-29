import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Maximize2,
  GitBranch
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const TaskTimelineView = ({ tasks, onTaskSelect, onTaskUpdate }) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef(null);
  const [viewMode, setViewMode] = useState('week'); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredTask, setHoveredTask] = useState(null);
  const [hoveredDependency, setHoveredDependency] = useState(null);

  // Calculate timeline range
  const getTimelineRange = () => {
    if (tasks.length === 0) {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      return { start, end };
    }

    const dates = [];
    tasks.forEach(task => {
      if (task.startDate) dates.push(new Date(task.startDate));
      if (task.dueDate) dates.push(new Date(task.dueDate));
    });

    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));
    
    // Add padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();

  // Generate date columns based on view mode - Limited to 15 days/3 weeks/1 month
  const generateDateColumns = () => {
    const columns = [];
    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        // Show 15 days centered around current date
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() + 7);
        
        const current = new Date(startDate);
        while (current <= endDate) {
          columns.push({
            date: new Date(current),
            label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isToday: isToday(current),
            isWeekend: current.getDay() === 0 || current.getDay() === 6
          });
          current.setDate(current.getDate() + 1);
        }
        break;
        
      case 'week':
        // Show 3 weeks centered around current week
        startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()) + 7);
        
        const weekCurrent = new Date(startDate);
        while (weekCurrent <= endDate) {
          const weekStart = new Date(weekCurrent);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          columns.push({
            date: new Date(weekStart),
            endDate: new Date(weekEnd),
            label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`,
            isCurrentWeek: isCurrentWeek(weekStart),
            week: getWeekNumber(weekStart)
          });
          weekCurrent.setDate(weekCurrent.getDate() + 7);
        }
        break;
        
      case 'month':
        // Show 1 month centered around current month
        columns.push({
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
          label: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          isCurrentMonth: isCurrentMonth(currentDate)
        });
        break;
    }
    
    return columns;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentWeek = (date) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return date >= weekStart && date <= weekEnd;
  };

  const isCurrentMonth = (date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Get responsive column width based on view mode and screen size
  const getColumnWidth = () => {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 640; // sm breakpoint
    const isTablet = screenWidth < 768; // md breakpoint
    
    // Calculate available width (subtract sidebar width)
    const sidebarWidth = isMobile ? 96 : isTablet ? 128 : 256;
    const availableWidth = screenWidth - sidebarWidth - 32; // 32px for padding
    
    switch (viewMode) {
      case 'day':
        // For 15 days, distribute available width
        const dayWidth = Math.floor(availableWidth / 15);
        return Math.min(dayWidth, isMobile ? 20 : isTablet ? 40 : 50);
      case 'week':
        // For 3 weeks
        const weekWidth = Math.floor(availableWidth / 3);
        return Math.min(weekWidth, isMobile ? 100 : isTablet ? 150 : 200);
      case 'month':
        // For 1 month
        return Math.min(availableWidth - 100, isMobile ? 200 : isTablet ? 300 : 400);
      default:
        return 60;
    }
  };

  const calculateTaskPosition = (task, columns) => {
    if (!task.startDate || !task.dueDate || columns.length === 0) return null;

    const startDate = new Date(task.startDate);
    const endDate = new Date(task.dueDate);
    const colWidth = getColumnWidth();
    
    // Get the timeline boundaries
    const timelineStart = columns[0].date;
    const timelineEnd = columns[columns.length - 1].endDate || columns[columns.length - 1].date;
    
    // Check if task is outside the visible timeline
    if (endDate < timelineStart || startDate > timelineEnd) {
      return null; // Task is outside visible range
    }
    
    let startCol = -1;
    let endCol = -1;
    let startOffset = 0;
    let endOffset = 1;

    // If task starts before timeline, set it to start of timeline
    if (startDate < timelineStart) {
      startCol = 0;
      startOffset = 0;
    } else {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const colStart = col.date;
        const colEnd = col.endDate || col.date;

        if (startDate >= colStart && startDate <= colEnd) {
          startCol = i;
          if (viewMode === 'day') {
            startOffset = 0;
          } else {
            const totalDays = (colEnd - colStart) / (1000 * 60 * 60 * 24) + 1;
            const daysFromStart = (startDate - colStart) / (1000 * 60 * 60 * 24);
            startOffset = daysFromStart / totalDays;
          }
          break;
        }
      }
    }

    // If task ends after timeline, set it to end of timeline
    if (endDate > timelineEnd) {
      endCol = columns.length - 1;
      endOffset = 1;
    } else {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const colStart = col.date;
        const colEnd = col.endDate || col.date;

        if (endDate >= colStart && endDate <= colEnd) {
          endCol = i;
          if (viewMode === 'day') {
            endOffset = 1;
          } else {
            const totalDays = (colEnd - colStart) / (1000 * 60 * 60 * 24) + 1;
            const daysFromStart = (endDate - colStart) / (1000 * 60 * 60 * 24) + 1;
            endOffset = daysFromStart / totalDays;
          }
          break;
        }
      }
    }

    if (startCol === -1 || endCol === -1) return null;

    return {
      left: `${(startCol + startOffset) * colWidth}px`,
      width: `${((endCol - startCol) + (endOffset - startOffset)) * colWidth}px`
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 border-red-600';
      case 'high':
        return 'bg-orange-500 border-orange-600';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600';
      case 'low':
        return 'bg-gray-400 border-gray-500';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getStatusOpacity = (status) => {
    switch (status) {
      case 'done':
        return 'opacity-60';
      case 'todo':
        return 'opacity-80';
      default:
        return '';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'done') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const navigateTimeline = (direction) => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        // Move by 15 days
        newDate.setDate(newDate.getDate() + (direction === 'forward' ? 15 : -15));
        break;
      case 'week':
        // Move by 3 weeks
        newDate.setDate(newDate.getDate() + (direction === 'forward' ? 21 : -21));
        break;
      case 'month':
        // Move by 1 month
        newDate.setMonth(newDate.getMonth() + (direction === 'forward' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const scrollToToday = () => {
    setCurrentDate(new Date());
    if (scrollContainerRef.current) {
      // Calculate position of today's column
      const todayIndex = columns.findIndex(col =>
        viewMode === 'day' ? isToday(col.date) :
        viewMode === 'week' ? isCurrentWeek(col.date) :
        isCurrentMonth(col.date)
      );
      if (todayIndex !== -1) {
        const colWidth = getColumnWidth();
        scrollContainerRef.current.scrollLeft = todayIndex * colWidth - 200;
      }
    }
  };

  const renderDependencyLine = (fromTask, toTaskId) => {
    const toTask = tasks.find(t => t.id === toTaskId);
    if (!toTask || !fromTask.dueDate || !toTask.startDate) return null;

    const fromDate = new Date(fromTask.dueDate);
    const toDate = new Date(toTask.startDate);
    
    const fromPos = calculateTaskPosition(fromTask, columns);
    const toPos = calculateTaskPosition(toTask, columns);
    
    if (!fromPos || !toPos) return null;

    const fromX = parseFloat(fromPos.left) + parseFloat(fromPos.width);
    const fromY = tasks.indexOf(fromTask) * 60 + 30;
    const toX = parseFloat(toPos.left);
    const toY = tasks.indexOf(toTask) * 60 + 30;

    return (
      <svg
        key={`dep-${fromTask.id}-${toTaskId}`}
        className="absolute pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6B7280"
            />
          </marker>
        </defs>
        <path
          d={`M ${fromX} ${fromY} L ${toX - 10} ${toY}`}
          stroke="#6B7280"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          markerEnd="url(#arrowhead)"
          className={hoveredDependency === `${fromTask.id}-${toTaskId}` ? 'stroke-blue-500' : ''}
          onMouseEnter={() => setHoveredDependency(`${fromTask.id}-${toTaskId}`)}
          onMouseLeave={() => setHoveredDependency(null)}
        />
      </svg>
    );
  };

  const columns = generateDateColumns();

  useEffect(() => {
    scrollToToday();
  }, [viewMode]);

  return (
    <div className="relative  max-w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden lg:w-auto  w-80 mx-auto "  >
      {/* Timeline Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
              {t('tasks.views.timeline')}
            </h3>
            
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
              {['day', 'week', 'month'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t(`tasks.timeline.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
            {/* Navigation */}
            <button
              onClick={() => navigateTimeline('backward')}
              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={scrollToToday}
              className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              {t('common.today')}
            </button>
            
            <button
              onClick={() => navigateTimeline('forward')}
              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="relative w-full max-w-full overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="w-full max-w-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          {/* Date Headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 min-w-0">
            <div className="flex-shrink-0 w-24 sm:w-32 md:w-48 lg:w-64 p-1 sm:p-2 md:p-3 border-r border-gray-200 dark:border-gray-700" style={{ maxWidth: '256px' }}>
              <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('tasks.fields.taskName')}
              </span>
            </div>
            <div className="flex flex-nowrap">
              {columns.map((col, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 p-0.5 sm:p-1 md:p-2 text-center border-r border-gray-200 dark:border-gray-700 ${
                    col.isToday || col.isCurrentWeek || col.isCurrentMonth
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : col.isWeekend
                      ? 'bg-gray-50 dark:bg-gray-900/50'
                      : ''
                  }`}
                  style={{
                    width: `${getColumnWidth()}px`,
                    minWidth: `${getColumnWidth()}px`,
                    maxWidth: `${getColumnWidth()}px`
                  }}
                >
                  <div className={`font-medium text-gray-700 dark:text-gray-300 truncate ${
                    viewMode === 'day' ? 'text-[9px] sm:text-[10px] md:text-xs' : 'text-[10px] sm:text-xs'
                  }`}>
                    {viewMode === 'day' && window.innerWidth < 640
                      ? col.date.getDate() // Show only day number on mobile in day view
                      : col.label
                    }
                  </div>
                  {viewMode === 'week' && col.week && (
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      {t('tasks.timeline.weekPrefix')}{col.week}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="relative min-w-0">
            {/* Today Line */}
            {columns.some(col => col.isToday || col.isCurrentWeek || col.isCurrentMonth) && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{
                  left: `${columns.findIndex(col =>
                    col.isToday || col.isCurrentWeek || col.isCurrentMonth
                  ) * getColumnWidth() + 256}px`
                }}
              >
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-[9px] sm:text-[10px] md:text-xs px-1 rounded">
                  {t('common.today')}
                </div>
              </div>
            )}

            {/* Dependency Lines */}
            {tasks.map(task => 
              task.dependencies?.map(depId => renderDependencyLine(task, depId))
            )}

            {/* Task Bars */}
            {tasks.map((task, taskIndex) => {
              const position = calculateTaskPosition(task, columns);

              return (
                <div
                  key={task.id}
                  className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 relative"
                  style={{ height: '60px' }}
                >
                  {/* Task Name */}
                  <div
                    className="flex-shrink-0 w-24 sm:w-32 md:w-48 lg:w-64 p-1 sm:p-2 md:p-3 border-r border-gray-200 dark:border-gray-700 flex items-center overflow-hidden"
                    onClick={() => onTaskSelect(task)}
                  >
                    <div className="flex items-center flex-1 cursor-pointer min-w-0">
                      {task.assignee && (
                        <div className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-0.5 sm:mr-1 md:mr-2 flex-shrink-0">
                          <User className="w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 text-gray-600 dark:text-gray-300" />
                        </div>
                      )}
                      <span className="text-[9px] sm:text-xs md:text-sm text-gray-900 dark:text-white truncate">
                        {task.title}
                      </span>
                      {isOverdue(task.dueDate, task.status) && (
                        <AlertTriangle className="w-2.5 sm:w-3 md:w-4 h-2.5 sm:h-3 md:h-4 ml-0.5 sm:ml-1 md:ml-2 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Timeline Area */}
                  <div className="flex-1 relative min-w-0 overflow-hidden">
                    {/* Grid Lines */}
                    {columns.map((_, index) => (
                      <div
                        key={index}
                        className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-gray-800"
                        style={{ left: `${index * getColumnWidth()}px` }}
                      />
                    ))}

                    {/* Task Bar */}
                    {position && (
                      <div
                        className={`absolute top-3 h-10 rounded-md border-2 flex items-center px-2 cursor-pointer transition-all hover:shadow-lg ${
                          getPriorityColor(task.priority)
                        } ${getStatusOpacity(task.status)}`}
                        style={{
                          left: position.left,
                          width: position.width
                        }}
                        onClick={() => onTaskSelect(task)}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {/* Progress Bar */}
                        <div
                          className="absolute inset-0 bg-white/20 rounded-md"
                          style={{ width: `${task.progress}%` }}
                        />
                        
                        {/* Task Content - Hide on very narrow columns */}
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className={`text-white font-medium truncate ${
                            viewMode === 'day' && window.innerWidth < 640 ? 'text-[8px]' : 'text-xs'
                          }`}>
                            {viewMode === 'day' && window.innerWidth < 640
                              ? task.title.substring(0, 3) // Show only first 3 characters on mobile day view
                              : task.title
                            }
                          </span>
                          {task.dependencies && task.dependencies.length > 0 && window.innerWidth >= 640 && (
                            <GitBranch className="w-2 sm:w-3 h-2 sm:h-3 text-white ml-0.5 sm:ml-1 flex-shrink-0" />
                          )}
                        </div>

                        {/* Tooltip */}
                        {hoveredTask === task.id && (
                          <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-30 whitespace-nowrap">
                            <div className="font-semibold">{task.title}</div>
                            <div>{task.assignee?.name || t('tasks.unassigned')}</div>
                            <div>
                              {new Date(task.startDate).toLocaleDateString()} - {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div>{t('tasks.fields.progress')}: {task.progress}%</div>
                            {task.estimatedHours && (
                              <div>{t('tasks.detail.effort')}: {task.actualHours}/{task.estimatedHours}h</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend - Scrollable on mobile */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
        <div className="flex items-center justify-between min-w-max sm:min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded mr-1"></div>
              <span className="text-gray-600 dark:text-gray-400">{t('tasks.priority.critical')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-orange-500 rounded mr-1"></div>
              <span className="text-gray-600 dark:text-gray-400">{t('tasks.priority.high')}</span>
            </div>
            <div className="flex items-center hidden sm:flex">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
              <span className="text-gray-600 dark:text-gray-400">{t('tasks.priority.medium')}</span>
            </div>
            <div className="flex items-center hidden sm:flex">
              <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
              <span className="text-gray-600 dark:text-gray-400">{t('tasks.priority.low')}</span>
            </div>
            <div className="flex items-center ml-2 sm:ml-4">
              <GitBranch className="w-2 sm:w-3 h-2 sm:h-3 mr-1 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{t('tasks.hasDependencies')}</span>
            </div>
          </div>
          
          <button
            className="p-0.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            onClick={() => {
              toast.success('Fullscreen mode activated', {
                duration: 3000,
                position: 'top-right',
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
                icon: '🔍',
              });
            }}
          >
            <Maximize2 className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTimelineView;
