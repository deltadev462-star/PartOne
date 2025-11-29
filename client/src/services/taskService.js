import api from '../configs/api';
import { useAuth } from '@clerk/clerk-react';

// Create a function to get headers with Clerk token
export const getAuthHeaders = async () => {
  // This will need to be handled differently since we can't use hooks here
  // We'll need to pass the token from components
  return {};
};

// Updated service functions to accept token
// Task CRUD operations
export const createTask = async (taskData, token) => {
  const response = await api.post('/api/tasks', taskData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateTask = async (taskId, taskData, token) => {
  const response = await api.put(`/api/tasks/${taskId}`, taskData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateTaskStatus = async (taskId, status, position, token) => {
  const response = await api.patch(
    `/api/tasks/${taskId}/status`,
    { status, position },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const deleteTasks = async (taskIds, token) => {
  const response = await api.post(
    '/api/tasks/delete',
    { tasksIds: taskIds },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get tasks
export const getProjectTasks = async (projectId, token) => {
  const response = await api.get(`/api/tasks/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getUserTasks = async (token) => {
  const response = await api.get('/api/tasks/my-tasks', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getWorkspaceTasks = async (workspaceId, token) => {
  const response = await api.get(`/api/tasks/workspace/${workspaceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Subtask operations
export const addSubtask = async (taskId, title, token) => {
  const response = await api.post(
    `/api/tasks/${taskId}/subtasks`,
    { title },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateSubtask = async (subtaskId, data, token) => {
  const response = await api.put(
    `/api/tasks/subtasks/${subtaskId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const deleteSubtask = async (subtaskId, token) => {
  const response = await api.delete(
    `/api/tasks/subtasks/${subtaskId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Comment operations
export const addComment = async (taskId, content, token) => {
  const response = await api.post(
    '/api/comments',
    { taskId, content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getTaskComments = async (taskId, token) => {
  const response = await api.get(`/api/comments/${taskId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Task Dependencies operations
export const addTaskDependency = async (taskId, dependsOnTaskId, token) => {
  const response = await api.post(
    `/api/tasks/${taskId}/dependencies`,
    { dependsOnTaskId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const removeTaskDependency = async (taskId, dependencyId, token) => {
  const response = await api.delete(
    `/api/tasks/${taskId}/dependencies/${dependencyId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getTaskDependencies = async (taskId, token) => {
  const response = await api.get(
    `/api/tasks/${taskId}/dependencies`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};