import api from '../configs/api';

// Requirements API
export const requirementService = {
    // Create requirement
    createRequirement: async (data, token) => {
        const response = await api.post('/api/requirements', data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get project requirements
    getProjectRequirements: async (projectId, filters = {}, token) => {
        try {
            const params = new URLSearchParams(filters).toString();
            
            const response = await api.get(`/api/requirements/project/${projectId}?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data || { requirements: [] };
        } catch (error) {
            throw error;
        }
    },

    // Get requirements hierarchy
    getRequirementsHierarchy: async (projectId, token) => {
        try {
            
            const response = await api.get(`/api/requirements/project/${projectId}/hierarchy`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data || { requirements: [] };
        } catch (error) {
            throw error;
        }
    },

    // Get single requirement
    getRequirement: async (requirementId, token) => {
        const response = await api.get(`/api/requirements/${requirementId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update requirement
    updateRequirement: async (requirementId, data, token) => {
        const response = await api.put(`/api/requirements/${requirementId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Delete requirement
    deleteRequirement: async (requirementId, token) => {
        const response = await api.delete(`/api/requirements/${requirementId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Add comment
    addComment: async (requirementId, content, token) => {
        const response = await api.post(`/api/requirements/${requirementId}/comment`, { content }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Link to task
    linkToTask: async (requirementId, taskId, token) => {
        const response = await api.post(`/api/requirements/${requirementId}/link-task`, { taskId }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Link to test case
    linkToTestCase: async (requirementId, testCaseId, testCaseName, token) => {
        const response = await api.post(`/api/requirements/${requirementId}/link-test-case`, {
            testCaseId,
            testCaseName
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update test case status
    updateTestCaseStatus: async (requirementId, testCaseId, status, token) => {
        const response = await api.put(`/api/requirements/${requirementId}/test-case/${testCaseId}`, {
            status
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Baseline requirement
    baselineRequirement: async (requirementId, token) => {
        const response = await api.post(`/api/requirements/${requirementId}/baseline`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get traceability matrix
    getTraceabilityMatrix: async (projectId, token) => {
        const response = await api.get(`/api/requirements/project/${projectId}/traceability-matrix`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
};

// RFC API
export const rfcService = {
    // Create RFC
    createRFC: async (data, token) => {
        const response = await api.post('/api/rfcs', data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get project RFCs
    getProjectRFCs: async (projectId, filters = {}, token) => {
        try {
            const params = new URLSearchParams(filters).toString();
            
            const response = await api.get(`/api/rfcs/project/${projectId}?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data || { rfcs: [] };
        } catch (error) {
            throw error;
        }
    },

    // Get single RFC
    getRFC: async (rfcId, token) => {
        const response = await api.get(`/api/rfcs/${rfcId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update RFC
    updateRFC: async (rfcId, data, token) => {
        const response = await api.put(`/api/rfcs/${rfcId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Update RFC status
    updateRFCStatus: async (rfcId, status, additionalData = {}, token) => {
        const response = await api.patch(`/api/rfcs/${rfcId}/status`, {
            status,
            ...additionalData
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Delete RFC
    deleteRFC: async (rfcId, token) => {
        const response = await api.delete(`/api/rfcs/${rfcId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Add comment
    addComment: async (rfcId, content, token) => {
        const response = await api.post(`/api/rfcs/${rfcId}/comment`, { content }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Get impact analysis
    getImpactAnalysis: async (rfcId, token) => {
        const response = await api.get(`/api/rfcs/${rfcId}/impact-analysis`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
};

export default {
    requirement: requirementService,
    rfc: rfcService
};