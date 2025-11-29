import prisma from "../configs/prisma.js";

// Create stakeholder
export const createStakeholder = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const {
            projectId,
            name,
            email,
            role,
            organization,
            department,
            phone,
            notes,
            influence,
            interest,
            power,
            impact,
            category,
            engagementApproach,
            communicationPlan,
            communicationChannel,
            engagementFrequency,
            engagementNotes,
            location,
            timezone,
            language,
            tags
        } = req.body;

        // Check if user has permission
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
        const isProjectLead = project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to create stakeholders in this project" });
        }

        const stakeholder = await prisma.stakeholder.create({
            data: {
                projectId,
                name,
                email,
                role,
                organization,
                department,
                phone,
                notes,
                influence: influence || "medium",
                interest: interest || "medium",
                power: power || "medium",
                impact: impact || "medium",
                category: category || "external",
                engagementApproach,
                communicationPlan,
                communicationChannel,
                engagementFrequency,
                engagementNotes,
                location,
                timezone,
                language: language || "en",
                tags: tags || []
            }
        });

        // Create initial history entry
        await prisma.stakeholderHistory.create({
            data: {
                stakeholderId: stakeholder.id,
                type: "creation",
                title: "Stakeholder added",
                description: `${name} was added as a stakeholder`,
                userId,
                metadata: { action: "created", by: userId }
            }
        });

        res.json({ stakeholder, message: "Stakeholder created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get workspace stakeholders with filters
export const getWorkspaceStakeholders = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;
        const { projectId, influence, interest, category, search } = req.query;

        // Check workspace access
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: true,
                projects: true
            }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isWorkspaceMember = workspace.members.some(member => member.userId === userId);
        if (!isWorkspaceMember) {
            return res.status(403).json({ message: "You don't have access to this workspace" });
        }

        // Build filter conditions
        const whereConditions = {
            project: {
                workspaceId
            }
        };

        if (projectId) {
            whereConditions.projectId = projectId;
        }
        if (influence) {
            whereConditions.influence = influence;
        }
        if (interest) {
            whereConditions.interest = interest;
        }
        if (category) {
            whereConditions.category = category;
        }
        if (search) {
            whereConditions.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { organization: { contains: search, mode: 'insensitive' } },
                { role: { contains: search, mode: 'insensitive' } }
            ];
        }

        const stakeholders = await prisma.stakeholder.findMany({
            where: whereConditions,
            include: {
                project: true,
                history: {
                    orderBy: { date: 'desc' },
                    take: 5
                },
                attachments: true,
                requirements: {
                    include: {
                        requirement: true
                    }
                },
                meetings: {
                    include: {
                        meeting: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ stakeholders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get project stakeholders
export const getProjectStakeholders = async (req, res) => {
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

        const stakeholders = await prisma.stakeholder.findMany({
            where: { projectId },
            include: {
                history: {
                    orderBy: { date: 'desc' },
                    take: 10
                },
                attachments: true,
                requirements: {
                    include: {
                        requirement: true
                    }
                },
                meetings: {
                    include: {
                        meeting: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ stakeholders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Create stakeholder history entry
export const createStakeholderHistory = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { stakeholderId } = req.params;
        const { type, title, description, status, date, metadata } = req.body;

        // Check permissions
        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: stakeholderId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ message: "Stakeholder not found" });
        }

        const isWorkspaceMember = stakeholder.project.workspace.members.some(
            member => member.userId === userId
        );
        const isProjectMember = stakeholder.project.members.some(
            member => member.userId === userId
        );

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have permission to add history for this stakeholder" });
        }

        const historyEntry = await prisma.stakeholderHistory.create({
            data: {
                stakeholderId,
                type,
                title,
                description,
                status: status || "completed",
                date: date ? new Date(date) : new Date(),
                userId,
                metadata: metadata || {}
            }
        });

        res.json({ historyEntry, message: "History entry added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get stakeholder history
export const getStakeholderHistory = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { stakeholderId } = req.params;
        const { limit = 50 } = req.query;

        // Check access
        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: stakeholderId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ message: "Stakeholder not found" });
        }

        const isWorkspaceMember = stakeholder.project.workspace.members.some(
            member => member.userId === userId
        );
        const isProjectMember = stakeholder.project.members.some(
            member => member.userId === userId
        );

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this stakeholder" });
        }

        const history = await prisma.stakeholderHistory.findMany({
            where: { stakeholderId },
            orderBy: { date: 'desc' },
            take: parseInt(limit)
        });

        res.json({ history });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get stakeholder engagement matrix data
export const getStakeholderMatrix = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;

        // Check workspace access
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isWorkspaceMember = workspace.members.some(member => member.userId === userId);
        if (!isWorkspaceMember) {
            return res.status(403).json({ message: "You don't have access to this workspace" });
        }

        // Get all stakeholders grouped by influence/interest
        const stakeholders = await prisma.stakeholder.findMany({
            where: {
                project: {
                    workspaceId
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Group stakeholders by influence/interest matrix
        const matrix = {
            highInfluenceHighInterest: [],
            highInfluenceLowInterest: [],
            lowInfluenceHighInterest: [],
            lowInfluenceLowInterest: []
        };

        stakeholders.forEach(stakeholder => {
            const key = `${stakeholder.influence}Influence${stakeholder.interest.charAt(0).toUpperCase() + stakeholder.interest.slice(1)}Interest`;
            if (matrix[key]) {
                matrix[key].push(stakeholder);
            }
        });

        res.json({ matrix, totalStakeholders: stakeholders.length });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update stakeholder
export const updateStakeholder = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { stakeholderId } = req.params;
        const updateData = req.body;

        // Get stakeholder with project info
        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: stakeholderId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ message: "Stakeholder not found" });
        }

        // Check permissions
        const isWorkspaceAdmin = stakeholder.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = stakeholder.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to update this stakeholder" });
        }

        // Track changes for history
        const changes = {};
        const fieldsToTrack = ['influence', 'interest', 'power', 'impact', 'category', 'engagementApproach'];
        
        fieldsToTrack.forEach(field => {
            if (updateData[field] && updateData[field] !== stakeholder[field]) {
                changes[field] = {
                    from: stakeholder[field],
                    to: updateData[field]
                };
            }
        });

        const updatedStakeholder = await prisma.stakeholder.update({
            where: { id: stakeholderId },
            data: updateData
        });

        // Log significant changes to history
        if (Object.keys(changes).length > 0) {
            await prisma.stakeholderHistory.create({
                data: {
                    stakeholderId,
                    type: "update",
                    title: "Stakeholder information updated",
                    description: `Updated fields: ${Object.keys(changes).join(', ')}`,
                    userId,
                    metadata: { changes, by: userId }
                }
            });
        }

        res.json({ stakeholder: updatedStakeholder, message: "Stakeholder updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete stakeholder
export const deleteStakeholder = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { stakeholderId } = req.params;

        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: stakeholderId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ message: "Stakeholder not found" });
        }

        // Check permissions
        const isWorkspaceAdmin = stakeholder.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = stakeholder.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to delete this stakeholder" });
        }

        await prisma.stakeholder.delete({
            where: { id: stakeholderId }
        });

        res.json({ message: "Stakeholder deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Create meeting
export const createMeeting = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { 
            projectId, 
            title, 
            description, 
            meetingDate, 
            duration, 
            location, 
            notes,
            participantIds,
            requirementIds
        } = req.body;

        // Check if user has permission
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

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have permission to create meetings in this project" });
        }

        const meeting = await prisma.meeting.create({
            data: {
                projectId,
                title,
                description,
                meetingDate: new Date(meetingDate),
                duration,
                location,
                notes
            }
        });

        // Add participants
        if (participantIds && participantIds.length > 0) {
            const participants = participantIds.map(stakeholderId => ({
                meetingId: meeting.id,
                stakeholderId
            }));

            await prisma.meetingParticipant.createMany({
                data: participants
            });
        }

        // Link requirements
        if (requirementIds && requirementIds.length > 0) {
            const requirementLinks = requirementIds.map(requirementId => ({
                meetingId: meeting.id,
                requirementId
            }));

            await prisma.meetingRequirement.createMany({
                data: requirementLinks
            });
        }

        // Fetch complete meeting data
        const completeMeeting = await prisma.meeting.findUnique({
            where: { id: meeting.id },
            include: {
                participants: {
                    include: {
                        stakeholder: true
                    }
                },
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            }
        });

        res.json({ meeting: completeMeeting, message: "Meeting created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get project meetings
export const getProjectMeetings = async (req, res) => {
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

        const meetings = await prisma.meeting.findMany({
            where: { projectId },
            include: {
                participants: {
                    include: {
                        stakeholder: true
                    }
                },
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            },
            orderBy: { meetingDate: 'desc' }
        });

        res.json({ meetings });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};