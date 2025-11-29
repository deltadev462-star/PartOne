import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../configs/api';

// Export projects to Excel
export const exportProjectsToExcel = async (workspaceId, filters = {}, token) => {
  try {
    const response = await api.get(`/api/projects/workspace/${workspaceId}/export`, {
      params: {
        format: 'excel',
        ...filters
      },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `projects-${new Date().getTime()}.xlsx`);
  } catch (error) {
    throw error;
  }
};

// Export projects to CSV
export const exportProjectsToCSV = async (workspaceId, filters = {}, token) => {
  try {
    const response = await api.get(`/api/projects/workspace/${workspaceId}/export`, {
      params: {
        format: 'csv',
        ...filters
      },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    saveAs(blob, `projects-${new Date().getTime()}.csv`);
  } catch (error) {
    throw error;
  }
};

// Export projects to PDF
export const exportProjectsToPDF = async (workspaceId, filters = {}, token) => {
  try {
    const response = await api.get(`/api/projects/workspace/${workspaceId}/export`, {
      params: {
        format: 'pdf',
        ...filters
      },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    saveAs(blob, `projects-${new Date().getTime()}.pdf`);
  } catch (error) {
    throw error;
  }
};

// Import projects from Excel
export const importProjectsFromExcel = async (workspaceId, file, token) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/projects/workspace/${workspaceId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Download project template
export const downloadProjectTemplate = async (token) => {
  try {
    const response = await api.get('/api/projects/template/download', {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, 'project-import-template.xlsx');
  } catch (error) {
    throw error;
  }
};

// Export requirements to Excel
export const exportRequirementsToExcel = async (projectId, filters = {}, token) => {
  try {
    const response = await api.get(`/api/requirements/project/${projectId}/export`, {
      params: {
        format: 'excel',
        ...filters
      },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `requirements-${new Date().getTime()}.xlsx`);
  } catch (error) {
    throw error;
  }
};

// Export requirements to CSV
export const exportRequirementsToCSV = async (projectId, filters = {}, token) => {
  try {
    const response = await api.get(`/api/requirements/project/${projectId}/export`, {
      params: {
        format: 'csv',
        ...filters
      },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    saveAs(blob, `requirements-${new Date().getTime()}.csv`);
  } catch (error) {
    throw error;
  }
};

// Export requirements to PDF
export const exportRequirementsToPDF = async (projectId, filters = {}, token) => {
  try {
    const response = await api.get(`/api/requirements/project/${projectId}/export`, {
      params: {
        format: 'pdf',
        ...filters
      },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    saveAs(blob, `requirements-${new Date().getTime()}.pdf`);
  } catch (error) {
    throw error;
  }
};

// Import requirements from Excel
export const importRequirementsFromExcel = async (projectId, file, token) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/requirements/project/${projectId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Download requirement template
export const downloadRequirementTemplate = async (token) => {
  try {
    const response = await api.get('/api/requirements/template/download', {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, 'requirement-import-template.xlsx');
  } catch (error) {
    throw error;
  }
};

// Client-side Excel parsing for preview
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve({
          data: jsonData,
          sheetName: firstSheetName
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Generate PDF from HTML element
export const generatePDFFromElement = async (elementId, filename = 'export.pdf') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error('Element not found');
  }
  
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });
  
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
};