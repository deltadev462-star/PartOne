import api from '../configs/api';

// Risk Management API Service
export const riskService = {
    // Create risk
    createRisk: async (data, token) => {
        const response = await api.post('/api/risks', data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get project risks
    getProjectRisks: async (projectId, filters = {}, token) => {
        try {
            const params = new URLSearchParams(filters).toString();
            
            const response = await api.get(`/api/risks/project/${projectId}?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data || { risks: [] };
        } catch (error) {
            throw error;
        }
    },

    // Get single risk
    getRisk: async (riskId, token) => {
        const response = await api.get(`/api/risks/${riskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update risk
    updateRisk: async (riskId, data, token) => {
        const response = await api.put(`/api/risks/${riskId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Delete risk
    deleteRisk: async (riskId, token) => {
        const response = await api.delete(`/api/risks/${riskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Add comment to risk
    addComment: async (riskId, content, token) => {
        const response = await api.post(`/api/risks/${riskId}/comment`, { content }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update risk status
    updateRiskStatus: async (riskId, status, token) => {
        const response = await api.patch(`/api/risks/${riskId}/status`, { status }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get risk matrix
    getRiskMatrix: async (projectId, token) => {
        const response = await api.get(`/api/risks/project/${projectId}/matrix`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Perform risk assessment
    assessRisk: async (riskId, assessmentData, token) => {
        const response = await api.post(`/api/risks/${riskId}/assess`, assessmentData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Create risk response plan
    createResponsePlan: async (riskId, planData, token) => {
        const response = await api.post(`/api/risks/${riskId}/response-plan`, planData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update risk response plan
    updateResponsePlan: async (riskId, planData, token) => {
        const response = await api.put(`/api/risks/${riskId}/response-plan`, planData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Add risk indicator
    addIndicator: async (riskId, indicatorData, token) => {
        const response = await api.post(`/api/risks/${riskId}/indicators`, indicatorData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update risk indicator
    updateIndicator: async (riskId, indicatorId, data, token) => {
        const response = await api.put(`/api/risks/${riskId}/indicators/${indicatorId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Escalate risk
    escalateRisk: async (riskId, escalationData, token) => {
        const response = await api.post(`/api/risks/${riskId}/escalate`, escalationData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get risk history
    getRiskHistory: async (riskId, token) => {
        const response = await api.get(`/api/risks/${riskId}/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get risk analytics
    getRiskAnalytics: async (projectId, dateRange, token) => {
        const params = new URLSearchParams(dateRange).toString();
        const response = await api.get(`/api/risks/project/${projectId}/analytics?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Export risks
    exportRisks: async (projectId, format, filters = {}, token) => {
        const params = new URLSearchParams({ ...filters, format }).toString();
        const response = await api.get(`/api/risks/project/${projectId}/export?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `risks-${projectId}-${Date.now()}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return response.data;
    },

    // Import risks
    importRisks: async (projectId, file, token) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        
        const response = await api.post(`/api/risks/import`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get risk template
    downloadRiskTemplate: async (token) => {
        const response = await api.get('/api/risks/template', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `risk-template-${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return response.data;
    },

    // Bulk update risks
    bulkUpdateRisks: async (riskIds, updateData, token) => {
        const response = await api.put('/api/risks/bulk-update', {
            riskIds,
            updateData
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Link risk to requirement
    linkToRequirement: async (riskId, requirementId, token) => {
        const response = await api.post(`/api/risks/${riskId}/link-requirement`, { requirementId }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Link risk to task
    linkToTask: async (riskId, taskId, token) => {
        const response = await api.post(`/api/risks/${riskId}/link-task`, { taskId }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get risk dependencies
    getRiskDependencies: async (riskId, token) => {
        const response = await api.get(`/api/risks/${riskId}/dependencies`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
};

// Risk export utilities
export const exportRisksToExcel = async (projectId, filters, token) => {
    return riskService.exportRisks(projectId, 'xlsx', filters, token);
};

export const exportRisksToCSV = async (projectId, filters, token) => {
    return riskService.exportRisks(projectId, 'csv', filters, token);
};

export const exportRisksToPDF = async (projectId, filters, token) => {
    return riskService.exportRisks(projectId, 'pdf', filters, token);
};

export const importRisksFromExcel = async (projectId, file, token) => {
    return riskService.importRisks(projectId, file, token);
};

export const downloadRiskTemplate = async (token) => {
    return riskService.downloadRiskTemplate(token);
};

export default riskService;