import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

// Create task
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { 
            projectId, 
            title, 
            description, 
            type, 
            status, 
            priority, 
            assigneeId, 
            due_date,
            start_date,
            sprint,
            tags,
            estimatedHours
        } = req.body;
        const origin = req.get('origin');

        // Check if user has admin role for project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if user is a member of the project workspace
        const projectWithWorkspace = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: { include: { members: true } },
                members: true
            }
        });
        
        const isWorkspaceMember = projectWithWorkspace.workspace.members.some(member => member.userId === userId);
        const isProjectMember = projectWithWorkspace.members.some(member => member.userId === userId);
        
        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You must be a member of the project or workspace to create tasks" });
        }
        
        if (assigneeId) {
            // Check if assignee is a member of workspace
            const assigneeIsValid = projectWithWorkspace.workspace.members.some(member => member.userId === assigneeId) ||
                                   projectWithWorkspace.members.some(member => member.userId === assigneeId);
            if (!assigneeIsValid) {
                return res.status(403).json({ message: "Assignee is not a member of the project or workspace" });
            }
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                type: type || 'TASK',
                priority: priority || 'MEDIUM',
                assigneeId: assigneeId || null,
                status: status || 'TODO',
                due_date: new Date(due_date),
                start_date: start_date ? new Date(start_date) : null,
                sprint,
                tags: tags || [],
                estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
            },
            include: {
                assignee: true,
                project: true,
                subtasks: {
                    orderBy: { position: 'asc' }
                },
                attachments: true,
                dependencies: {
                    include: {
                        dependsOnTask: {
                            include: {
                                assignee: true,
                                project: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Only send notification if task was assigned
        if (assigneeId) {
            await inngest.send({
                name: "app/task.assigned",
                data: {
                    taskId: task.id,
                    origin
                }
            })
        }

        res.json({ task, message: "Task created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const { userId } = await req.auth();

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }

        // Handle date fields separately to avoid conversion issues
        const updateData = { ...req.body };
        if (updateData.due_date) {
            updateData.due_date = new Date(updateData.due_date);
        }
        if (updateData.start_date) {
            updateData.start_date = new Date(updateData.start_date);
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                assignee: true,
                project: true,
                subtasks: {
                    orderBy: { position: 'asc' }
                },
                attachments: true,
                dependencies: {
                    include: {
                        dependsOnTask: {
                            include: {
                                assignee: true,
                                project: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        user: true
                    }
                }
            }
        });

        res.json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update task status (for drag and drop)
export const updateTaskStatus = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { status, position } = req.body;
        const taskId = req.params.id;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Check if user has access to the project
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: {
                workspace: { include: { members: true } },
                members: true
            }
        });

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                status,
                position: position !== undefined ? position : task.position
            },
            include: {
                assignee: true,
                project: true,
                subtasks: {
                    orderBy: { position: 'asc' }
                },
                attachments: true,
                dependencies: {
                    include: {
                        dependsOnTask: {
                            include: {
                                assignee: true,
                                project: true
                            }
                        }
                    }
                }
            }
        });

        res.json({ task: updatedTask, message: "Task status updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { tasksIds } = req.body;

        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } },
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }

        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } },
        });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get tasks by project
