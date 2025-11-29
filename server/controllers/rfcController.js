import prisma from "../configs/prisma.js";

// Generate RFC ID
const generateRFCId = async (projectId) => {
    const count = await prisma.rFC.count({
        where: { projectId }
    });
    return `RFC-${String(count + 1).padStart(3, '0')}`;
};

// Create RFC
export const createRFC = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const {
            projectId,
            requirementId,
            title,
            description,
            reason,
            impact,
            impactLevel,
            risk,
            costEstimate,
            scheduleImpact,
            affectedTasks,
            affectedReleases,
            timeEstimate
        } = req.body;

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

        // Check permissions
        const isWorkspaceMember = requirement.project.workspace.members.some(
            member => member.userId === userId
        );
        const isProjectMember = requirement.project.members.some(
            member => member.userId === userId
        );

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have permission to create RFC for this requirement" });
        }

        // Generate RFC ID
        const rfcId = await generateRFCId(projectId);

        // Create RFC
        const rfc = await prisma.rFC.create({
            data: {
                rfcId,
                projectId,
                requirementId,
                title,
                description,
                reason,
                impact,
                impactLevel: impactLevel || "MEDIUM",
                risk,
                costEstimate,
                scheduleImpact,
                affectedTasks: affectedTasks || [],
                affectedReleases: affectedReleases || [],
                timeEstimate,
                requesterId: userId,
                status: "PROPOSED",
                history: {
                    create: {
                        userId,
                        action: "CREATED",
                        changes: {
                            status: "PROPOSED",
                            title,
                            reason
                        }
                    }
                }
            },
            include: {
                requester: true,
                requirement: {
                    include: {
                        owner: true
                    }
                },
                comments: {
                    include: {
                        user: true
                    }
                }
            }
        });

        res.json({ rfc, message: "RFC created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get RFCs for a project
export const getProjectRFCs = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { status, impactLevel } = req.query;

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
        
        // Validate RFC status if provided
        const validRFCStatuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELLED'];
        if (status && validRFCStatuses.includes(status)) {
            filterConditions.status = status;
        } else if (status) {
            console.warn(`Invalid RFC status filter: ${status}. Ignoring status filter.`);
        }
        
        // Validate impact level if provided
        const validImpactLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (impactLevel && validImpactLevels.includes(impactLevel)) {
            filterConditions.impactLevel = impactLevel;
        } else if (impactLevel) {
            console.warn(`Invalid impact level filter: ${impactLevel}. Ignoring impact level filter.`);
        }

        const rfcs = await prisma.rFC.findMany({
            where: filterConditions,
            include: {
                requester: true,
                reviewer: true,
                approver: true,
                requirement: {
                    include: {
                        owner: true
                    }
                },
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3
                },
                attachments: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ rfcs });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get single RFC
export const getRFC = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { rfcId } = req.params;

        const rfc = await prisma.rFC.findUnique({
            where: { id: rfcId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                },
                requester: true,
                reviewer: true,
                approver: true,
                requirement: {
                    include: {
                        owner: true,
                        stakeholders: {
                            include: {
                                stakeholder: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                attachments: true,
                history: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!rfc) {
            return res.status(404).json({ message: "RFC not found" });
        }

        // Check access
        const isWorkspaceMember = rfc.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = rfc.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this RFC" });
        }

        res.json({ rfc });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update RFC
export const updateRFC = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { rfcId } = req.params;
        const {
            title,
            description,
            reason,
            impact,
            impactLevel,
            risk,
            costEstimate,
            scheduleImpact,
            affectedTasks,
            affectedReleases,
            timeEstimate
        } = req.body;

        // Get current RFC to check permissions
        const currentRFC = await prisma.rFC.findUnique({
            where: { id: rfcId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!currentRFC) {
            return res.status(404).json({ message: "RFC not found" });
        }

        // Check permissions - only requester, reviewer, or admin can update
        const isWorkspaceAdmin = currentRFC.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isRequester = currentRFC.requesterId === userId;
        const isReviewer = currentRFC.reviewerId === userId;
        const isProjectLead = currentRFC.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isRequester && !isReviewer && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to update this RFC" });
        }

        // Only allow updates if status is PROPOSED or UNDER_REVIEW
        if (!['PROPOSED', 'UNDER_REVIEW'].includes(currentRFC.status)) {
            return res.status(400).json({ message: "Cannot update RFC with status: " + currentRFC.status });
        }

        // Track changes
        const changes = {};
        if (title !== undefined && title !== currentRFC.title) changes.title = { old: currentRFC.title, new: title };
        if (description !== undefined && description !== currentRFC.description) changes.description = { old: currentRFC.description, new: description };
        if (reason !== undefined && reason !== currentRFC.reason) changes.reason = { old: currentRFC.reason, new: reason };
        if (impact !== undefined && impact !== currentRFC.impact) changes.impact = { old: currentRFC.impact, new: impact };
        if (impactLevel !== undefined && impactLevel !== currentRFC.impactLevel) changes.impactLevel = { old: currentRFC.impactLevel, new: impactLevel };

        const updatedRFC = await prisma.rFC.update({
            where: { id: rfcId },
            data: {
                title,
                description,
                reason,
                impact,
                impactLevel,
                risk,
                costEstimate,
                scheduleImpact,
                affectedTasks,
                affectedReleases,
                timeEstimate,
                history: {
                    create: {
                        userId,
                        action: "UPDATED",
                        changes
                    }
                }
            },
            include: {
                requester: true,
                reviewer: true,
                requirement: {
                    include: {
                        owner: true
                    }
                }
            }
        });

        res.json({ rfc: updatedRFC, message: "RFC updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update RFC status
export const updateRFCStatus = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { rfcId } = req.params;
        const { status, reviewerId, rejectionReason } = req.body;

        // Get current RFC
        const currentRFC = await prisma.rFC.findUnique({
            where: { id: rfcId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!currentRFC) {
            return res.status(404).json({ message: "RFC not found" });
        }

        // Check permissions based on status change
        const isWorkspaceAdmin = currentRFC.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = currentRFC.project.team_lead === userId;

        // Validate status transition and permissions
        switch (status) {
            case 'UNDER_REVIEW':
                if (currentRFC.status !== 'PROPOSED') {
                    return res.status(400).json({ message: "RFC must be in PROPOSED status to start review" });
                }
                if (!isWorkspaceAdmin && !isProjectLead) {
                    return res.status(403).json({ message: "Only admin or project lead can start review" });
                }
                break;

            case 'APPROVED':
                if (currentRFC.status !== 'UNDER_REVIEW') {
                    return res.status(400).json({ message: "RFC must be UNDER_REVIEW to be approved" });
                }
                if (!isWorkspaceAdmin && !isProjectLead) {
                    return res.status(403).json({ message: "Only admin or project lead can approve RFC" });
                }
                break;

            case 'REJECTED':
                if (!['PROPOSED', 'UNDER_REVIEW'].includes(currentRFC.status)) {
                    return res.status(400).json({ message: "Invalid status transition" });
                }
                if (!isWorkspaceAdmin && !isProjectLead) {
                    return res.status(403).json({ message: "Only admin or project lead can reject RFC" });
                }
                if (!rejectionReason) {
                    return res.status(400).json({ message: "Rejection reason is required" });
                }
                break;

            case 'IMPLEMENTED':
                if (currentRFC.status !== 'APPROVED') {
                    return res.status(400).json({ message: "RFC must be APPROVED to be implemented" });
                }
                break;

            case 'CANCELLED':
                if (!['PROPOSED', 'UNDER_REVIEW'].includes(currentRFC.status)) {
                    return res.status(400).json({ message: "Cannot cancel RFC with status: " + currentRFC.status });
                }
                if (currentRFC.requesterId !== userId && !isWorkspaceAdmin) {
                    return res.status(403).json({ message: "Only requester or admin can cancel RFC" });
                }
                break;

            default:
                return res.status(400).json({ message: "Invalid status: " + status });
        }

        // Update data based on status
        const updateData = {
            status,
            history: {
                create: {
                    userId,
                    action: "STATUS_CHANGED",
                    changes: {
                        status: { old: currentRFC.status, new: status },
                        ...(rejectionReason && { rejectionReason })
                    }
                }
            }
        };

        if (status === 'UNDER_REVIEW' && reviewerId) {
            updateData.reviewerId = reviewerId;
        }
        if (status === 'APPROVED') {
            updateData.approvedBy = userId;
            updateData.approvedAt = new Date();
        }
        if (status === 'REJECTED') {
            updateData.rejectionReason = rejectionReason;
        }
        if (status === 'IMPLEMENTED') {
            updateData.implementedAt = new Date();
        }

        const updatedRFC = await prisma.rFC.update({
            where: { id: rfcId },
            data: updateData,
            include: {
                requester: true,
                reviewer: true,
                approver: true,
                requirement: {
                    include: {
                        owner: true
                    }
                }
            }
        });

        res.json({ rfc: updatedRFC, message: `RFC ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add comment to RFC
export const addRFCComment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { rfcId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        // Check if RFC exists and user has access
        const rfc = await prisma.rFC.findUnique({
            where: { id: rfcId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!rfc) {
            return res.status(404).json({ message: "RFC not found" });
        }

        const isWorkspaceMember = rfc.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = rfc.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to comment on this RFC" });
        }

        const comment = await prisma.rFCComment.create({
            data: {
                rfcId,
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

// Delete RFC
export const deleteRFC = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { rfcId } = req.params;

        const rfc = await prisma.rFC.findUnique({
            where: { id: rfcId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!rfc) {
            return res.status(404).json({ message: "RFC not found" });
        }

        // Check permissions - only workspace admin or requester (if status is PROPOSED) can delete
        const isWorkspaceAdmin = rfc.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isRequester = rfc.requesterId === userId;

        if (!isWorkspaceAdmin && !(isRequester && rfc.status === 'PROPOSED')) {
            return res.status(403).json({ message: "You don't have permission to delete this RFC" });
        }

        await prisma.rFC.delete({
            where: { id: rfcId }
        });

        res.json({ message: "RFC deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get RFC impact analysis
export const getRFCImpactAnalysis = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { rfcId } = req.params;

        const rfc = await prisma.rFC.findUnique({
            where: { id: rfcId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                },
                requirement: {
                    include: {
                        taskLinks: {
                            include: {
                                task: {
                                    include: {
                                        assignee: true
                                    }
                                }
                            }
                        },
                        children: {
                            include: {
                                taskLinks: {
                                    include: {
                                        task: true
                                    }
                                }
                            }
                        },
                        stakeholders: {
                            include: {
                                stakeholder: true
                            }
                        }
                    }
                }
            }
        });

        if (!rfc) {
            return res.status(404).json({ message: "RFC not found" });
        }

        // Check access
        const isWorkspaceMember = rfc.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = rfc.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this RFC" });
        }

        // Compile impact analysis
        const impactAnalysis = {
            rfc: {
                id: rfc.id,
                rfcId: rfc.rfcId,
                title: rfc.title,
                status: rfc.status,
                impactLevel: rfc.impactLevel
            },
            requirement: {
                id: rfc.requirement.id,
                requirementId: rfc.requirement.requirementId,
                title: rfc.requirement.title,
                status: rfc.requirement.status,
                priority: rfc.requirement.priority
            },
            affectedTasks: [
                ...rfc.requirement.taskLinks.map(link => link.task),
                ...rfc.requirement.children.flatMap(child => 
                    child.taskLinks.map(link => link.task)
                )
            ],
            affectedStakeholders: rfc.requirement.stakeholders.map(s => s.stakeholder),
            estimatedImpact: {
                timeEstimate: rfc.timeEstimate,
                costEstimate: rfc.costEstimate,
                scheduleImpact: rfc.scheduleImpact,
                affectedReleases: rfc.affectedReleases
            }
        };

        res.json({ impactAnalysis });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};