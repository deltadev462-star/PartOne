import React, { useState, useEffect } from 'react';
import {
  List,
  Grid3x3,
  Filter,
  Plus,
  Search,
  User,
  Clock,
  AlertCircle,
  ChevronDown,
  SortAsc
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import TaskListView from '../components/tasks/TaskListView';
import TaskBoardView from '../components/tasks/TaskBoardView';
import TaskFilters from '../components/tasks/TaskFilters';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import { getWorkspaceTasks, createTask, updateTask, deleteTasks } from '../services/taskService';
import api from '../configs/api';

const Tasks = () => {
  const { t } = useTranslation();
  const { workspaceId } = useParams();
  const selectedWorkspace = useSelector((state) => state.workspace.selectedWorkspace);
  const workspaces = useSelector((state) => state.workspace.workspaces);
  const { getToken } = useAuth();
  const [activeView, setActiveView] = useState('board');
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState('todo');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    project: 'all',
    sprint: 'all',
    dateRange: null
  });
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [groupBy, setGroupBy] = useState('none');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
  const [modalDataCache, setModalDataCache] = useState({
    projects: [],
    users: [],
    fetched: false
  });

   // Fetch modal data (projects and users) for caching
   const fetchModalData = async () => {
     if (modalDataCache.fetched) return;
     
     try {
       const token = await getToken();
       if (!token) return;

       const workspaceIdToUse = selectedWorkspace?.id || workspaces?.[0]?.id || currentWorkspaceId;
       if (!workspaceIdToUse) return;

       // Fetch projects
       const projectsResponse = await api.get(`/api/workspaces/${workspaceIdToUse}/projects`, {
         headers: { Authorization: `Bearer ${token}` }
       });

       // Fetch workspace members
       const workspaceResponse = await api.get(`/api/workspaces/${workspaceIdToUse}`, {
         headers: { Authorization: `Bearer ${token}` }
       });

       const workspace = workspaceResponse.data.workspace || workspaceResponse.data;
       const mappedUsers = workspace?.members?.map(member => ({
         id: member.user?.id || member.userId,
         name: member.user?.name || member.name || 'Unknown',
         email: member.user?.email || member.email || '',
         avatar: member.user?.image || member.image || ''
       })) || [];

       setModalDataCache({
         projects: projectsResponse.data.projects || [],
         users: mappedUsers,
         fetched: true
       });
     } catch (error) {
       console.error('Error prefetching modal data:', error);
     }
   };

   // Fetch tasks function
    const fetchTasks = async (opts = {}) => {
      const { silent = false } = opts;
      try {
        if (!silent) setLoading(true);
        
        const token = await getToken();
        if (!token) {
          console.error('No authentication token available');
          if (!silent) setLoading(false);
          return;
        }
  
        // For Tasks page, we get the selected workspace from Redux or use first available
        let workspaceIdToUse = selectedWorkspace?.id;
        
        if (!workspaceIdToUse && workspaces && workspaces.length > 0) {
          // Use the first workspace if none is selected
          workspaceIdToUse = workspaces[0].id;
        }
  
        // Fallback to last successful workspace used
        if (!workspaceIdToUse && currentWorkspaceId) {
          workspaceIdToUse = currentWorkspaceId;
        }
        
        if (!workspaceIdToUse) {
          console.error('No workspace available');
          if (!silent) setLoading(false);
          // Keep current tasks/board as-is; skip refresh
          return;
        }
  
        setCurrentWorkspaceId(workspaceIdToUse);
        const response = await getWorkspaceTasks(workspaceIdToUse, token);
        
        // Prefetch modal data after fetching tasks
        fetchModalData();
        
        // Transform task data to match frontend expectations
        const transformedTasks = response.tasks.map(task => ({
          ...task,
          dueDate: task.due_date,
          startDate: task.start_date,
          status: task.status.toLowerCase(), // normalize to board values
          priority: task.priority.toLowerCase(),
          subtasks: task.subtasks || [],
          attachments: task.attachments?.length || 0,
          comments: task.comments?.length || 0,
          // Preserve the full dependency structure with nested task information
          dependencies: task.dependencies || []
        }));
  
        // If this is a silent refresh and backend returns empty list (eventual consistency),
        // keep current board state instead of wiping it out.
        if (silent && Array.isArray(transformedTasks) && transformedTasks.length === 0 && tasks.length > 0) {
          return;
        }
        
        setTasks(transformedTasks);
        setFilteredTasks(transformedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        if (!silent) setLoading(false);
      }
    };

  // Fetch tasks on component mount and when dependencies change
  useEffect(() => {
    // If we already have tasks loaded, do a silent refresh to avoid UI flicker
    const hasTasks = tasks.length > 0 || filteredTasks.length > 0;
    fetchTasks({ silent: hasTasks });
  }, [workspaceId, selectedWorkspace, workspaces]);

  // Listen for custom events from TaskBoardView to open create task modal
  useEffect(() => {
    const handleOpenCreateTask = (event) => {
      if (event.detail?.status) {
        setCreateTaskDefaultStatus(event.detail.status);
      }
      setShowCreateModal(true);
    };

    const handleDuplicateTask = (event) => {
      const taskToDuplicate = event.detail;
      // Open create modal with prefilled data from the task to duplicate
      setCreateTaskDefaultStatus(taskToDuplicate.status);
      setShowCreateModal(true);
      // Store the task data to prefill the form
      window.duplicateTaskData = {
        title: taskToDuplicate.title,
        description: taskToDuplicate.description,
        project: taskToDuplicate.project,
        priority: taskToDuplicate.priority,
        assignee: taskToDuplicate.assignee,
        tags: taskToDuplicate.tags,
        sprint: taskToDuplicate.sprint,
        estimatedHours: taskToDuplicate.estimatedHours
      };
    };

    window.addEventListener('openCreateTaskModal', handleOpenCreateTask);
    window.addEventListener('duplicateTask', handleDuplicateTask);
    return () => {
      window.removeEventListener('openCreateTaskModal', handleOpenCreateTask);
      window.removeEventListener('duplicateTask', handleDuplicateTask);
      delete window.duplicateTaskData;
    };
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...tasks];

    // Apply search
    if (searchTerm) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter(task => task.status === filters.status);
    }
    if (filters.priority !== 'all') {
      result = result.filter(task => task.priority === filters.priority);
    }
    if (filters.assignee !== 'all') {
      result = result.filter(task => task.assignee?.id === filters.assignee);
    }
    if (filters.project !== 'all') {
      result = result.filter(task => task.project?.id === filters.project);
    }
    if (filters.sprint !== 'all') {
      result = result.filter(task => task.sprint === filters.sprint);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTasks(result);
  }, [tasks, searchTerm, filters, sortBy, sortOrder]);

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
        assigneeId: newTask.assignee?.id,
        due_date: newTask.dueDate,
        start_date: newTask.startDate,
        sprint: newTask.sprint,
        tags: newTask.tags,
        estimatedHours: newTask.estimatedHours
      }, token);

      // Optimistically add the created task to the board to avoid full-screen loading flicker
      const created = response.task;
      const transformedTask = {
        ...created,
        dueDate: created.due_date,
        startDate: created.start_date,
        status: created.status.toLowerCase(),
        priority: created.priority.toLowerCase(),
        subtasks: created.subtasks || [],
        attachments: created.attachments?.length || 0,
        comments: created.comments?.length || 0,
        // Preserve the full dependency structure with nested task information
        dependencies: created.dependencies || []
      };
      setTasks(prev => [...prev, transformedTask]);
      // Filters will re-derive filteredTasks via effect

      setShowCreateModal(false);
      
      // Immediate silent background refresh to ensure consistency
      fetchTasks({ silent: true });
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

  const viewOptions = [
    { id: 'board', label: t('tasks.views.board'), icon: Grid3x3 },
    { id: 'list', label: t('tasks.views.list'), icon: List }
  ];

  const sortOptions = [
    { value: 'dueDate', label: t('tasks.sort.dueDate') },
    { value: 'priority', label: t('tasks.sort.priority') },
    { value: 'status', label: t('tasks.sort.status') },
    { value: 'title', label: t('tasks.sort.title') },
    { value: 'progress', label: t('tasks.sort.progress') }
  ];

  const groupOptions = [
    { value: 'none', label: t('tasks.group.none') },
    { value: 'status', label: t('tasks.group.status') },
    { value: 'priority', label: t('tasks.group.priority') },
    { value: 'assignee', label: t('tasks.group.assignee') },
    { value: 'project', label: t('tasks.group.project') },
    { value: 'sprint', label: t('tasks.group.sprint') }
  ];

  // Calculate task statistics
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => {
      if (t.status === 'done') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < new Date();
    }).length,
    completed: tasks.filter(t => t.status === 'done').length
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <div>
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('tasks.title')}
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('tasks.createTask')}</span>
              <span className="sm:hidden">{t('common.new')}</span>
            </button>
          </div>

          {/* Controls Bar - Mobile Optimized */}
          <div className="flex flex-col gap-3">
            {/* First Row - Search and View Controls */}
            <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('tasks.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              {/* View Controls */}
              <div className="flex gap-2 flex-wrap">
                {/* View Selector */}
                <div className="flex rounded-lg p-0.5 sm:p-1 border border-gray-300 dark:border-gray-600">
                  {viewOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setActiveView(option.id)}
                      className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-colors ${
                        activeView === option.id
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={option.label}
                    >
                      <option.icon className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="relative flex-1 sm:flex-initial min-w-[120px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none w-full pl-2 sm:pl-3 pr-8 dark:bg-[#101010] sm:pr-10 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title={t('tasks.sortOrder')}
                >
                  <SortAsc className={`w-4 sm:w-5 h-4 sm:h-5 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} />
                </button>

                {/* Group By */}
                <div className="relative flex-1 sm:flex-initial min-w-[120px]">
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="appearance-none w-full pl-2 sm:pl-3 pr-8 sm:pr-10 dark:bg-[#101010] py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    {groupOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Second Row - Filter Component */}
            <TaskFilters
              filters={filters}
              onFiltersChange={setFilters}
              tasks={tasks}
            />
          </div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('tasks.stats.total')}</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <List className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400" />
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('tasks.stats.inProgress')}</p>
                <p className="text-xl sm:text-2xl font-semibold text-blue-600">
                  {stats.inProgress}
                </p>
              </div>
              <Clock className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400" />
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('tasks.stats.overdue')}</p>
                <p className="text-xl sm:text-2xl font-semibold text-red-600">
                  {stats.overdue}
                </p>
              </div>
              <AlertCircle className="w-6 sm:w-8 h-6 sm:h-8 text-red-400" />
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('tasks.stats.completed')}</p>
                <p className="text-xl sm:text-2xl font-semibold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-full">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 pb-6 overflow-x-hidden">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeView === 'list' && (
              <TaskListView 
                tasks={filteredTasks}
                groupBy={groupBy}
                onTaskSelect={handleTaskSelect}
                onTaskUpdate={handleTaskUpdate}
              />
            )}
            {activeView === 'board' && (
              <TaskBoardView
                tasks={filteredTasks}
                groupBy={groupBy}
                onTaskSelect={handleTaskSelect}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
              />
            )}
          </>
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
          cachedProjects={modalDataCache.projects}
          cachedUsers={modalDataCache.users}
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
          projectMembers={modalDataCache.users}
        />
      )}
    </div>
  );
};

export default Tasks;