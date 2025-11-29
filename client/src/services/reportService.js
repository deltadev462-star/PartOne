import axios from 'axios';
import { API_BASE_URL } from '../configs/api.js';

const API_URL = `${API_BASE_URL}/reports`;

// Get all saved reports
export const getSavedReports = async (projectId, category, token) => {
    try {
        const response = await axios.get(`${API_URL}/saved`, {
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
        const response = await axios.get(`${API_URL}/${projectId}/${reportType}`, {
            params: { filters: JSON.stringify(filters) },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
};

// Save a custom report
export const saveReport = async (reportData, token) => {
    try {
        const response = await axios.post(`${API_URL}/save`, reportData, {
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
        const response = await axios.post(`${API_URL}/run/${reportId}`, {}, {
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
        const response = await axios.delete(`${API_URL}/${reportId}`, {
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
        const response = await axios.patch(`${API_URL}/favorite/${reportId}`, {}, {
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
        const response = await axios.get(`${API_URL}/export/${projectId}/${reportType}`, {
            params: { 
                format,
                filters: JSON.stringify(filters)
            },
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
        
        // Determine file extension based on format
        let extension = format;
        if (format === 'excel') extension = 'xlsx';
        
        a.download = `report-${reportType}-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return { success: true };
    } catch (error) {
        console.error('Error exporting report:', error);
        throw error;
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
        const response = await axios.post(`${API_URL}/duplicate/${reportId}`, {}, {
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
        const response = await axios.post(`${API_URL}/share/${reportId}`, {
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
        const response = await axios.post(`${API_URL}/schedule/${reportId}`, {
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
        const response = await axios.get(`${API_URL}/template`, {
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