import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Plus,
  MoreVertical,
  Paperclip,
  MessageSquare,
  CheckCircle,
  GitBranch,
  Edit,
  Trash2,
  Copy,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { updateTaskStatus } from '../../services/taskService';

const TaskBoardView = ({ tasks, groupBy, onTaskSelect, onTaskUpdate, onTaskDelete }) => {
  const { t, i18n } = useTranslation();
  const { getToken } = useAuth();
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [updatingTasks, setUpdatingTasks] = useState(new Set()); // Track individual updating tasks
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, task: null });
  const menuRef = useRef(null);
  
  // Check if the current language is RTL
  const isRTL = i18n.language === 'ar';

  // Default board columns with review status
  const defaultColumns = [
    { id: 'todo', title: t('tasks.status.todo'), color: 'bg-gray-500' },
    { id: 'in_progress', title: t('tasks.status.inProgress'), color: 'bg-blue-500' },
    { id: 'review', title: t('tasks.status.review'), color: 'bg-orange-500' },
    { id: 'done', title: t('tasks.status.completed'), color: 'bg-green-500' }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low':
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
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

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const organizeTasks = () => {
    if (groupBy === 'status' || groupBy === 'none') {
      const organized = {};
      defaultColumns.forEach(col => {
        organized[col.id] = {
          title: col.title,
          color: col.color,
          tasks: tasks.filter(task => task.status === col.id)
        };
      });
      return organized;
    }

    // Group by other criteria
    const organized = {};
    tasks.forEach(task => {
      let key, title, color;
      
      switch (groupBy) {
        case 'priority':
          key = task.priority;
          title = t(`tasks.priority.${task.priority}`);
          color = task.priority === 'critical' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500';
          break;
        case 'assignee':
          key = task.assignee?.id || 'unassigned';
          title = task.assignee?.name || t('tasks.unassigned');
          color = 'bg-blue-500';
          break;
        case 'project':
          key = task.project?.id || 'no-project';
          title = task.project?.name || t('tasks.noProject');
          color = task.project?.color ? `bg-[${task.project.color}]` : 'bg-gray-500';
          break;
        case 'sprint':
          key = task.sprint || 'backlog';
          title = task.sprint || t('tasks.backlog');
          color = 'bg-purple-500';
          break;
        default:
          key = 'all';
          title = t('tasks.allTasks');
          color = 'bg-gray-500';
      }

      if (!organized[key]) {
        organized[key] = {
          title,
          color,
          tasks: []
        };
      }
      organized[key].tasks.push(task);
    });

    return organized;
  };

  const handleDragStart = (e, task, columnId) => {
    setDraggedTask({ task, sourceColumn: columnId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (draggedTask && draggedTask.sourceColumn !== targetColumnId) {
      if (groupBy === 'status' || groupBy === 'none') {
        const taskId = draggedTask.task.id;
        
        // Check if this specific task is already being updated
        if (updatingTasks.has(taskId)) {
          setDraggedTask(null);
          return;
        }
        
        // Optimistically update the UI first
        const optimisticTask = {
          ...draggedTask.task,
          status: targetColumnId
        };
        onTaskUpdate(optimisticTask);
        
        // Add to updating set
        setUpdatingTasks(prev => new Set([...prev, taskId]));
        
        // Update task status via API in background
        (async () => {
          try {
            const token = await getToken();
            const response = await updateTaskStatus(taskId, targetColumnId.toUpperCase(), undefined, token);
            
            // Transform the response
            const transformedTask = {
              ...response.task,
              dueDate: response.task.due_date,
              startDate: response.task.start_date,
              status: response.task.status.toLowerCase(),
              priority: response.task.priority.toLowerCase(),
              subtasks: response.task.subtasks || [],
              attachments: response.task.attachments?.length || 0,
              comments: response.task.comments?.length || 0,
              dependencies: response.task.dependencies || []
            };
            
            onTaskUpdate(transformedTask);
          } catch (error) {
            console.error('Error updating task status:', error);
            // Revert the optimistic update on error
            onTaskUpdate(draggedTask.task);
            alert('Failed to update task status');
          } finally {
            // Remove from updating set
            setUpdatingTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskId);
              return newSet;
            });
          }
        })();
      } else {
      // For other groupings, we might need different logic
    }
    }

    setDraggedTask(null);
  };

  const handleAddTask = (columnId) => {
    // This will be handled by parent component
    const newTaskData = {
      status: columnId,
      openModal: true
    };
    // Call parent's create task handler with default status
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('openCreateTaskModal', { detail: newTaskData }));
    }
  };

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e, taskId) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === taskId ? null : taskId);
  };

  const handleEditTask = (e, task) => {
    e.stopPropagation();
    setActiveDropdown(null);
    onTaskSelect(task);
  };

  const handleDeleteTask = async (e, task) => {
    e.stopPropagation();
    setActiveDropdown(null);
    setDeleteConfirmModal({ open: true, task });
  };

  const confirmDelete = () => {
    if (deleteConfirmModal.task && onTaskDelete) {
      onTaskDelete(deleteConfirmModal.task.id);
    }
    setDeleteConfirmModal({ open: false, task: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmModal({ open: false, task: null });
  };

  const handleDuplicateTask = async (e, task) => {
    e.stopPropagation();
    setActiveDropdown(null);
    
    // Create a duplicated task
    const duplicatedTask = {
      ...task,
      title: `${task.title} (Copy)`,
      openModal: true
    };
    
    // Dispatch event to open create modal with prefilled data
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('duplicateTask', { detail: duplicatedTask }));
    }
  };

  const handleMoveTask = async (e, task, newStatus) => {
    e.stopPropagation();
    setActiveDropdown(null);
    
    const updatedTask = {
      ...task,
      status: newStatus
    };
    onTaskUpdate(updatedTask);
  };

  const columns = organizeTasks();

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 pb-4 w-full max-w-full auto-rows-min overflow-x-hidden">
      {Object.entries(columns).map(([columnId, column]) => (
        <div
          key={columnId}
          className="min-w-0 w-full flex flex-col"
        >
          {/* Column Header */}
          <div className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full ${column.color} mr-1.5 sm:mr-2 flex-shrink-0`}></div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {column.title}
                </h3>
                <span className="mx-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex-shrink-0">
                  {column.tasks.length}
                </span>
              </div>
              <button 
                onClick={() => handleAddTask(columnId)}
                className="p-0.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                title={t('tasks.addTask')}
              >
                <Plus className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Column Content */}
          <div
            className={`relative flex-1 min-h-[250px] sm:min-h-[350px] md:min-h-[400px] max-h-[400px] sm:max-h-[500px] md:max-h-[600px] ${
              activeDropdown ? 'overflow-visible' : 'overflow-y-auto overflow-x-visible'
            } bg-gray-50 dark:bg-gray-900/50 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 ${
              draggedOverColumn === columnId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, columnId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, columnId)}
          >
            {column.tasks.map(task => (
              <div
                key={task.id}
                draggable={!updatingTasks.has(task.id)}
                onDragStart={(e) => handleDragStart(e, task, columnId)}
                onClick={() => onTaskSelect(task)}
                className={`group bg-white dark:bg-gray-800 border-2 rounded-lg p-2.5 sm:p-3 cursor-move hover:shadow-lg transition-all ${
                  getPriorityColor(task.priority)
                } ${updatingTasks.has(task.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                  <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white flex-1 line-clamp-2 pr-1">
                    {task.title}
                  </h4>
                  <div className="relative" ref={activeDropdown === task.id ? menuRef : null}>
                    <button
                      onClick={(e) => handleMenuClick(e, task.id)}
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {/* Dropdown Menu - positioned based on RTL/LTR */}
                    {activeDropdown === task.id && (
                      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}
                           style={{ zIndex: 9999 }}>
                        <button
                          onClick={(e) => handleEditTask(e, task)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {t('common.edit')}
                        </button>
                        
                        <button
                          onClick={(e) => handleDuplicateTask(e, task)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {t('common.duplicate')}
                        </button>
                        
                        {/* Move to submenu */}
                        <div className="relative group/submenu">
                          <button
                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <span className="flex items-center">
                              <ArrowRight className="w-4 h-4 mr-2" />
                              {t('tasks.moveTo')}
                            </span>
                            <span className="text-gray-400">›</span>
                          </button>
                          
                          {/* Submenu for status options - positioned based on RTL/LTR */}
                          <div className={`absolute ${isRTL ? 'left-full ml-1' : 'right-full mr-1'} top-0 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover/submenu:block`}
                               style={{ zIndex: 10000 }}>
                            {defaultColumns.filter(col => col.id !== task.status).map(col => (
                              <button
                                key={col.id}
                                onClick={(e) => handleMoveTask(e, task, col.id)}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                              >
                                <div className={`w-2 h-2 rounded-full ${col.color} mr-2`}></div>
                                {col.title}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        
                        <button
                          onClick={(e) => handleDeleteTask(e, task)}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Badge */}
                {task.project && (
                  <div className="flex items-center mb-2">
                    <div
                      className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full mr-0.5 sm:mr-1"
                      style={{ backgroundColor: task.project.color }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {task.project.name}
                    </span>
                    {task.sprint && (
                      <span className="ml-1 sm:ml-2 text-xs text-gray-400 truncate">
                        • {task.sprint}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority and Due Date */}
                <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1">
                  <span className={`px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded ${
                    task.priority === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700'
                  }`}>
                    {t(`tasks.priority.${task.priority}`)}
                  </span>
                  {task.dueDate && (
                    <div className={`flex items-center text-[10px] sm:text-xs ${
                      isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate, task.status) && (
                        <AlertTriangle className="w-3 h-3 ml-1" />
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {task.progress > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>{t('tasks.fields.progress')}</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Task Meta */}
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {/* Assignee */}
                    {task.assignee && (
                      <div className="flex items-center">
                        <div className="w-4 sm:w-5 h-4 sm:h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-2 sm:w-3 h-2 sm:h-3 text-gray-600 dark:text-gray-300" />
                        </div>
                      </div>
                    )}

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-0.5" />
                        <span>
                          {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                        </span>
                      </div>
                    )}

                    {/* Dependencies */}
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="flex items-center">
                        <GitBranch className="w-3 h-3 mr-0.5" />
                        <span>{task.dependencies.length}</span>
                      </div>
                    )}

                    {/* Attachments */}
                    {task.attachments > 0 && (
                      <div className="flex items-center">
                        <Paperclip className="w-3 h-3 mr-0.5" />
                        <span>{task.attachments}</span>
                      </div>
                    )}

                    {/* Comments */}
                    {task.comments > 0 && (
                      <div className="flex items-center">
                        <MessageSquare className="w-3 h-3 mr-0.5" />
                        <span>{task.comments}</span>
                      </div>
                    )}
                  </div>

                  {/* Effort */}
                  {task.estimatedHours && (
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-0.5" />
                      <span>
                        {task.actualHours || 0}/{task.estimatedHours}h
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
                    {task.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded truncate max-w-[60px] sm:max-w-[80px]"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        +{task.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Empty Column State - Clickable */}
            {column.tasks.length === 0 && (
              <div
                onClick={() => handleAddTask(columnId)}
                className="text-center py-4 sm:py-6 text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <div className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-2 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                  <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <p className="text-xs sm:text-sm">{t('tasks.noTasksInColumn')}</p>
                <p className="text-[10px] sm:text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('tasks.clickToAdd')}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('common.confirmDelete')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('tasks.confirmDelete')}
            </p>
            {deleteConfirmModal.task && (
              <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">
                  {deleteConfirmModal.task.title}
                </p>
                {deleteConfirmModal.task.project && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {deleteConfirmModal.task.project.name}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskBoardView;