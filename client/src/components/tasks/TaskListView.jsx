import React from 'react';
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  MoreVertical,
  CheckCircle,
  Circle,
  Paperclip,
  MessageSquare,
  GitBranch,
  Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TaskListView = ({ tasks, groupBy, onTaskSelect, onTaskUpdate }) => {
  const { t } = useTranslation();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo':
        return <Circle className="w-4 h-4 text-gray-400" />;
      case 'in_progress':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'review':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo':
        return t('tasks.status.todo');
      case 'in_progress':
        return t('tasks.status.inProgress');
      case 'review':
        return t('tasks.status.review');
      case 'done':
        return t('tasks.status.completed');
      default:
        return status;
    }
  };

  const groupTasks = () => {
    if (groupBy === 'none') {
      return { [t('tasks.allTasks')]: tasks };
    }

    const grouped = {};
    tasks.forEach(task => {
      let key;
      switch (groupBy) {
        case 'status':
          key = getStatusText(task.status);
          break;
        case 'priority':
          key = t(`tasks.priority.${task.priority}`);
          break;
        case 'assignee':
          key = task.assignee?.name || t('tasks.unassigned');
          break;
        case 'project':
          key = task.project?.name || t('tasks.noProject');
          break;
        case 'sprint':
          key = task.sprint || t('tasks.backlog');
          break;
        default:
          key = t('tasks.allTasks');
      }
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });
    return grouped;
  };

  const handleQuickStatusChange = (e, task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onTaskUpdate({ ...task, status: newStatus });
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'done') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('common.today');
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t('common.tomorrow');
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedTasks = groupTasks();

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
        <div key={groupName}>
          {groupBy !== 'none' && (
            <div className="flex items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {groupName}
              </h3>
              <span className="mx-2 px-2 py-0.5 text-xs   text-gray-600 dark:text-gray-400 rounded-full">
                {groupTasks.length}
              </span>
              <div className="flex-1 mx-4 h-px  "></div>
            </div>
          )}

          <div className="space-y-2">
            {groupTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onTaskSelect(task)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => handleQuickStatusChange(e, task)}
                      className="mt-0.5 mr-2 sm:mx-3 hover:scale-110 transition-transform flex-shrink-0"
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Title and Project */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-1 sm:gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate ${
                            task.status === 'done' ? 'line-through opacity-60' : ''
                          }`}>
                            {task.title}
                          </h4>
                          {task.project && (
                            <div className="flex items-center mt-1">
                              <div
                                className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                style={{ backgroundColor: task.project.color }}
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {task.project.name}
                              </span>
                              {task.sprint && (
                                <>
                                  <span className="mx-1 text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {task.sprint}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Priority Badge */}
                        <span className={`ml-auto sm:ml-2 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Task Meta Information - Responsive layout */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {/* Assignee */}
                        {task.assignee && (
                          <div className="flex items-center">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-1">
                              <User className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="hidden sm:inline">{task.assignee.name}</span>
                            <span className="sm:hidden">{task.assignee.name.split(' ')[0]}</span>
                          </div>
                        )}

                        {/* Due Date */}
                        <div className={`flex items-center ${
                          isOverdue(task.dueDate, task.status) ? 'text-red-600' : ''
                        }`}>
                          <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                          <span>{formatDate(task.dueDate)}</span>
                          {isOverdue(task.dueDate, task.status) && (
                            <AlertTriangle className="w-3 sm:w-4 h-3 sm:h-4 ml-1" />
                          )}
                        </div>

                        {/* Progress */}
                        {task.progress > 0 && (
                          <div className="flex items-center">
                            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="mx-1 text-xs">{task.progress}%</span>
                          </div>
                        )}

                        {/* Subtasks - Hidden on mobile */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="hidden sm:flex items-center">
                            <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                            <span>
                              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                            </span>
                          </div>
                        )}

                        {/* Dependencies - Hidden on mobile */}
                        {task.dependencies && task.dependencies.length > 0 && (
                          <div className="hidden sm:flex items-center">
                            <GitBranch className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                            <span>{task.dependencies.length}</span>
                          </div>
                        )}

                        {/* Attachments */}
                        {task.attachments > 0 && (
                          <div className="flex items-center">
                            <Paperclip className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                            <span>{task.attachments}</span>
                          </div>
                        )}

                        {/* Comments */}
                        {task.comments > 0 && (
                          <div className="flex items-center">
                            <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                            <span>{task.comments}</span>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {task.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Effort - Hidden on mobile */}
                        {task.estimatedHours && (
                          <div className="hidden sm:flex items-center">
                            <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                            <span>
                              {task.actualHours}/{task.estimatedHours}h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu - Always visible on mobile */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement actions menu
                    }}
                    className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded self-start mt-1 sm:mt-0"
                  >
                    <MoreVertical className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Circle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('tasks.noTasks')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('tasks.noTasksDescription')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskListView;