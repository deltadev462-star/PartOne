import ExcelJS from 'exceljs';
import { parse } from 'csv-parse';
import prisma from '../configs/prisma.js';

 // Parse Excel file for projects
export const parseExcelProjects = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Fallback to first worksheet if 'Projects' not found
  const worksheet = workbook.getWorksheet('Projects') || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file. Expected a sheet named "Projects" or the first sheet.');
  }

  // Defensive header detection (avoid importing Requirements template into Projects)
  const headerRow = worksheet.getRow(1);
  const h1 = String(headerRow.getCell(1).value ?? '').trim();
  const h2 = String(headerRow.getCell(2).value ?? '').trim();
  // If looks like the new Requirements schema, instruct user to import via Requirements module
  if (h1.toUpperCase() === 'SN' && h2.toLowerCase().includes('main module')) {
    throw new Error(
      'Detected Requirements import template (SN/Main Module/Level/Item...). Please import this file from the Requirements module, not Projects.'
    );
  }

  const projects = [];

  // Start from row 2 (skip headers)
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    // Skip empty lines
    const name = row.getCell(2).value;
    const description = row.getCell(3).value;
    if (!name && !description) continue;

    const project = {
      name: name,
      description: description,
      status: row.getCell(4).value || 'ACTIVE',
      priority: row.getCell(5).value || 'MEDIUM',
      progress: parseInt(row.getCell(6).value) || 0,
      start_date: row.getCell(7).value,
      end_date: row.getCell(8).value
    };

    projects.push(project);
  }

  return projects;
};

 // Parse Excel file for requirements (supports both formats)
export const parseExcelRequirements = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Fallback: try 'Requirements', then 'Standard Format', then first sheet
  const worksheet =
    workbook.getWorksheet('Requirements') ||
    workbook.getWorksheet('Standard Format') ||
    workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('No worksheet found in Excel file. Expected a sheet named "Requirements" or a first sheet.');
  }

  const requirements = [];

  // Defensive header detection
  const headerRow = worksheet.getRow(1);
  const h1 = String(headerRow.getCell(1).value ?? '').trim();
  const h2 = String(headerRow.getCell(2).value ?? '').trim();

  const isHierarchicalFormat =
    h1.toUpperCase() === 'SN' &&
    h2.toLowerCase().includes('main module');

  if (isHierarchicalFormat) {
    // Hierarchical format parsing
    const levelRequirements = new Map();

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const sn = String(row.getCell(1).value ?? '').trim();
      if (!sn) continue;

      const mainModule = String(row.getCell(2).value ?? '').trim();
      const level = parseInt(String(row.getCell(3).value ?? '0').trim()) || 0;
      const item = String(row.getCell(4).value ?? '').trim();
      const description = String(row.getCell(5).value ?? '').trim();
      const estimateRaw = row.getCell(6).value;
      const estimatedHours = estimateRaw != null && estimateRaw !== '' ? parseInt(String(estimateRaw)) : null;
      const dependencies = String(row.getCell(7).value ?? '').trim();
      const statusRaw = String(row.getCell(8).value ?? '').trim();
      const comments = String(row.getCell(9).value ?? '').trim();

      const mappedStatus = mapToRequirementStatus(statusRaw);

      const requirement = {
        sn,
        title: item,
        description: description + (comments ? `\n\nComments: ${comments}` : ''),
        type: 'FUNCTIONAL',
        status: mappedStatus,
        priority: 'MEDIUM',
        epic: mainModule,
        estimatedEffort: estimatedHours,
        tags: dependencies ? [`Dependencies: ${dependencies}`] : [],
        acceptanceCriteria: [],
        level,
        tempParentLevel: level > 0 ? level - 1 : null
      };

      requirements.push(requirement);

      if (!levelRequirements.has(level)) levelRequirements.set(level, []);
      levelRequirements.get(level).push(requirement);
    }

    // Parent-child linking based on levels and module grouping
    for (const req of requirements) {
      if (req.tempParentLevel != null && levelRequirements.has(req.tempParentLevel)) {
        const potentialParents = levelRequirements.get(req.tempParentLevel);
        const parent = potentialParents
          .filter(p => p.epic === req.epic && requirements.indexOf(p) < requirements.indexOf(req))
          .pop();

        if (parent) req.parentSN = parent.sn;
      }
      delete req.level;
      delete req.tempParentLevel;
    }
  } else {
    // Standard flat format
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const title = row.getCell(2).value;
      const description = row.getCell(3).value;
      if (!title && !description) continue;

      const acceptanceCriteriaStr = row.getCell(11).value;
      const tagsStr = row.getCell(12).value;

      const requirement = {
        title: row.getCell(2).value,
        description: row.getCell(3).value,
        type: row.getCell(4).value || 'FUNCTIONAL',
        status: row.getCell(5).value || 'DRAFT',
        priority: row.getCell(6).value || 'MEDIUM',
        source: row.getCell(8).value,
        estimatedEffort: row.getCell(9).value ? parseInt(row.getCell(9).value) : null,
        acceptanceCriteria: acceptanceCriteriaStr
          ? String(acceptanceCriteriaStr).split(';').map(s => s.trim()).filter(Boolean)
          : [],
        tags: tagsStr
          ? String(tagsStr).split(',').map(s => s.trim()).filter(Boolean)
          : []
      };

      requirements.push(requirement);
    }
  }

  return requirements;
};

