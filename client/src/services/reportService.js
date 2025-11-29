import api from '../configs/api.js';

const API_URL = '/api/reports';

// Get report statistics
export const getReportStatistics = async (projectId, token) => {
    try {
        const response = await api.get(`${API_URL}/${projectId}/statistics`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching report statistics:', error);
        throw error;
    }
};

// Get all saved reports
export const getSavedReports = async (projectId, category, token) => {
    try {
        const response = await api.get(`${API_URL}/saved`, {
            params: { projectId, category },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching saved reports:', error);
        throw error;
    }
};

// Get report data for a specific report type
export const getReportData = async (projectId, reportType, filters, token) => {
    try {
        // Validate inputs
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        
        if (!reportType) {
            throw new Error('Report type is required');
        }
        
        if (!token) {
            throw new Error('Authentication is required');
        }
        
        // Convert camelCase report types to kebab-case for API
        const apiReportType = reportType.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        
        console.log('Fetching report data:', {
            projectId,
            reportType: apiReportType,
            filters
        });
        
        const response = await api.get(`${API_URL}/${projectId}/${apiReportType}`, {
            params: { filters: JSON.stringify(filters) },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching report data:', error);
        
        // Enhanced error handling
        if (error.response) {
            if (error.response.status === 400) {
                throw new Error(error.response.data?.details || error.response.data?.error || 'Invalid report type or parameters');
            } else if (error.response.status === 404) {
                throw new Error('Project not found or access denied');
            } else if (error.response.status === 401) {
                throw new Error('Authentication required. Please log in again.');
            } else {
                throw new Error(`Failed to fetch report: ${error.response.data?.error || error.message}`);
            }
        } else {
            throw error;
        }
    }
};

// Save a custom report
export const saveReport = async (reportData, token) => {
    try {
        const response = await api.post(`${API_URL}/save`, reportData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error saving report:', error);
        throw error;
    }
};

// Run a saved report
export const runReport = async (reportId, token) => {
    try {
        const response = await api.post(`${API_URL}/run/${reportId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error running report:', error);
        throw error;
    }
};

// Delete a report
export const deleteReport = async (reportId, token) => {
    try {
        const response = await api.delete(`${API_URL}/${reportId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting report:', error);
        throw error;
    }
};

// Toggle favorite status
export const toggleFavorite = async (reportId, token) => {
    try {
        const response = await api.patch(`${API_URL}/favorite/${reportId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error;
    }
};

// Export report to different formats
export const exportReport = async (projectId, reportType, format, filters, token) => {
    try {
        // Validate inputs
        if (!projectId) {
            throw new Error('Project ID is required for export');
        }
        
        if (!reportType) {
            throw new Error('Report type is required for export');
        }
        
        if (!format) {
            throw new Error('Export format is required');
        }
        
        if (!token) {
            throw new Error('Authentication is required for export');
        }
        
        // Convert camelCase report types to kebab-case for API
        const apiReportType = reportType.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        
        console.log('Exporting report with params:', {
            projectId,
            reportType: apiReportType,
            format,
            filters
        });
        
        const response = await api.get(`${API_URL}/export/${projectId}/${apiReportType}`, {
            params: {
                format,
                filters: JSON.stringify(filters)
            },
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'blob',
            // Add timeout for large reports
            timeout: 30000
        });

        // Check if the response is actually an error (sometimes errors come as blobs)
        if (response.data.type === 'application/json') {
            const text = await response.data.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || 'Export failed');
        }

        // Create a download link
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Determine file extension based on format
        let extension = format.toLowerCase();
        if (extension === 'excel') extension = 'xlsx';
        
        a.download = `report-${apiReportType}-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return { success: true };
    } catch (error) {
        console.error('Error exporting report:', error);
        
        // Enhanced error handling
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            if (error.response.status === 400) {
                throw new Error(error.response.data?.details || error.response.data?.error || 'Invalid request parameters');
            } else if (error.response.status === 404) {
                throw new Error('Project or report type not found');
            } else if (error.response.status === 401) {
                throw new Error('Authentication required. Please log in again.');
            } else if (error.response.status === 500) {
                throw new Error(error.response.data?.details || 'Server error while exporting report');
            } else {
                throw new Error(`Export failed with status ${error.response.status}`);
            }
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error('No response from server. Please check your connection.');
        } else {
            // Something happened in setting up the request that triggered an Error
            throw error;
        }
    }
};

// Get project status report
export const getProjectStatusReport = async (projectId, filters, token) => {
    return getReportData(projectId, 'project-status', filters, token);
};

// Get task progress report
export const getTaskProgressReport = async (projectId, filters, token) => {
    return getReportData(projectId, 'task-progress', filters, token);
};

// Get requirements coverage report
export const getRequirementsCoverageReport = async (projectId, filters, token) => {
    return getReportData(projectId, 'requirements-coverage', filters, token);
};

// Get stakeholder engagement report
export const getStakeholderEngagementReport = async (projectId, filters, token) => {
    return getReportData(projectId, 'stakeholder-engagement', filters, token);
};

// Get dashboard data
export const getDashboardData = async (projectId, token) => {
    return getReportData(projectId, 'dashboard', {}, token);
};

// Duplicate a report
export const duplicateReport = async (reportId, token) => {
    try {
        const response = await api.post(`${API_URL}/duplicate/${reportId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error duplicating report:', error);
        throw error;
    }
};

// Share a report with users
export const shareReport = async (reportId, userEmails, permissions, token) => {
    try {
        const response = await api.post(`${API_URL}/share/${reportId}`, {
            userEmails,
            permissions
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error sharing report:', error);
        throw error;
    }
};

// Schedule a report
export const scheduleReport = async (reportId, schedule, token) => {
    try {
        const response = await api.post(`${API_URL}/schedule/${reportId}`, {
            schedule
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error scheduling report:', error);
        throw error;
    }
};

// Export reports to PDF
export const exportReportsToPDF = async (projectId, filters, token) => {
    return exportReport(projectId, 'all', 'pdf', filters, token);
};

// Export reports to Excel
export const exportReportsToExcel = async (projectId, filters, token) => {
    return exportReport(projectId, 'all', 'excel', filters, token);
};

// Export reports to CSV
export const exportReportsToCSV = async (projectId, filters, token) => {
    return exportReport(projectId, 'all', 'csv', filters, token);
};

// Download report template
export const downloadReportTemplate = async (token) => {
    try {
        const response = await api.get(`${API_URL}/template`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'blob'
        });

        // Create a download link
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `report-template-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return { success: true };
    } catch (error) {
        console.error('Error downloading template:', error);
        throw error;
    }
};

export const reportService = {
    getReportStatistics,
    getSavedReports,
    getReportData,
    saveReport,
    runReport,
    deleteReport,
    toggleFavorite,
    exportReport,
    getProjectStatusReport,
    getTaskProgressReport,
    getRequirementsCoverageReport,
    getStakeholderEngagementReport,
    getDashboardData,
    duplicateReport,
    shareReport,
    scheduleReport,
    exportReportsToPDF,
    exportReportsToExcel,
    exportReportsToCSV,
    downloadReportTemplate
};

export default reportService;