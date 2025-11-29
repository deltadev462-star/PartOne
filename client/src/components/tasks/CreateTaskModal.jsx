import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Flag,
  FolderOpen,
  Target,
  Tag,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../configs/api';

const CreateTaskModal = ({ onClose, onSave, defaultStatus = 'todo', cachedProjects = [], cachedUsers = [] }) => {
  const { t } = useTranslation();
  const { workspaceId } = useParams();
  const selectedWorkspace = useSelector((state) => state.workspace.selectedWorkspace);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const { getToken } = useAuth();
  
  // Check if we have duplicate task data
  const duplicateData = window.duplicateTaskData;
  
  const [formData, setFormData] = useState({
    title: duplicateData?.title || '',
    description: duplicateData?.description || '',
    status: defaultStatus,
    priority: duplicateData?.priority || 'medium',
    assignee: duplicateData?.assignee || null,
    project: duplicateData?.project || null,
    sprint: duplicateData?.sprint || '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    estimatedHours: duplicateData?.estimatedHours || '',
    tags: duplicateData?.tags || []
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  
  // Use cached data if available, otherwise fetch
  const [projects, setProjects] = useState(cachedProjects);
  const [users, setUsers] = useState(cachedUsers);
  const [sprints, setSprints] = useState(['Sprint 1', 'Sprint 2', 'Sprint 3', 'Backlog']); // Could be dynamic
  const [loading, setLoading] = useState(false);

  // Only fetch if no cached data is provided
  useEffect(() => {
    // Use cached data if available
    if (cachedProjects.length > 0 || cachedUsers.length > 0) {
      return;
    }
    
    // Only fetch if we don't have any data at all
    if (projects.length === 0 && users.length === 0) {
      let mounted = true;
      
      const fetchData = async () => {
        try {
          setLoading(true);
          
          const token = await getToken();
          if (!token) {
            console.error('No authentication token available');
            if (mounted) setLoading(false);
            return;
          }
          
          const headers = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          
          // Get workspace ID
          const currentWorkspaceId = workspaceId || selectedWorkspace?.id;
          
          if (!currentWorkspaceId) {
            // For MyTasks page, get all workspaces
            const workspacesResponse = await api.get('/api/workspaces', headers);
            const userWorkspaces = workspacesResponse.data.workspaces || [];
            
            if (userWorkspaces.length > 0) {
              const allProjects = [];
              const allUsers = new Map();
              
              for (const workspace of userWorkspaces) {
                const projectsResponse = await api.get(
                  `/api/workspaces/${workspace.id}/projects`,
                  headers
                );
                const projects = (projectsResponse.data.projects || []).map(p => ({
                  ...p,
                  workspaceName: workspace.name
                }));
                allProjects.push(...projects);
                
                if (workspace.members) {
                  workspace.members.forEach(member => {
                    if (member.user) {
                      allUsers.set(member.user.id, {
                        id: member.user.id,
                        name: member.user.name,
                        email: member.user.email,
                        avatar: member.user.image
                      });
                    }
                  });
                }
              }
              
              if (mounted) {
                setProjects(allProjects);
                setUsers(Array.from(allUsers.values()));
              }
            }
          } else {
            // Fetch for specific workspace
            const projectsResponse = await api.get(
              `/api/workspaces/${currentWorkspaceId}/projects`,
              headers
            );
            
            const membersResponse = await api.get(
              `/api/workspaces/${currentWorkspaceId}`,
              headers
            );
            
            const workspace = membersResponse.data.workspace || membersResponse.data;
            if (mounted) {
              setProjects(projectsResponse.data.projects || []);
              
              if (workspace?.members) {
                const mappedUsers = workspace.members.map(member => ({
                  id: member.user?.id || member.userId,
                  name: member.user?.name || member.name || 'Unknown',
                  email: member.user?.email || member.email || '',
                  avatar: member.user?.image || member.image || ''
                }));
                setUsers(mappedUsers);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };
      
      fetchData();
      
      return () => {
        mounted = false;
      };
    }
  }, []); // Run only once on mount
  
  // Clean up duplicate data when component unmounts
  useEffect(() => {
    return () => {
      if (window.duplicateTaskData) {
        delete window.duplicateTaskData;
      }
    };
  }, []);

  // Set default assignee to current user
  useEffect(() => {
    if (currentUser.id && users.length > 0 && !formData.assignee) {
      const currentUserData = users.find(u => u.id === currentUser.id);
      if (currentUserData) {
        setFormData(prev => ({ ...prev, assignee: currentUserData }));
      }
    }
  }, [users, currentUser.id]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('validation.required');
    }
    
    if (!formData.project) {
      newErrors.project = t('validation.required');
    }
    
    if (!formData.assignee) {
      newErrors.assignee = t('validation.required');
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = t('validation.required');
    } else if (formData.startDate && formData.dueDate < formData.startDate) {
      newErrors.dueDate = t('validation.dueDateBeforeStartDate');
    }
    
    if (formData.estimatedHours && isNaN(formData.estimatedHours)) {
      newErrors.estimatedHours = t('validation.mustBeNumber');
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSave(formData);
  };

  // Listen for custom event from TaskBoardView
  useEffect(() => {
    const handleOpenCreateTask = (event) => {
      if (event.detail?.status) {
        setFormData(prev => ({ ...prev, status: event.detail.status }));
      }
    };

    window.addEventListener('openCreateTaskModal', handleOpenCreateTask);
    return () => {
      window.removeEventListener('openCreateTaskModal', handleOpenCreateTask);
    };
  }, []);

  return (
    <div className="fixed inset-0  backdrop-blur-2xl bg-opacity-50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-[#101010] rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6  ">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('tasks.createNewTask')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4 sm:space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('tasks.fields.title')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg   text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('tasks.placeholders.title')}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('tasks.fields.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg   text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder={t('tasks.placeholders.description')}
              />
            </div>

            {/* Responsive grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FolderOpen className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.project')} *
                </label>
                <select
                  value={formData.project?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    handleInputChange('project', project || null);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.project ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                >
                  <option value="">{loading ? t('common.loading') : t('tasks.selectProject')}</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.assignee')} *
                </label>
                <select
                  value={formData.assignee?.id || ''}
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    handleInputChange('assignee', user || null);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.assignee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                >
                  <option value="">{loading ? t('common.loading') : t('tasks.unassigned')}</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.id === currentUser.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
                {errors.assignee && (
                  <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Flag className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.priority')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="critical">{t('tasks.priority.critical')}</option>
                  <option value="high">{t('tasks.priority.high')}</option>
                  <option value="medium">{t('tasks.priority.medium')}</option>
                  <option value="low">{t('tasks.priority.low')}</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tasks.fields.status')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">{t('tasks.status.todo')}</option>
                  <option value="in_progress">{t('tasks.status.inProgress')}</option>
                  <option value="review">{t('tasks.status.review')}</option>
                  <option value="done">{t('tasks.status.completed')}</option>
                </select>
              </div>

              {/* Sprint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.sprint')}
                </label>
                <select
                  value={formData.sprint}
                  onChange={(e) => handleInputChange('sprint', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#101010] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('tasks.selectSprint')}</option>
                  {sprints.map(sprint => (
                    <option key={sprint} value={sprint}>
                      {sprint}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.estimatedHours')}
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg   text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estimatedHours ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('tasks.placeholders.estimatedHours')}
                  min="0"
                />
                {errors.estimatedHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.startDate')}
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg   text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('tasks.fields.dueDate')} *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg   text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                {t('tasks.fields.tags')}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg   text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder={t('tasks.placeholders.addTag')}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm sm:text-base whitespace-nowrap"
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Sticky on mobile */}
        <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 ">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;