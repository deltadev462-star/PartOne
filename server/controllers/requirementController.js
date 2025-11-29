import prisma from "../configs/prisma.js";
import multer from "multer";
import {
    exportToExcel,
    exportToCSV,
    exportToPDF,
    getRequirementsForExport
} from "../utils/exportUtils.js";
import {
    parseExcelRequirements,
    validateRequirementData,
    importRequirementsToDatabase,
    createRequirementTemplate
} from "../utils/importUtils.js";

// Generate requirement ID - Now includes project identifier for uniqueness with retry mechanism
const generateRequirementId = async (projectId) => {
    // Get the project to use its identifier
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true }
    });
    
    // Use first 8 characters of project ID for uniqueness
    const projectPrefix = project.id.substring(0, 8).toUpperCase();
    
    // Count existing requirements for this project
    const count = await prisma.requirement.count({
        where: { projectId }
    });
    
    let reqId;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Try to generate a unique ID with retry mechanism
    while (attempts < maxAttempts) {
        const counter = count + 1 + attempts;
        reqId = `REQ-${projectPrefix}-${String(counter).padStart(3, '0')}`;
        
        // Check if this ID already exists
        const existing = await prisma.requirement.findUnique({
            where: { requirementId: reqId }
        });
        
        if (!existing) {
            return reqId;
        }
        
        attempts++;
    }
    
    // If all attempts failed, use timestamp for uniqueness
    const timestamp = Date.now().toString(36).toUpperCase();
    return `REQ-${projectPrefix}-${timestamp}`;
};

// Create requirement
export const createRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const {
            projectId,
            title,
            description,
            acceptanceCriteria,
            source,
            type,
            priority,
            status,
            parentId,
            estimatedEffort,
            tags,
            stakeholderIds
        } = req.body;

        // Check if user is project member or admin
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { 
                    include: { 
                        members: true 
                    } 
                },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceAdmin = project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectMember = project.members.some(member => member.userId === userId);
        const isProjectLead = project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectMember && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to create requirements in this project" });
        }

        // Generate requirement ID
        const requirementId = await generateRequirementId(projectId);

        try {
            // Create requirement with initial history entry
            const requirement = await prisma.requirement.create({
            data: {
                projectId,
                requirementId,
                title,
                description,
                acceptanceCriteria: acceptanceCriteria || [],
                source,
                type: type || "FUNCTIONAL",
                priority: priority || "MEDIUM",
                status: status || "DRAFT",
                ownerId: userId,
                parentId,
                estimatedEffort,
                tags: tags || [],
                history: {
                    create: {
                        userId,
                        action: "CREATED",
                        version: 1,
                        changes: {
                            title,
                            description,
                            type: type || "FUNCTIONAL",
                            priority: priority || "MEDIUM",
                            status: status || "DRAFT"
                        }
                    }
                }
            }
            });

        // Add stakeholder relationships if provided
        if (stakeholderIds && stakeholderIds.length > 0) {
            const stakeholderRelations = stakeholderIds.map(stakeholderId => ({
                requirementId: requirement.id,
                stakeholderId,
                role: "REVIEWER"
            }));

            await prisma.stakeholderRequirement.createMany({
                data: stakeholderRelations
            });
        }

        // Fetch the complete requirement with relations
        const completeRequirement = await prisma.requirement.findUnique({
            where: { id: requirement.id },
            include: {
                owner: true,
                parent: true,
                children: true,
                stakeholders: {
                    include: {
                        stakeholder: true
                    }
                },
                history: true
            }
        });

            res.json({ requirement: completeRequirement, message: "Requirement created successfully" });
        } catch (createError) {
            // If we get a unique constraint error, try again with a new ID
            if (createError.code === 'P2002' && createError.meta?.target?.includes('requirementId')) {
                console.log('Requirement ID collision detected, generating new ID...');
                
                // Generate a fallback ID with timestamp
                const timestamp = Date.now().toString(36).toUpperCase();
                const fallbackId = `REQ-${projectId.substring(0, 8).toUpperCase()}-${timestamp}`;
                
                // Retry with the fallback ID
                const requirement = await prisma.requirement.create({
                    data: {
                        projectId,
                        requirementId: fallbackId,
                        title,
                        description,
                        acceptanceCriteria: acceptanceCriteria || [],
                        source,
                        type: type || "FUNCTIONAL",
                        priority: priority || "MEDIUM",
                        status: status || "DRAFT",
                        ownerId: userId,
                        parentId,
                        estimatedEffort,
                        tags: tags || [],
                        history: {
                            create: {
                                userId,
                                action: "CREATED",
                                version: 1,
                                changes: {
                                    title,
                                    description,
                                    type: type || "FUNCTIONAL",
                                    priority: priority || "MEDIUM",
                                    status: status || "DRAFT"
                                }
                            }
                        }
                    }
                });

                // Add stakeholder relationships if provided
                if (stakeholderIds && stakeholderIds.length > 0) {
                    const stakeholderRelations = stakeholderIds.map(stakeholderId => ({
                        requirementId: requirement.id,
                        stakeholderId,
                        role: "REVIEWER"
                    }));

                    await prisma.stakeholderRequirement.createMany({
                        data: stakeholderRelations
                    });
                }

                // Fetch the complete requirement with relations
                const completeRequirement = await prisma.requirement.findUnique({
                    where: { id: requirement.id },
                    include: {
                        owner: true,
                        parent: true,
                        children: true,
                        stakeholders: {
                            include: {
                                stakeholder: true
                            }
                        },
                        history: true
                    }
                });

                res.json({ requirement: completeRequirement, message: "Requirement created successfully" });
            } else {
                throw createError;
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message || "Failed to create requirement" });
    }
};

