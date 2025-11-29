import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Filter,
  Plus,
  ChevronRight,
  Circle,
  BarChart3,
  ListTodo
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import TaskListView from '../components/tasks/TaskListView';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import { getUserTasks, createTask, updateTask, deleteTasks } from '../services/taskService';

const MyTasks = () => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState('todo');
  const [activeFilter, setActiveFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('none');

  // Get current user from localStorage or state
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch user's tasks function
  const fetchUserTasks = async () => {
    try {
      setLoading(true);
      
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setLoading(false);
        return;
      }
      
      const response = await getUserTasks(token);
      
      // Transform task data to match frontend expectations
      const transformedTasks = response.tasks.map(task => ({
        ...task,
        dueDate: task.due_date,
        startDate: task.start_date,
        status: task.status.toLowerCase().replace('_', '_'),
        priority: task.priority.toLowerCase(),
        subtasks: task.subtasks || [],
        attachments: task.attachments?.length || 0,
        comments: task.comments?.length || 0,
        // Preserve the full dependency structure with nested task information
        dependencies: task.dependencies || []
      }));
      
      setTasks(transformedTasks);
      setFilteredTasks(transformedTasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's tasks on component mount
  useEffect(() => {
    fetchUserTasks();
  }, []);

  // Listen for custom event from TaskBoardView to open create task modal
  useEffect(() => {
    const handleOpenCreateTask = (event) => {
      if (event.detail?.status) {
        setCreateTaskDefaultStatus(event.detail.status);
      }
      setShowCreateModal(true);
    };

    window.addEventListener('openCreateTaskModal', handleOpenCreateTask);
    return () => {
      window.removeEventListener('openCreateTaskModal', handleOpenCreateTask);
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...tasks];

    switch (activeFilter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        result = result.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
        break;
      case 'overdue':
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        result = result.filter(task => {
          if (task.status === 'done') return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < now;
        });
        break;
      case 'upcoming':
        const currentDate = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        result = result.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate >= currentDate && dueDate <= nextWeek && task.status !== 'done';
        });
        break;
      case 'completed':
        result = result.filter(task => task.status === 'done');
        break;
      case 'in_progress':
        result = result.filter(task => task.status === 'in_progress');
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredTasks(result);
  }, [tasks, activeFilter]);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskUpdate = async (updatedTask) => {
    // If the update is just for local state (like after adding a dependency),
    // update the local state directly without calling the backend
    if (updatedTask._localUpdate) {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      setSelectedTask(updatedTask);
      return;
    }

    try {
      const token = await getToken();
      const response = await updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status.toUpperCase(),
        priority: updatedTask.priority.toUpperCase(),
        assigneeId: updatedTask.assignee?.id,
        due_date: updatedTask.dueDate,
        start_date: updatedTask.startDate,
        sprint: updatedTask.sprint,
        tags: updatedTask.tags,
        estimatedHours: updatedTask.estimatedHours,
        actualHours: updatedTask.actualHours,
        progress: updatedTask.progress
      }, token);

      const transformedTask = {
        ...response.task,
        dueDate: response.task.due_date,
        startDate: response.task.start_date,
        status: response.task.status.toLowerCase(),
        priority: response.task.priority.toLowerCase(),
        subtasks: response.task.subtasks || [],
        attachments: response.task.attachments?.length || 0,
        comments: response.task.comments?.length || 0,
        // Preserve the full dependency structure with nested task information
        dependencies: response.task.dependencies || []
      };

      setTasks(tasks.map(t => t.id === transformedTask.id ? transformedTask : t));
      setSelectedTask(transformedTask);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskCreate = async (newTask) => {
    try {
      const token = await getToken();
      const response = await createTask({
        projectId: newTask.project?.id,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status.toUpperCase(),
        priority: newTask.priority.toUpperCase(),
        assigneeId: currentUser.id || newTask.assignee?.id, // Default to current user
        due_date: newTask.dueDate,
        start_date: newTask.startDate,
        sprint: newTask.sprint,
        tags: newTask.tags,
        estimatedHours: newTask.estimatedHours
      }, token);

      const transformedTask = {
        ...response.task,
        dueDate: response.task.due_date,
        startDate: response.task.start_date,
        status: response.task.status.toLowerCase(),
        priority: response.task.priority.toLowerCase(),
        subtasks: response.task.subtasks || [],
        attachments: response.task.attachments?.length || 0,
        comments: response.task.comments?.length || 0,
        // Preserve the full dependency structure with nested task information
        dependencies: response.task.dependencies || []
      };

      setShowCreateModal(false);
      
      // Refresh the entire task list to ensure consistency
      await fetchUserTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Error creating task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      const token = await getToken();
      await deleteTasks([taskId], token);
      setTasks(tasks.filter(t => t.id !== taskId));
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    const overdueTasks = tasks.filter(task => {
      if (task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < today;
    });

    const completedThisWeek = tasks.filter(task => {
      if (task.status !== 'done') return false;
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const updatedDate = new Date(task.updatedAt);
      return updatedDate >= weekStart;
    });

    const totalHoursThisWeek = tasks.reduce((sum, task) => {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const taskDate = new Date(task.startDate || task.createdAt);
      if (taskDate >= weekStart) {
        return sum + (task.actualHours || 0);
      }
      return sum;
    }, 0);

    return {
      todayCount: todayTasks.length,
      overdueCount: overdueTasks.length,
      completedWeek: completedThisWeek.length,
      hoursWeek: totalHoursThisWeek,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      total: tasks.length
    };
  };

  const stats = calculateStats();

  const quickFilters = [
    { id: 'all', label: t('myTasks.filters.all'), count: tasks.length, color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'today', label: t('myTasks.filters.today'), count: stats.todayCount, color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'overdue', label: t('myTasks.filters.overdue'), count: stats.overdueCount, color: 'bg-red-100 dark:bg-red-900/20' },
    { id: 'upcoming', label: t('myTasks.filters.upcoming'), count: tasks.filter(t => t.status !== 'done').length, color: 'bg-orange-100 dark:bg-orange-900/20' },
    { id: 'in_progress', label: t('myTasks.filters.inProgress'), count: stats.inProgress, color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'completed', label: t('myTasks.filters.completed'), count: tasks.filter(t => t.status === 'done').length, color: 'bg-green-100 dark:bg-green-900/20' }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <div>
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t('myTasks.title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                {t('myTasks.subtitle', { name: currentUser.name })}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base self-start sm:self-auto"
            >
              <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('tasks.createTask')}</span>
              <span className="sm:hidden">{t('common.new')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className=" p-2.5 sm:p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('myTasks.stats.todayTasks')}
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.todayCount}
                </p>
              </div>
              <Calendar className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-blue-400 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className=" p-2.5 sm:p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('myTasks.stats.overdue')}
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-red-600">
                  {stats.overdueCount}
                </p>
              </div>
              <AlertCircle className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-red-400 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className=" p-2.5 sm:p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('myTasks.stats.inProgress')}
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-orange-600">
                  {stats.inProgress}
                </p>
              </div>
              <Clock className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-orange-400 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className=" p-2.5 sm:p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('myTasks.stats.completedWeek')}
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-green-600">
                  {stats.completedWeek}
                </p>
              </div>
              <CheckCircle className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-green-400 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className=" p-2.5 sm:p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-gray-700 col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('myTasks.stats.hoursWeek')}
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-purple-600">
                  {stats.hoursWeek}h
                </p>
              </div>
              <BarChart3 className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-purple-400 flex-shrink-0 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters - Mobile optimized grid that converts to scrollable on very small screens */}
      <div className="px-3 sm:px-6 py-2 sm:py-3">
        {/* Grid on larger mobiles, scroll on very small screens */}
        <div className="grid grid-cols-3 xs:grid-cols-3 sm:flex sm:gap-2 gap-2 sm:overflow-x-auto sm:pb-2 sm:no-scrollbar">
          {quickFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : `${filter.color} text-gray-700 dark:text-gray-300 hover:shadow-md`
              }`}
            >
              <span className="text-[11px] sm:text-xs truncate">{filter.label}</span>
              <span className={`mt-1 sm:mt-0 sm:ml-2 px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full ${
                activeFilter === filter.id
                  ? 'bg-white bg-opacity-25 text-black'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Task List - Full width on mobile with better spacing */}
      <div className="px-3 sm:px-6 pb-4 sm:pb-6 overflow-x-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <ListTodo className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('tasks.noTasks')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('tasks.noTasksDescription')}
            </p>
          </div>
        ) : (
          <TaskListView
            tasks={filteredTasks}
            groupBy={groupBy}
            onTaskSelect={handleTaskSelect}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => {
            setShowCreateModal(false);
            setCreateTaskDefaultStatus('todo');
          }}
          onSave={handleTaskCreate}
          defaultStatus={createTaskDefaultStatus}
        />
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          availableTasks={tasks}
          projectMembers={[currentUser]} // In MyTasks, the user is typically the only member
        />
      )}
    </div>
  );
};

export default MyTasks;