export const getProjectTasks = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check if user has access to the project
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

        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: true,
                project: true,
                subtasks: {
                    orderBy: { position: 'asc' }
                },
                attachments: true,
                dependencies: {
                    include: {
                        dependsOnTask: {
                            include: {
                                assignee: true,
                                project: true
                            }
                        }
                    }
                },
                comments: {
                    include: { user: true }
                }
            },
            orderBy: [
                { status: 'asc' },
                { position: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({ tasks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get user's tasks across all projects
export const getUserTasks = async (req, res) => {
    try {
        const { userId } = await req.auth();

        const tasks = await prisma.task.findMany({
            where: {
                assigneeId: userId
            },
            include: {
                assignee: true,
                project: true,
                subtasks: {
                    orderBy: { position: 'asc' }
                },
                attachments: true,
                dependencies: {
                    include: {
                        dependsOnTask: {
                            include: {
                                assignee: true,
                                project: true
                            }
                        }
                    }
                },
                comments: {
                    include: { user: true }
                }
            },
            orderBy: [
                { status: 'asc' },
                { due_date: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({ tasks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get workspace tasks
export const getWorkspaceTasks = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;

        // Check if user is a member of the workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: true,
                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                project: true,
                                subtasks: {
                                    orderBy: { position: 'asc' }
                                },
                                attachments: true,
                                dependencies: {
                                    include: {
                                        dependsOnTask: {
                                            include: {
                                                assignee: true,
                                                project: true
                                            }
                                        }
                                    }
                                },
                                comments: {
                                    include: { user: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(member => member.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this workspace" });
        }

        // Flatten tasks from all projects
        const tasks = workspace.projects.reduce((allTasks, project) => {
            return [...allTasks, ...project.tasks];
        }, []);

        res.json({ tasks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add subtask
export const addSubtask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const { title } = req.body;

        // Check task exists and user has access
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: { include: { workspace: { include: { members: true } } } } }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isMember = task.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this task" });
        }

        // Get the highest position
        const lastSubtask = await prisma.subtask.findFirst({
            where: { taskId },
            orderBy: { position: 'desc' }
        });

        const position = lastSubtask ? lastSubtask.position + 1 : 0;

        const subtask = await prisma.subtask.create({
            data: {
                taskId,
                title,
                position
            }
        });

        res.json({ subtask, message: "Subtask created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update subtask
export const updateSubtask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { subtaskId } = req.params;
        const { title, completed } = req.body;

        // Check subtask exists and user has access
        const subtask = await prisma.subtask.findUnique({
            where: { id: subtaskId },
            include: {
                task: {
                    include: {
                        project: { include: { workspace: { include: { members: true } } } }
                    }
                }
            }
        });

        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        const isMember = subtask.task.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this subtask" });
        }

        const updatedSubtask = await prisma.subtask.update({
            where: { id: subtaskId },
            data: {
                title: title !== undefined ? title : subtask.title,
                completed: completed !== undefined ? completed : subtask.completed
            }
        });

        res.json({ subtask: updatedSubtask, message: "Subtask updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete subtask
export const deleteSubtask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { subtaskId } = req.params;

        // Check subtask exists and user has access
        const subtask = await prisma.subtask.findUnique({
            where: { id: subtaskId },
            include: {
                task: {
                    include: {
                        project: true
                    }
                }
            }
        });

        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Only project lead can delete subtasks
        if (subtask.task.project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have permission to delete this subtask" });
        }

        await prisma.subtask.delete({
            where: { id: subtaskId }
        });

        res.json({ message: "Subtask deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add task dependency
export const addTaskDependency = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const { dependsOnTaskId } = req.body;

        // Check if both tasks exist and user has access
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: { include: { workspace: { include: { members: true } } } } }
        });

        const dependsOnTask = await prisma.task.findUnique({
            where: { id: dependsOnTaskId },
            include: { project: true }
        });

        if (!task || !dependsOnTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isMember = task.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this task" });
        }

        // Check if dependency already exists
        const existingDependency = await prisma.taskDependency.findFirst({
            where: {
                dependentTaskId: taskId,
                dependsOnTaskId: dependsOnTaskId
            }
        });

        if (existingDependency) {
            return res.status(400).json({ message: "Dependency already exists" });
        }

        // Check for circular dependencies
        const wouldCreateCycle = await checkForCircularDependency(taskId, dependsOnTaskId);
        if (wouldCreateCycle) {
            return res.status(400).json({ message: "This dependency would create a circular reference" });
        }

        // Create the dependency
        const dependency = await prisma.taskDependency.create({
            data: {
                dependentTaskId: taskId,
                dependsOnTaskId: dependsOnTaskId
            },
            include: {
                dependsOnTask: {
                    include: {
                        assignee: true,
                        project: true,
                        subtasks: true
                    }
                }
            }
        });

        res.json({ dependency, message: "Dependency added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Remove task dependency
export const removeTaskDependency = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId, dependencyId } = req.params;

        // Check task exists and user has access
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: { include: { workspace: { include: { members: true } } } } }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isMember = task.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this task" });
        }

        // Delete the dependency
        await prisma.taskDependency.delete({
            where: { id: dependencyId }
        });

        res.json({ message: "Dependency removed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get task dependencies
export const getTaskDependencies = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;

        // Check task exists and user has access
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: { include: { workspace: { include: { members: true } } } },
                dependencies: {
                    include: {
                        dependsOnTask: true
                    }
                },
                dependents: {
                    include: {
                        dependentTask: true
                    }
                }
            }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isMember = task.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this task" });
        }

        res.json({
            dependencies: task.dependencies,
            dependents: task.dependents
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Helper function to check for circular dependencies
async function checkForCircularDependency(taskId, potentialDependencyId) {
    // If task would depend on itself, that's circular
    if (taskId === potentialDependencyId) {
        return true;
    }

    // Check if the potential dependency already depends on this task (directly or indirectly)
    const visited = new Set();
    const queue = [potentialDependencyId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        
        if (visited.has(currentId)) {
            continue;
        }
        
        visited.add(currentId);

        const dependencies = await prisma.taskDependency.findMany({
            where: { dependentTaskId: currentId },
            select: { dependsOnTaskId: true }
        });

        for (const dep of dependencies) {
            if (dep.dependsOnTaskId === taskId) {
                return true; // Found circular dependency
            }
            queue.push(dep.dependsOnTaskId);
        }
    }

    return false;
}