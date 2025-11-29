import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify';
import PDFDocument from 'pdfkit';
import prisma from '../configs/prisma.js';

// Excel Export utility
export const exportToExcel = async (data, type) => {
  const workbook = new ExcelJS.Workbook();
  
  if (type === 'projects') {
    const worksheet = workbook.addWorksheet('Projects');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Progress', key: 'progress', width: 10 },
      { header: 'Start Date', key: 'start_date', width: 15 },
      { header: 'End Date', key: 'end_date', width: 15 },
      { header: 'Team Lead', key: 'team_lead', width: 30 },
      { header: 'Members Count', key: 'members_count', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
    
    // Add data
    data.forEach(project => {
      worksheet.addRow({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        start_date: project.start_date ? new Date(project.start_date).toLocaleDateString() : '',
        end_date: project.end_date ? new Date(project.end_date).toLocaleDateString() : '',
        team_lead: project.owner?.email || '',
        members_count: project.members?.length || 0,
        createdAt: new Date(project.createdAt).toLocaleDateString()
      });
    });
    
    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'K1'
    };
    
  } else if (type === 'requirements') {
    const worksheet = workbook.addWorksheet('Requirements');
    
    // Add headers
    worksheet.columns = [
      { header: 'Requirement ID', key: 'requirementId', width: 20 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Owner', key: 'owner', width: 25 },
      { header: 'Source', key: 'source', width: 20 },
      { header: 'Estimated Effort', key: 'estimatedEffort', width: 15 },
      { header: 'Actual Effort', key: 'actualEffort', width: 15 },
      { header: 'Acceptance Criteria', key: 'acceptanceCriteria', width: 50 },
      { header: 'Tags', key: 'tags', width: 30 },
      { header: 'Baseline Version', key: 'baselineVersion', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
    
    // Add data
    data.forEach(req => {
      worksheet.addRow({
        requirementId: req.requirementId,
        title: req.title,
        description: req.description || '',
        type: req.type,
        status: req.status,
        priority: req.priority,
        owner: req.owner?.name || '',
        source: req.source || '',
        estimatedEffort: req.estimatedEffort || '',
        actualEffort: req.actualEffort || '',
        acceptanceCriteria: Array.isArray(req.acceptanceCriteria) 
          ? req.acceptanceCriteria.join('; ') 
          : '',
        tags: Array.isArray(req.tags) ? req.tags.join(', ') : '',
        baselineVersion: req.baselineVersion || '',
        createdAt: new Date(req.createdAt).toLocaleDateString()
      });
    });
    
    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'N1'
    };
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// CSV Export utility
export const exportToCSV = async (data, type) => {
  let csvData;
  
  if (type === 'projects') {
    csvData = data.map(project => ({
      ID: project.id,
      Name: project.name,
      Description: project.description || '',
      Status: project.status,
      Priority: project.priority,
      Progress: project.progress,
      'Start Date': project.start_date ? new Date(project.start_date).toLocaleDateString() : '',
      'End Date': project.end_date ? new Date(project.end_date).toLocaleDateString() : '',
      'Team Lead': project.owner?.email || '',
      'Members Count': project.members?.length || 0,
      'Created At': new Date(project.createdAt).toLocaleDateString()
    }));
  } else if (type === 'requirements') {
    csvData = data.map(req => ({
      'Requirement ID': req.requirementId,
      'Title': req.title,
      'Description': req.description || '',
      'Type': req.type,
      'Status': req.status,
      'Priority': req.priority,
      'Owner': req.owner?.name || '',
      'Source': req.source || '',
      'Estimated Effort': req.estimatedEffort || '',
      'Actual Effort': req.actualEffort || '',
      'Acceptance Criteria': Array.isArray(req.acceptanceCriteria) 
        ? req.acceptanceCriteria.join('; ') 
        : '',
      'Tags': Array.isArray(req.tags) ? req.tags.join(', ') : '',
      'Baseline Version': req.baselineVersion || '',
      'Created At': new Date(req.createdAt).toLocaleDateString()
    }));
  }
  
  return new Promise((resolve, reject) => {
    stringify(csvData, { header: true }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
};

// PDF Export utility
export const exportToPDF = async (data, type) => {
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Title
  doc.fontSize(20).text(type === 'projects' ? 'Projects Report' : 'Requirements Report', {
    align: 'center'
  });
  doc.moveDown();
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
    align: 'center'
  });
  doc.moveDown(2);
  
  if (type === 'projects') {
    data.forEach((project, index) => {
      // Project header
      doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${project.name}`);
      doc.fontSize(10).font('Helvetica');
      
      // Project details
      doc.text(`Status: ${project.status} | Priority: ${project.priority} | Progress: ${project.progress}%`);
      if (project.description) {
        doc.text(`Description: ${project.description}`);
      }
      if (project.start_date) {
        doc.text(`Start Date: ${new Date(project.start_date).toLocaleDateString()}`);
      }
      if (project.end_date) {
        doc.text(`End Date: ${new Date(project.end_date).toLocaleDateString()}`);
      }
      doc.text(`Team Lead: ${project.owner?.email || 'N/A'}`);
      doc.text(`Team Members: ${project.members?.length || 0}`);
      
      doc.moveDown();
      
      // Add page break after every 5 projects
      if ((index + 1) % 5 === 0 && index < data.length - 1) {
        doc.addPage();
      }
    });
  } else if (type === 'requirements') {
    data.forEach((req, index) => {
      // Requirement header
      doc.fontSize(14).font('Helvetica-Bold').text(`${req.requirementId}: ${req.title}`);
      doc.fontSize(10).font('Helvetica');
      
      // Requirement details
      doc.text(`Type: ${req.type} | Status: ${req.status} | Priority: ${req.priority}`);
      if (req.description) {
        doc.text(`Description: ${req.description}`);
      }
      doc.text(`Owner: ${req.owner?.name || 'N/A'}`);
      if (req.source) {
        doc.text(`Source: ${req.source}`);
      }
      if (req.estimatedEffort) {
        doc.text(`Estimated Effort: ${req.estimatedEffort} hours`);
      }
      
      // Acceptance Criteria
      if (req.acceptanceCriteria && req.acceptanceCriteria.length > 0) {
        doc.text('Acceptance Criteria:');
        req.acceptanceCriteria.forEach((criteria, i) => {
          doc.text(`  ${i + 1}. ${criteria}`);
        });
      }
      
      doc.moveDown();
      
      // Add page break after every 3 requirements
      if ((index + 1) % 3 === 0 && index < data.length - 1) {
        doc.addPage();
      }
    });
  }
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => {
      const buffer = Buffer.concat(buffers);
      resolve(buffer);
    });
  });
};

// Get all projects with details for export
export const getProjectsForExport = async (workspaceId, filters = {}) => {
  const whereClause = {
    workspaceId,
    archived: filters.archived || false
  };
  
  if (filters.status) whereClause.status = filters.status;
  if (filters.priority) whereClause.priority = filters.priority;
  
  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      owner: true,
      members: {
        include: {
          user: true
        }
      },
      tasks: true,
      requirements: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return projects;
};

// Get all requirements with details for export
export const getRequirementsForExport = async (projectId, filters = {}) => {
  const whereClause = { projectId };
  
  if (filters.status) whereClause.status = filters.status;
  if (filters.priority) whereClause.priority = filters.priority;
  if (filters.type) whereClause.type = filters.type;
  
  const requirements = await prisma.requirement.findMany({
    where: whereClause,
    include: {
      owner: true,
      stakeholders: {
        include: {
          stakeholder: true
        }
      },
      taskLinks: {
        include: {
          task: true
        }
      },
      testCases: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return requirements;
};