// Helper function to map various status strings to valid RequirementStatus
const mapToRequirementStatus = (status) => {
  const statusMap = {
    'DRAFT': 'DRAFT',
    'REVIEW': 'REVIEW',
    'IN REVIEW': 'REVIEW',
    'APPROVED': 'APPROVED',
    'IMPLEMENTED': 'IMPLEMENTED',
    'VERIFIED': 'VERIFIED',
    'CLOSED': 'CLOSED',
    'DONE': 'CLOSED',
    'COMPLETE': 'CLOSED',
    'COMPLETED': 'CLOSED',
    'IN PROGRESS': 'REVIEW',
    'PENDING': 'DRAFT',
    'NOT STARTED': 'DRAFT'
  };
  
  const normalizedStatus = status?.toString().toUpperCase() || 'DRAFT';
  return statusMap[normalizedStatus] || 'DRAFT';
};

// Validate project data before import
export const validateProjectData = (projects) => {
  const errors = [];
  const validStatuses = ['ACTIVE', 'PLANNING', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  projects.forEach((project, index) => {
    const rowNum = index + 2; // Account for header row
    
    if (!project.name || project.name.trim() === '') {
      errors.push(`Row ${rowNum}: Project name is required`);
    }
    
    if (project.status && !validStatuses.includes(project.status)) {
      errors.push(`Row ${rowNum}: Invalid status '${project.status}'. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    if (project.priority && !validPriorities.includes(project.priority)) {
      errors.push(`Row ${rowNum}: Invalid priority '${project.priority}'. Must be one of: ${validPriorities.join(', ')}`);
    }
    
    if (project.progress !== undefined && (project.progress < 0 || project.progress > 100)) {
      errors.push(`Row ${rowNum}: Progress must be between 0 and 100`);
    }
    
    if (project.start_date && project.end_date) {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.end_date);
      if (startDate > endDate) {
        errors.push(`Row ${rowNum}: Start date cannot be after end date`);
      }
    }
  });
  
  return errors;
};

// Validate requirement data before import
export const validateRequirementData = (requirements) => {
  const errors = [];
  const validTypes = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL'];
  const validStatuses = ['DRAFT', 'REVIEW', 'APPROVED', 'IMPLEMENTED', 'VERIFIED', 'CLOSED'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  requirements.forEach((req, index) => {
    const rowNum = index + 2; // Account for header row
    
    if (!req.title || req.title.trim() === '') {
      errors.push(`Row ${rowNum}: Requirement title is required`);
    }
    
    if (req.type && !validTypes.includes(req.type)) {
      errors.push(`Row ${rowNum}: Invalid type '${req.type}'. Must be one of: ${validTypes.join(', ')}`);
    }
    
    if (req.status && !validStatuses.includes(req.status)) {
      errors.push(`Row ${rowNum}: Invalid status '${req.status}'. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    if (req.priority && !validPriorities.includes(req.priority)) {
      errors.push(`Row ${rowNum}: Invalid priority '${req.priority}'. Must be one of: ${validPriorities.join(', ')}`);
    }
    
    if (req.estimatedEffort !== null && req.estimatedEffort < 0) {
      errors.push(`Row ${rowNum}: Estimated effort must be a positive number`);
    }
  });
  
  return errors;
};

// Import projects to database
export const importProjectsToDatabase = async (projects, workspaceId, userId) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const projectData of projects) {
    try {
      // Find or create team lead (using the current user as default)
      const teamLead = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!teamLead) {
        results.failed++;
        results.errors.push(`Failed to import '${projectData.name}': Team lead not found`);
        continue;
      }
      
      // Create project
      const project = await prisma.project.create({
        data: {
          workspaceId,
          name: projectData.name,
          description: projectData.description,
          status: projectData.status || 'ACTIVE',
          priority: projectData.priority || 'MEDIUM',
          progress: projectData.progress || 0,
          team_lead: teamLead.id,
          start_date: projectData.start_date ? new Date(projectData.start_date) : null,
          end_date: projectData.end_date ? new Date(projectData.end_date) : null
        }
      });
      
      // Add the team lead as a project member
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: teamLead.id
        }
      });
      
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to import '${projectData.name}': ${error.message}`);
    }
  }
  
  return results;
};

// Import requirements to database
export const importRequirementsToDatabase = async (requirements, projectId, userId) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // Get the project to validate it exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Map to store created requirements by SN for parent-child relationships
  const createdRequirements = new Map();
  
  // First pass: Create all requirements without parent relationships
  for (const reqData of requirements) {
    try {
      // Generate requirement ID
      const count = await prisma.requirement.count({
        where: { projectId }
      });
      const requirementId = `REQ-${String(count + results.success + 1).padStart(3, '0')}`;
      
      // Create requirement
      const requirement = await prisma.requirement.create({
        data: {
          projectId,
          requirementId,
          title: reqData.title,
          description: reqData.description,
          acceptanceCriteria: reqData.acceptanceCriteria || [],
          source: reqData.source,
          type: reqData.type || 'FUNCTIONAL',
          priority: reqData.priority || 'MEDIUM',
          status: reqData.status || 'DRAFT',
          ownerId: userId,
          estimatedEffort: reqData.estimatedEffort,
          epic: reqData.epic,
          tags: reqData.tags || [],
          history: {
            create: {
              userId,
              action: 'CREATED',
              version: 1,
              changes: {
                imported: true,
                importDate: new Date().toISOString()
              }
            }
          }
        }
      });
      
      // Store created requirement for parent-child linking
      if (reqData.sn) {
        createdRequirements.set(reqData.sn, requirement);
      }
      
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to import '${reqData.title}': ${error.message}`);
    }
  }
  
  // Second pass: Update parent relationships
  for (const reqData of requirements) {
    if (reqData.parentSN && reqData.sn) {
      try {
        const childReq = createdRequirements.get(reqData.sn);
        const parentReq = createdRequirements.get(reqData.parentSN);
        
        if (childReq && parentReq) {
          await prisma.requirement.update({
            where: { id: childReq.id },
            data: { parentId: parentReq.id }
          });
        }
      } catch (error) {
        results.errors.push(`Failed to link parent-child relationship for '${reqData.title}': ${error.message}`);
      }
    }
  }
  
  return results;
};

