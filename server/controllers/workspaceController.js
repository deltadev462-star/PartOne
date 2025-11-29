import prisma from "../configs/prisma.js";

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });
        res.json({ workspaces });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get single workspace by ID
export const getWorkspaceById = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: { 
                    include: { user: true } 
                },
                owner: true
            }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Check if user is a member
        const isMember = workspace.members.some(member => member.userId === userId);
        if (!isMember && workspace.ownerId !== userId) {
            return res.status(403).json({ message: "You don't have access to this workspace" });
        }

        res.json({ workspace });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get workspace projects
export const getWorkspaceProjects = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;

        // Check if user has access to workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(member => member.userId === userId);
        if (!isMember && workspace.ownerId !== userId) {
            return res.status(403).json({ message: "You don't have access to this workspace" });
        }

        // Get projects
        const projects = await prisma.project.findMany({
            where: { workspaceId },
            include: {
                owner: true,
                members: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ projects });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};