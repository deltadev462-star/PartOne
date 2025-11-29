import prisma from "../configs/prisma.js";
import multer from "multer";
import {
    exportToExcel,
    exportToCSV,
    exportToPDF,
    getProjectsForExport
} from "../utils/exportUtils.js";
import {
    parseExcelProjects,
    validateProjectData,
    importProjectsToDatabase,
    createProjectTemplate
} from "../utils/importUtils.js";

// Create project
export const createProject = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

        //check if user has admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (!workspace.members.some((member) => member.userId === userId && member.role === "ADMIN")) {
            return res.status(403).json({ message: "You don't have permission to create projects in this workspace" });
        }

        // Check plan limits for projects
        const userWorkspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId,
                        role: 'ADMIN'
                    }
                }
            }
        });
        
        const workspaceIds = userWorkspaces.map(w => w.id);
        const currentProjectCount = await prisma.project.count({
            where: {
                workspaceId: { in: workspaceIds }
            }
        });

        // Get user's subscription plan
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            },
            include: {
                plan: true
            }
        });

        let plan;
        if (!subscription) {
            plan = await prisma.pricingPlan.findUnique({
                where: { type: 'FREE' }
            });
        } else {
            plan = subscription.plan;
        }

        if (plan && currentProjectCount >= plan.maxProjects) {
            return res.status(403).json({
                message: "Project limit reached",
                error: "PLAN_LIMIT_EXCEEDED",
                limit: plan.maxProjects,
                current: currentProjectCount,
                planType: plan.type
            });
        }

        // Get Team Lead using email
        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true },
        });

        const project = await prisma.project.create({
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                team_lead: teamLead?.id,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        });

        // Add members to project if they are in the workspace
        if (team_members?.length > 0) {
            const membersToAdd = []
            workspace.members.forEach(member => {
                if (team_members.includes(member.user.email)) {
                    membersToAdd.push(member.user.id)
                }
            })

            await prisma.projectMember.createMany({
                data: membersToAdd.map(memberId => ({
                    projectId: project.id,
                    userId: memberId,
                }))
            })
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                owner: true
            }
        });

        res.json({ project: projectWithMembers, message: "Project created successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update project
export const updateProject = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const { id, workspaceId, description, name, status, start_date, end_date, progress, priority } = req.body;

        // check if user has admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // check if user has admin role for project
        if (!workspace.members.some((member) => member.userId === userId && member.role === "ADMIN")) {

            const project = await prisma.project.findUnique({
                where: { id }
            });

            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            } else if (project.team_lead !== userId) {
                return res.status(403).json({ message: "You don't have permission to update projects in this workspace" });
            }
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId,
                description,
                name,
                status,
                priority,
                progress,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        });
        
        res.json({ project, message: "Project updated successfully" });
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

// Export projects
export const exportProjects = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;
        const { format = 'excel', status, priority, archived } = req.query;

        // Check if user has access to workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(member => member.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this workspace" });
        }

        // Get projects with filters
        const filters = {};
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (archived) filters.archived = archived === 'true';

        const projects = await getProjectsForExport(workspaceId, filters);

        let buffer;
        let contentType;
        let fileName;

        switch (format.toLowerCase()) {
            case 'csv':
                buffer = await exportToCSV(projects, 'projects');
                contentType = 'text/csv';
                fileName = `projects-${workspaceId}-${Date.now()}.csv`;
                break;
            case 'pdf':
                buffer = await exportToPDF(projects, 'projects');
                contentType = 'application/pdf';
                fileName = `projects-${workspaceId}-${Date.now()}.pdf`;
                break;
            case 'excel':
            default:
                buffer = await exportToExcel(projects, 'projects');
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                fileName = `projects-${workspaceId}-${Date.now()}.xlsx`;
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

// Import projects
export const importProjects = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;

        // Check if user has admin access to workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isAdmin = workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );

        if (!isAdmin) {
            return res.status(403).json({ message: "Only workspace admins can import projects" });
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
                const projects = await parseExcelProjects(req.file.buffer);

                // Validate data
                const validationErrors = validateProjectData(projects);
                if (validationErrors.length > 0) {
                    return res.status(400).json({
                        message: "Validation errors found",
                        errors: validationErrors
                    });
                }

                // Import projects
                const results = await importProjectsToDatabase(projects, workspaceId, userId);

                res.json({
                    message: `Import completed. ${results.success} projects imported successfully, ${results.failed} failed.`,
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

// Download project import template
export const downloadProjectTemplate = async (req, res) => {
    try {
        const buffer = await createProjectTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="project-import-template.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};


// Add Member to Project
export const addMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { email } = req.body;

        // Check if user is project lead
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });

                if (!project ) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.team_lead !== userId) {
            return res.status(404).json({ message: "Only project lead can add members" });
        }

        // Check if user is already a member
        const existingMember = project.members.find((member) => member.email === email);

        if (existingMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId,
            },
        });

        res.json({ member, message: "Member added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Archive project
export const archiveProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check if user has permission (admin or team lead)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: {
                    include: {
                        members: true
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isAdmin = project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isTeamLead = project.team_lead === userId;

        if (!isAdmin && !isTeamLead) {
            return res.status(403).json({ message: "You don't have permission to archive this project" });
        }

        // Archive the project
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                archived: true,
                archivedAt: new Date()
            },
            include: {
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                owner: true
            }
        });

        res.json({ project: updatedProject, message: "Project archived successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Restore archived project
export const restoreProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check if user has permission (admin or team lead)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: {
                    include: {
                        members: true
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isAdmin = project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isTeamLead = project.team_lead === userId;

        if (!isAdmin && !isTeamLead) {
            return res.status(403).json({ message: "You don't have permission to restore this project" });
        }

        // Restore the project
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                archived: false,
                archivedAt: null
            },
            include: {
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                owner: true
            }
        });

        res.json({ project: updatedProject, message: "Project restored successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};