// Get requirements for a project
export const getProjectRequirements = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { status, priority, type } = req.query;

        // Check project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { include: { members: true } },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        // Build filter conditions
        const filterConditions = { projectId };
        if (status) filterConditions.status = status;
        if (priority) filterConditions.priority = priority;
        if (type) filterConditions.type = type;

        const requirements = await prisma.requirement.findMany({
            where: filterConditions,
            include: {
                owner: true,
                parent: true,
                children: {
                    include: {
                        owner: true,
                        children: true
                    }
                },
                stakeholders: {
                    include: {
                        stakeholder: true,
                        user: true
                    }
                },
                attachments: true,
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3
                },
                taskLinks: {
                    include: {
                        task: true
                    }
                },
                meetingLinks: {
                    include: {
                        meeting: true
                    }
                },
                rfcs: {
                    where: {
                        status: {
                            notIn: ['CANCELLED', 'REJECTED']
                        }
                    },
                    include: {
                        requester: true
                    }
                },
                testCases: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ requirements });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get single requirement
export const getRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;

        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                },
                owner: true,
                parent: true,
                children: {
                    include: {
                        owner: true,
                        children: true
                    }
                },
                stakeholders: {
                    include: {
                        stakeholder: true,
                        user: true
                    }
                },
                attachments: true,
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                history: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                taskLinks: {
                    include: {
                        task: {
                            include: {
                                assignee: true
                            }
                        }
                    }
                },
                meetingLinks: {
                    include: {
                        meeting: {
                            include: {
                                participants: {
                                    include: {
                                        stakeholder: true
                                    }
                                }
                            }
                        }
                    }
                },
                rfcs: {
                    include: {
                        requester: true,
                        reviewer: true,
                        approver: true
                    }
                },
                testCases: true
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check access
        const isWorkspaceMember = requirement.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = requirement.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this requirement" });
        }

        res.json({ requirement });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update requirement
export const updateRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const {
            title,
            description,
            acceptanceCriteria,
            source,
            type,
            priority,
            status,
            parentId,
            estimatedEffort,
            actualEffort,
            tags
        } = req.body;

        // Get current requirement to check permissions and track changes
        const currentRequirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!currentRequirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check permissions
        const isWorkspaceAdmin = currentRequirement.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = currentRequirement.project.team_lead === userId;
        const isOwner = currentRequirement.ownerId === userId;

        if (!isWorkspaceAdmin && !isProjectLead && !isOwner) {
            return res.status(403).json({ message: "You don't have permission to update this requirement" });
        }

        // Track changes for history
        const changes = {};
        if (title !== undefined && title !== currentRequirement.title) changes.title = { old: currentRequirement.title, new: title };
        if (description !== undefined && description !== currentRequirement.description) changes.description = { old: currentRequirement.description, new: description };
        if (type !== undefined && type !== currentRequirement.type) changes.type = { old: currentRequirement.type, new: type };
        if (priority !== undefined && priority !== currentRequirement.priority) changes.priority = { old: currentRequirement.priority, new: priority };
        if (status !== undefined && status !== currentRequirement.status) changes.status = { old: currentRequirement.status, new: status };
        if (acceptanceCriteria !== undefined) changes.acceptanceCriteria = { old: currentRequirement.acceptanceCriteria, new: acceptanceCriteria };
        if (source !== undefined && source !== currentRequirement.source) changes.source = { old: currentRequirement.source, new: source };

        if (Object.keys(changes).length === 0) {
            return res.status(400).json({ message: "No changes detected" });
        }

        // Determine action for history
        let action = "UPDATED";
        if (status !== undefined && status !== currentRequirement.status) {
            action = "STATUS_CHANGED";
        } else if (priority !== undefined && priority !== currentRequirement.priority) {
            action = "PRIORITY_CHANGED";
        }

        // Update requirement with history
        const updatedRequirement = await prisma.requirement.update({
            where: { id: requirementId },
            data: {
                title,
                description,
                acceptanceCriteria,
                source,
                type,
                priority,
                status,
                parentId,
                estimatedEffort,
                actualEffort,
                tags,
                version: currentRequirement.version + 1,
                history: {
                    create: {
                        userId,
                        action,
                        version: currentRequirement.version + 1,
                        changes
                    }
                }
            },
            include: {
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true
                    }
                }
            }
        });

        res.json({ requirement: updatedRequirement, message: "Requirement updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    }
}).single('file');

