import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  Tag,
  GitBranch,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  Circle,
  ChevronDown,
  Link2,
  FileText,
  BarChart3,
  Flag,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import * as taskService from '../../services/taskService';

const TaskDetailModal = ({ task, onClose, onUpdate, onDelete, availableTasks = [], projectMembers = [] }) => {
  const { t } = useTranslation();
  const { getToken, userId } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [taskData, setTaskData] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingSubtask, setSavingSubtask] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const tabs = [
    { id: 'overview', label: t('tasks.detail.overview'), icon: FileText },
    { id: 'subtasks', label: t('tasks.detail.subtasks'), icon: CheckCircle },
    { id: 'dependencies', label: t('tasks.detail.dependencies'), icon: GitBranch },
    { id: 'effort', label: t('tasks.detail.effort'), icon: Clock },
    { id: 'activity', label: t('tasks.detail.activity'), icon: MessageSquare }
  ];

  // Load comments when activity tab is active
  useEffect(() => {
    if (activeTab === 'activity' && task.id) {
      loadComments();
    }
  }, [activeTab, task.id]);

  // Update taskData when task prop changes
  useEffect(() => {
    setTaskData(task);
  }, [task]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const token = await getToken();
      const response = await taskService.getTaskComments(task.id, token);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTaskData({ ...taskData, [field]: value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Prepare update data
      const updateData = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assigneeId: taskData.assigneeId,
        due_date: taskData.due_date,
        start_date: taskData.start_date,
        sprint: taskData.sprint,
        tags: taskData.tags || [],
        estimatedHours: taskData.estimatedHours,
        actualHours: taskData.actualHours,
        progress: taskData.progress
      };

      const response = await taskService.updateTask(task.id, updateData, token);
      onUpdate(response.task);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async () => {
    if (newSubtask.trim() && !savingSubtask) {
      try {
        setSavingSubtask(true);
        const token = await getToken();
        const response = await taskService.addSubtask(task.id, newSubtask, token);
        
        // Add the new subtask to the taskData
        const updatedTask = {
          ...taskData,
          subtasks: [...(taskData.subtasks || []), response.subtask],
          _localUpdate: true
        };
        setTaskData(updatedTask);
        onUpdate(updatedTask);
        setNewSubtask('');
      } catch (error) {
        console.error('Error adding subtask:', error);
      } finally {
        setSavingSubtask(false);
      }
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const token = await getToken();
      const subtask = taskData.subtasks.find(st => st.id === subtaskId);
      const response = await taskService.updateSubtask(
        subtaskId, 
        { completed: !subtask.completed }, 
        token
      );
      
      // Update local state
      const updatedSubtasks = taskData.subtasks.map(st =>
        st.id === subtaskId ? response.subtask : st
      );
      const updatedTask = { ...taskData, subtasks: updatedSubtasks, _localUpdate: true };
      setTaskData(updatedTask);
      
      // Recalculate progress if needed
      const progress = calculateProgress(updatedTask);
      if (progress !== updatedTask.progress) {
        const taskUpdate = { ...updatedTask, progress };
        setTaskData(taskUpdate);
        // Update progress in backend
        const updateResponse = await taskService.updateTask(
          task.id,
          { progress },
          token
        );
        // After backend update, use the response (without _localUpdate flag)
        const transformedTask = {
          ...updateResponse.task,
          dueDate: updateResponse.task.due_date,
          startDate: updateResponse.task.start_date,
          status: updateResponse.task.status.toLowerCase(),
          priority: updateResponse.task.priority.toLowerCase()
        };
        onUpdate(transformedTask);
      } else {
        onUpdate(updatedTask);
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const token = await getToken();
      await taskService.deleteSubtask(subtaskId, token);
      
      const updatedSubtasks = taskData.subtasks.filter(st => st.id !== subtaskId);
      const updatedTask = { ...taskData, subtasks: updatedSubtasks, _localUpdate: true };
      setTaskData(updatedTask);
      onUpdate(updatedTask);
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleAddDependency = async (dependsOnTaskId) => {
    try {
      const token = await getToken();
      const response = await taskService.addTaskDependency(task.id, dependsOnTaskId, token);
      
      // Update local state with the new dependency
      // Make sure to use the full dependency object from the response
      const newDependency = response.dependency;
      const updatedDependencies = [...(taskData.dependencies || []), newDependency];
      const updatedTask = { ...taskData, dependencies: updatedDependencies, _localUpdate: true };
      setTaskData(updatedTask);
      
      // Important: Update the parent's task list to ensure persistence
      // Mark this as a local update so parent doesn't make another API call
      onUpdate(updatedTask);
    } catch (error) {
      console.error('Error adding dependency:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message); // Show error message to user
      }
    }
  };

  const handleRemoveDependency = async (dependencyId) => {
    try {
      const token = await getToken();
      await taskService.removeTaskDependency(task.id, dependencyId, token);
      
      // Update local state
      const updatedDependencies = taskData.dependencies.filter(dep => dep.id !== dependencyId);
      const updatedTask = { ...taskData, dependencies: updatedDependencies, _localUpdate: true };
      setTaskData(updatedTask);
      
      // Mark this as a local update so parent doesn't make another API call
      onUpdate(updatedTask);
    } catch (error) {
      console.error('Error removing dependency:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        const token = await getToken();
        const response = await taskService.addComment(task.id, newComment, token);
        setComments([...comments, response.comment]);
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  const calculateProgress = (taskToCalculate = taskData) => {
    if (!taskToCalculate.subtasks || taskToCalculate.subtasks.length === 0) {
      return taskToCalculate.progress || 0;
    }
    const completed = taskToCalculate.subtasks.filter(st => st.completed).length;
    return Math.round((completed / taskToCalculate.subtasks.length) * 100);
  };

  useEffect(() => {
    const progress = calculateProgress();
    if (progress !== taskData.progress) {
      setTaskData({ ...taskData, progress });
    }
  }, [taskData.subtasks]);

  // Get available tasks for dependencies (filter out current task and already dependent tasks)
  const getAvailableDependencyTasks = () => {
    const dependentIds = taskData.dependencies?.map(dep => {
      // Handle different dependency structures
      if (dep.dependsOnTaskId) {
        // This is a dependency object from backend
        return dep.dependsOnTaskId;
      } else if (dep.id && !dep.title) {
        // This might be a dependency ID
        return dep.id;
      } else if (dep.id && dep.title) {
        // This is a direct task object
        return dep.id;
      } else if (typeof dep === 'string') {
        // This is just a task ID
        return dep;
      }
      return null;
    }).filter(Boolean) || [];
    
    return availableTasks.filter(t =>
      t.id !== task.id && !dependentIds.includes(t.id)
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-2xl bg-opacity-50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-[#101010] rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-5xl h-[90vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            {editMode ? (
              <input
                type="text"
                value={taskData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-lg sm:text-2xl font-bold bg-transparent border-b-2 border-blue-500 text-gray-900 dark:text-white focus:outline-none w-full"
                autoFocus
              />
            ) : (
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {taskData.title}
              </h2>
            )}

            {/* Task Meta - Scrollable on mobile */}
            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 overflow-x-auto">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                taskData.priority === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                taskData.priority === 'HIGH' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                taskData.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700'
              }`}>
                {taskData.priority?.toLowerCase()}
              </span>
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                taskData.status === 'DONE' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                taskData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                taskData.status === 'REVIEW' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700'
              }`}>
                {taskData.status === 'DONE' ? t('tasks.status.completed') : taskData.status?.toLowerCase().replace('_', ' ')}
              </span>

              {taskData.project && (
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mx-2"
                    style={{ backgroundColor: '#3B82F6' }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {taskData.project.name}
                  </span>
                </div>
              )}

              {taskData.sprint && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {taskData.sprint}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setTaskData(task);
                    setEditMode(false);
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 px-3 sm:px-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.id === 'subtasks' && taskData.subtasks?.length > 0 && (
                  <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {taskData.subtasks.filter(st => st.completed).length}/{taskData.subtasks.length}
                  </span>
                )}
                {tab.id === 'dependencies' && taskData.dependencies?.length > 0 && (
                  <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {taskData.dependencies.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tasks.fields.description')}
                </label>
                {editMode ? (
                  <textarea
                    value={taskData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {taskData.description || t('tasks.noDescription')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Assignee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.assignee')}
                  </label>
                  {editMode ? (
                    <select
                      value={taskData.assigneeId || ''}
                      onChange={(e) => handleInputChange('assigneeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('tasks.unassigned')}</option>
                      {projectMembers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      {taskData.assignee ? (
                        <>
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-2">
                            {taskData.assignee.image ? (
                              <img src={taskData.assignee.image} alt={taskData.assignee.name} className="w-full h-full rounded-full" />
                            ) : (
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            )}
                          </div>
                          <span className="text-gray-900 dark:text-white">
                            {taskData.assignee.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('tasks.unassigned')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.status')}
                  </label>
                  {editMode ? (
                    <select
                      value={taskData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TODO">{t('tasks.status.todo')}</option>
                      <option value="IN_PROGRESS">{t('tasks.status.inProgress')}</option>
                      <option value="REVIEW">{t('tasks.status.review')}</option>
                      <option value="DONE">{t('tasks.status.completed')}</option>
                    </select>
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {taskData.status === 'DONE' ? t('tasks.status.completed') : 
                       taskData.status === 'IN_PROGRESS' ? t('tasks.status.inProgress') :
                       taskData.status === 'TODO' ? t('tasks.status.todo') :
                       taskData.status === 'REVIEW' ? t('tasks.status.review') : taskData.status}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.priority')}
                  </label>
                  {editMode ? (
                    <select
                      value={taskData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CRITICAL">{t('tasks.priority.critical')}</option>
                      <option value="HIGH">{t('tasks.priority.high')}</option>
                      <option value="MEDIUM">{t('tasks.priority.medium')}</option>
                      <option value="LOW">{t('tasks.priority.low')}</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                      taskData.priority === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                      taskData.priority === 'HIGH' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                      taskData.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700'
                    }`}>
                      {t(`tasks.priority.${taskData.priority?.toLowerCase()}`)}
                    </span>
                  )}
                </div>

                {/* Sprint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.sprint')}
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={taskData.sprint || ''}
                      onChange={(e) => handleInputChange('sprint', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {taskData.sprint || t('common.none')}
                    </span>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.startDate')}
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      value={taskData.start_date ? new Date(taskData.start_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <Calendar className="w-4 h-4 mx-2 text-gray-400" />
                      {taskData.start_date ? new Date(taskData.start_date).toLocaleDateString() : t('common.none')}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.dueDate')}
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      value={taskData.due_date ? new Date(taskData.due_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <Calendar className="w-4 h-4 mx-2 text-gray-400" />
                      {taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : t('common.none')}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tasks.fields.tags')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(taskData.tags) ? taskData.tags : []).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      {editMode && (
                        <button
                          onClick={() => {
                            const newTags = taskData.tags.filter((_, i) => i !== index);
                            handleInputChange('tags', newTags);
                          }}
                          className="mx-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {editMode && (
                    <button className="px-3 py-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tasks.fields.progress')}
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {calculateProgress()}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subtasks Tab */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder={t('tasks.addSubtask')}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={savingSubtask || !newSubtask.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingSubtask ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              <div className="space-y-2">
                {taskData.subtasks?.map(subtask => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => handleToggleSubtask(subtask.id)}
                        className="mx-3"
                      >
                        {subtask.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span className={`${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {(!taskData.subtasks || taskData.subtasks.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('tasks.noSubtasks')}</p>
                </div>
              )}
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === 'dependencies' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('tasks.dependsOn')}
                </h3>
                <div className="space-y-2">
                  {taskData.dependencies?.map(dep => {
                    // Handle both direct task objects and dependency objects with nested dependsOnTask
                    let depTask = null;
                    let depId = null;
                    
                    if (dep.dependsOnTask) {
                      // This is a dependency object from backend with nested task
                      depTask = dep.dependsOnTask;
                      depId = dep.id;
                    } else if (dep.id && dep.title) {
                      // This is a direct task object
                      depTask = dep;
                      depId = dep.id;
                    } else if (typeof dep === 'string') {
                      // This is just a task ID
                      depTask = availableTasks.find(t => t.id === dep);
                      depId = dep;
                    }
                    
                    return depTask ? (
                      <div
                        key={depId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <Link2 className="w-4 h-4 mx-2 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {depTask.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveDependency(depId)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('tasks.availableDependencies')}
                </h3>
                <div className="space-y-2">
                  {getAvailableDependencyTasks().map(availableTask => (
                    <div
                      key={availableTask.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {availableTask.title}
                      </span>
                      <button
                        onClick={() => handleAddDependency(availableTask.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {t('common.add')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {taskData.dependencies?.length === 0 && availableTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('tasks.noDependencies')}</p>
                </div>
              )}
            </div>
          )}

          {/* Effort Tab */}
          {activeTab === 'effort' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.estimatedHours')}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={taskData.estimatedHours || 0}
                      onChange={(e) => handleInputChange('estimatedHours', parseInt(e.target.value) || 0)}
                      disabled={!editMode}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      min="0"
                    />
                    <span className="mx-2 text-gray-600 dark:text-gray-400">
                      {t('common.hours')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tasks.fields.actualHours')}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={taskData.actualHours || 0}
                      onChange={(e) => handleInputChange('actualHours', parseInt(e.target.value) || 0)}
                      disabled={!editMode}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      min="0"
                    />
                    <span className="mx-2 text-gray-600 dark:text-gray-400">
                      {t('common.hours')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Effort Visualization */}
              {(taskData.estimatedHours > 0 || taskData.actualHours > 0) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('tasks.effortComparison')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('tasks.estimated')}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {taskData.estimatedHours || 0}h
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('tasks.actual')}
                        </span>
                        <span className={`text-sm font-medium ${
                          taskData.actualHours > taskData.estimatedHours 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {taskData.actualHours || 0}h
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            taskData.actualHours > taskData.estimatedHours 
                              ? 'bg-red-600' 
                              : 'bg-green-600'
                          }`}
                          style={{ 
                            width: taskData.estimatedHours > 0 
                              ? `${Math.min(100, (taskData.actualHours / taskData.estimatedHours) * 100)}%`
                              : '0%'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {taskData.actualHours > taskData.estimatedHours && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="w-4 h-4 mx-2" />
                        <span className="text-sm font-medium">
                          {t('tasks.overEstimate', {
                            hours: taskData.actualHours - taskData.estimatedHours
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Add Comment */}
              <div className="flex gap-2">
                <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('tasks.addComment')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {t('common.comment')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Feed */}
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 sm:gap-3">
                      <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 overflow-hidden">
                        {comment.user?.image ? (
                          <img src={comment.user.image} alt={comment.user.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.user?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && !loadingComments && (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t('tasks.noComments')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('common.confirmDelete')}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                {t('tasks.deleteConfirmMessage')}
              </p>
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;