// Create Excel template for projects
export const createProjectTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Projects');
  
  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 30 },
    { header: 'Name*', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Progress', key: 'progress', width: 10 },
    { header: 'Start Date', key: 'start_date', width: 15 },
    { header: 'End Date', key: 'end_date', width: 15 }
  ];
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
  
  // Add validation instructions row
  worksheet.addRow({
    id: 'Auto-generated (leave empty)',
    name: 'Required field',
    description: 'Optional',
    status: 'ACTIVE/PLANNING/COMPLETED/ON_HOLD/CANCELLED',
    priority: 'LOW/MEDIUM/HIGH/CRITICAL',
    progress: '0-100',
    start_date: 'MM/DD/YYYY',
    end_date: 'MM/DD/YYYY'
  });
  
  // Style instruction row
  worksheet.getRow(2).font = { italic: true, color: { argb: 'FF808080' } };
  
  // Add example row
  worksheet.addRow({
    id: '',
    name: 'Sample Project',
    description: 'This is a sample project description',
    status: 'ACTIVE',
    priority: 'HIGH',
    progress: 25,
    start_date: '01/01/2024',
    end_date: '12/31/2024'
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// Create Excel template for requirements
export const createRequirementTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  
  // Create hierarchical format sheet
  const hierarchicalSheet = workbook.addWorksheet('Requirements');
  
  // Add headers for hierarchical format
  hierarchicalSheet.columns = [
    { header: 'SN', key: 'sn', width: 10 },
    { header: 'Main Module', key: 'mainModule', width: 25 },
    { header: 'Level', key: 'level', width: 10 },
    { header: 'Item', key: 'item', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Estimate (Hours)', key: 'estimateHours', width: 15 },
    { header: 'Dependencies', key: 'dependencies', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Comments', key: 'comments', width: 40 }
  ];
  
  // Style header row
  hierarchicalSheet.getRow(1).font = { bold: true };
  hierarchicalSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  hierarchicalSheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
  
  // Add example rows for hierarchical format
  hierarchicalSheet.addRow({
    sn: '1',
    mainModule: 'User Management',
    level: '0',
    item: 'User Management Module',
    description: 'Complete user management system',
    estimateHours: '120',
    dependencies: '',
    status: 'DRAFT',
    comments: 'Core functionality'
  });
  
  hierarchicalSheet.addRow({
    sn: '1.1',
    mainModule: 'User Management',
    level: '1',
    item: 'User Registration',
    description: 'Allow users to create new accounts',
    estimateHours: '24',
    dependencies: '',
    status: 'DRAFT',
    comments: 'Include email verification'
  });
  
  hierarchicalSheet.addRow({
    sn: '1.1.1',
    mainModule: 'User Management',
    level: '2',
    item: 'Email Validation',
    description: 'Validate email format and uniqueness',
    estimateHours: '8',
    dependencies: '1.1',
    status: 'DRAFT',
    comments: ''
  });
  
  hierarchicalSheet.addRow({
    sn: '1.2',
    mainModule: 'User Management',
    level: '1',
    item: 'User Login',
    description: 'Secure authentication system',
    estimateHours: '16',
    dependencies: '',
    status: 'DRAFT',
    comments: 'Support OAuth providers'
  });
  
  hierarchicalSheet.addRow({
    sn: '2',
    mainModule: 'Dashboard',
    level: '0',
    item: 'Analytics Dashboard',
    description: 'Real-time analytics and reporting',
    estimateHours: '80',
    dependencies: '1',
    status: 'DRAFT',
    comments: 'Requires user authentication'
  });
  
  // Add instructions row with formatting
  const instructionRow = hierarchicalSheet.insertRow(2, [
    'Unique ID',
    'Module name',
    '0,1,2... (hierarchy)',
    'Requirement name',
    'Detailed description',
    'Hours (number)',
    'Comma separated SNs',
    'DRAFT/REVIEW/APPROVED/etc',
    'Additional notes'
  ]);
  instructionRow.font = { italic: true, color: { argb: 'FF808080' } };
  
  // Create standard format sheet for reference
  const standardSheet = workbook.addWorksheet('Standard Format');
  
  // Add headers for standard format
  standardSheet.columns = [
    { header: 'Requirement ID', key: 'requirementId', width: 20 },
    { header: 'Title*', key: 'title', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Owner', key: 'owner', width: 25 },
    { header: 'Source', key: 'source', width: 20 },
    { header: 'Estimated Effort', key: 'estimatedEffort', width: 15 },
    { header: 'Actual Effort', key: 'actualEffort', width: 15 },
    { header: 'Acceptance Criteria', key: 'acceptanceCriteria', width: 50 },
    { header: 'Tags', key: 'tags', width: 30 }
  ];
  
  // Style header row
  standardSheet.getRow(1).font = { bold: true };
  standardSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  standardSheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
  
  // Add validation instructions row
  standardSheet.addRow({
    requirementId: 'Auto-generated',
    title: 'Required field',
    description: 'Optional',
    type: 'FUNCTIONAL/NON_FUNCTIONAL/BUSINESS/TECHNICAL',
    status: 'DRAFT/REVIEW/APPROVED/IMPLEMENTED/VERIFIED/CLOSED',
    priority: 'LOW/MEDIUM/HIGH/CRITICAL',
    owner: 'Auto-assigned',
    source: 'Optional',
    estimatedEffort: 'Number (hours)',
    actualEffort: 'Number (hours)',
    acceptanceCriteria: 'Semicolon separated list',
    tags: 'Comma separated list'
  });
  
  // Style instruction row
  standardSheet.getRow(2).font = { italic: true, color: { argb: 'FF808080' } };
  
  // Add example row
  standardSheet.addRow({
    requirementId: '',
    title: 'User authentication system',
    description: 'System shall provide secure user authentication',
    type: 'FUNCTIONAL',
    status: 'DRAFT',
    priority: 'HIGH',
    owner: '',
    source: 'Security requirements',
    estimatedEffort: 40,
    actualEffort: '',
    acceptanceCriteria: 'User can login with email and password; Password is encrypted; Session timeout after 30 minutes',
    tags: 'security, authentication, login'
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};