// Export requirements
export const exportRequirements = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { format = 'excel', status, priority, type } = req.query;

        // Check project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: { include: { members: true } },
                members: true
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        // Get requirements with filters
        const filters = {};
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (type) filters.type = type;

        const requirements = await getRequirementsForExport(projectId, filters);

        let buffer;
        let contentType;
        let fileName;

        switch (format.toLowerCase()) {
            case 'csv':
                buffer = await exportToCSV(requirements, 'requirements');
                contentType = 'text/csv';
                fileName = `requirements-${projectId}-${Date.now()}.csv`;
                break;
            case 'pdf':
                buffer = await exportToPDF(requirements, 'requirements');
                contentType = 'application/pdf';
                fileName = `requirements-${projectId}-${Date.now()}.pdf`;
                break;
            case 'excel':
            default:
                buffer = await exportToExcel(requirements, 'requirements');
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                fileName = `requirements-${projectId}-${Date.now()}.xlsx`;
                break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Import requirements
export const importRequirements = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check if user has permission to add requirements
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: { include: { members: true } },
                members: true
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceAdmin = project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = project.team_lead === userId;
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceAdmin && !isProjectLead && !isProjectMember) {
            return res.status(403).json({ message: "You don't have permission to import requirements" });
        }

        // Handle file upload
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            try {
                // Parse Excel file
                const requirements = await parseExcelRequirements(req.file.buffer);

                // Validate data
                const validationErrors = validateRequirementData(requirements);
                if (validationErrors.length > 0) {
                    return res.status(400).json({
                        message: "Validation errors found",
                        errors: validationErrors
                    });
                }

                // Import requirements
                const results = await importRequirementsToDatabase(requirements, projectId, userId);

                res.json({
                    message: `Import completed. ${results.success} requirements imported successfully, ${results.failed} failed.`,
                    results
                });
            } catch (parseError) {
                console.error('Parse error:', parseError);
                res.status(400).json({ message: "Failed to parse Excel file: " + parseError.message });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Download requirement import template
export const downloadRequirementTemplate = async (req, res) => {
    try {
        const buffer = await createRequirementTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="requirement-import-template.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete requirement
export const deleteRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;

        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check permissions - only workspace admin or project lead can delete
        const isWorkspaceAdmin = requirement.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = requirement.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to delete this requirement" });
        }

        await prisma.requirement.delete({
            where: { id: requirementId }
        });

        res.json({ message: "Requirement deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add comment to requirement
export const addRequirementComment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        // Check if requirement exists and user has access
        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        const isWorkspaceMember = requirement.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = requirement.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to comment on this requirement" });
        }

        const comment = await prisma.requirementComment.create({
            data: {
                requirementId,
                userId,
                content
            },
            include: {
                user: true
            }
        });

        res.json({ comment, message: "Comment added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Link requirement to task
export const linkRequirementToTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const { taskId } = req.body;

        // Verify requirement and task exist in same project
        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId }
        });

        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!requirement || !task) {
            return res.status(404).json({ message: "Requirement or task not found" });
        }

        if (requirement.projectId !== task.projectId) {
            return res.status(400).json({ message: "Requirement and task must be in the same project" });
        }

        // Check if link already exists
        const existingLink = await prisma.requirementTask.findUnique({
            where: {
                requirementId_taskId: {
                    requirementId,
                    taskId
                }
            }
        });

        if (existingLink) {
            return res.status(400).json({ message: "This requirement is already linked to this task" });
        }

        const link = await prisma.requirementTask.create({
            data: {
                requirementId,
                taskId
            },
            include: {
                task: {
                    include: {
                        assignee: true
                    }
                }
            }
        });

        // Add history entry
        await prisma.requirementHistory.create({
            data: {
                requirementId,
                userId,
                action: "TASK_LINKED",
                version: requirement.version,
                changes: { taskId, taskTitle: task.title }
            }
        });

        res.json({ link, message: "Requirement linked to task successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get traceability matrix
export const getTraceabilityMatrix = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { include: { members: true } },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        // Get all requirements with their relationships
        const requirements = await prisma.requirement.findMany({
            where: { projectId },
            include: {
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true
                    }
                },
                taskLinks: {
                    include: {
                        task: {
                            include: {
                                assignee: true
                            }
                        }
                    }
                },
                meetingLinks: {
                    include: {
                        meeting: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const matrix = requirements.map(req => ({
            id: req.id,
            title: req.title,
            type: req.type,
            status: req.status,
            priority: req.priority,
            owner: req.owner.name,
            stakeholders: req.stakeholders.map(s => ({
                id: s.stakeholder.id,
                name: s.stakeholder.name,
                role: s.role
            })),
            tasks: req.taskLinks.map(link => ({
                id: link.task.id,
                title: link.task.title,
                status: link.task.status,
                assignee: link.task.assignee.name
            })),
            meetings: req.meetingLinks.map(link => ({
                id: link.meeting.id,
                title: link.meeting.title,
                date: link.meeting.meetingDate
            }))
        }));

        res.json({ matrix, project: { id: project.id, name: project.name } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Baseline a requirement
export const baselineRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;

        // Get current requirement
        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check permissions - only workspace admin or project lead can baseline
        const isWorkspaceAdmin = requirement.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = requirement.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to baseline this requirement" });
        }

        // Create baseline
        const baselinedRequirement = await prisma.requirement.update({
            where: { id: requirementId },
            data: {
                isBaseline: true,
                baselineVersion: requirement.version,
                baselineDate: new Date(),
                history: {
                    create: {
                        userId,
                        action: "BASELINED",
                        version: requirement.version,
                        changes: {
                            baselineVersion: requirement.version,
                            baselineDate: new Date().toISOString()
                        }
                    }
                }
            },
            include: {
                owner: true
            }
        });

        res.json({ requirement: baselinedRequirement, message: "Requirement baselined successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Link requirement to test case
export const linkRequirementToTestCase = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const { testCaseId, testCaseName } = req.body;

        // Verify requirement exists
        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check permissions
        const isWorkspaceMember = requirement.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = requirement.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this requirement" });
        }

        // Check if link already exists
        const existingLink = await prisma.requirementTestCase.findUnique({
            where: {
                requirementId_testCaseId: {
                    requirementId,
                    testCaseId
                }
            }
        });

        if (existingLink) {
            return res.status(400).json({ message: "This test case is already linked to this requirement" });
        }

        const testCase = await prisma.requirementTestCase.create({
            data: {
                requirementId,
                testCaseId,
                testCaseName
            }
        });

        // Add history entry
        await prisma.requirementHistory.create({
            data: {
                requirementId,
                userId,
                action: "TEST_CASE_LINKED",
                version: requirement.version,
                changes: { testCaseId, testCaseName }
            }
        });

        res.json({ testCase, message: "Test case linked successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update test case status
export const updateTestCaseStatus = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId, testCaseId } = req.params;
        const { status } = req.body;

        const testCase = await prisma.requirementTestCase.update({
            where: {
                requirementId_testCaseId: {
                    requirementId,
                    testCaseId
                }
            },
            data: {
                status,
                lastTestedAt: new Date()
            }
        });

        res.json({ testCase, message: "Test case status updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get requirements hierarchy
export const getRequirementsHierarchy = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: { include: { members: true } },
                members: true
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        // Get root requirements (no parent)
        const rootRequirements = await prisma.requirement.findMany({
            where: {
                projectId,
                parentId: null
            },
            include: {
                owner: true,
                children: {
                    include: {
                        owner: true,
                        children: {
                            include: {
                                owner: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ requirements: rootRequirements });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};