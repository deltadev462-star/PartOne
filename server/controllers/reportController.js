import prisma from '../configs/prisma.js';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/reportExportUtils.js';

// Get all saved reports for a user
export const getSavedReports = async (req, res) => {
    try {
        const userId = req.userId; // Set by authMiddleware
        const { projectId, category } = req.query;

        const where = {
            OR: [
                { createdBy: userId },
                // For JSON field, use array_contains to check if array contains the userId
                { sharedWith: { array_contains: userId } }
            ]
        };

        if (projectId) {
            where.projectId = projectId;
        }

        if (category) {
            if (category === 'favorites') {
                where.isFavorite = true;
            } else if (category === 'scheduled') {
                where.schedule = { not: null };
            } else if (category === 'shared') {
                where.sharedWith = { array_contains: userId };
                where.createdBy = { not: userId };
            } else if (category === 'personal') {
                where.createdBy = userId;
            }
        }

        const reports = await prisma.report.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                lastModified: 'desc'
            }
        });

        res.json({ reports });
    } catch (error) {
        console.error('Error fetching saved reports:', error);
        res.status(500).json({ error: 'Failed to fetch saved reports' });
    }
};

// Get report data for a specific report type
export const getReportData = async (req, res) => {
    try {
        const { projectId, reportType } = req.params;
        const { filters } = req.query;
        const userId = req.userId; // Set by authMiddleware

        // Parse filters if it's a string
        const parsedFilters = filters ? (typeof filters === 'string' ? JSON.parse(filters) : filters) : {};

        // Verify user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                members: {
                    some: {
                        userId
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }

        let reportData = {};

        switch (reportType) {
            case 'project-status':
                reportData = await getProjectStatusReport(projectId, parsedFilters);
                break;
            case 'task-progress':
                reportData = await getTaskProgressReport(projectId, parsedFilters);
                break;
            case 'requirements-coverage':
                reportData = await getRequirementsCoverageReport(projectId, parsedFilters);
                break;
            case 'stakeholder-engagement':
                reportData = await getStakeholderEngagementReport(projectId, parsedFilters);
                break;
            case 'dashboard':
                reportData = await getDashboardData(projectId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

// Save a custom report
export const saveReport = async (req, res) => {
    try {
        const userId = req.userId; // Set by authMiddleware
        const { name, description, config, projectId, type, dataSource } = req.body;

        const report = await prisma.report.create({
            data: {
                name,
                description,
                type: type || 'custom',
                dataSource,
                config,
                projectId,
                createdBy: userId,
                lastModified: new Date(),
                permissions: 'edit',
                format: 'PDF'
            }
        });

        res.json({ report, message: 'Report saved successfully' });
    } catch (error) {
        console.error('Error saving report:', error);
        res.status(500).json({ error: 'Failed to save report' });
    }
};

// Run a saved report
export const runReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.userId; // Set by authMiddleware

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                OR: [
                    { createdBy: userId },
                    { sharedWith: { array_contains: userId } }
                ]
            }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }

        // Update last run time
        await prisma.report.update({
            where: { id: reportId },
            data: {
                lastRun: new Date(),
                runCount: { increment: 1 }
            }
        });

        // Generate report data based on saved configuration
        const reportData = await generateReportFromConfig(report.config, report.projectId);

        res.json({ reportData });
    } catch (error) {
        console.error('Error running report:', error);
        res.status(500).json({ error: 'Failed to run report' });
    }
};

// Delete a report
export const deleteReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.userId; // Set by authMiddleware

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                createdBy: userId
            }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }

        await prisma.report.delete({
            where: { id: reportId }
        });

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: 'Failed to delete report' });
    }
};

// Toggle favorite status
export const toggleFavorite = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.userId; // Set by authMiddleware

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                OR: [
                    { createdBy: userId },
                    { sharedWith: { array_contains: userId } }
                ]
            }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }

        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: {
                isFavorite: !report.isFavorite
            }
        });

        res.json({ report: updatedReport });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
};

// Duplicate a report
export const duplicateReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.userId; // Set by authMiddleware

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                OR: [
                    { createdBy: userId },
                    { sharedWith: { array_contains: userId } }
                ]
            }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }

        // Create a duplicate with a new name
        const duplicatedReport = await prisma.report.create({
            data: {
                name: `${report.name} (Copy)`,
                description: report.description,
                type: report.type,
                dataSource: report.dataSource,
                config: report.config,
                projectId: report.projectId,
                createdBy: userId,
                lastModified: new Date(),
                permissions: report.permissions,
                format: report.format,
                schedule: null, // Don't duplicate schedule
                isFavorite: false // Reset favorite status
            }
        });

        res.json({ report: duplicatedReport, message: 'Report duplicated successfully' });
    } catch (error) {
        console.error('Error duplicating report:', error);
        res.status(500).json({ error: 'Failed to duplicate report' });
    }
};

// Export report
export const exportReport = async (req, res) => {
    try {
        const { projectId, reportType } = req.params;
        const { format, filters } = req.query;
        const userId = req.userId; // Set by authMiddleware

        // Validate required parameters
        if (!projectId) {
            return res.status(400).json({
                error: 'Project ID is required',
                details: 'Please provide a valid project ID'
            });
        }

        if (!reportType) {
            return res.status(400).json({
                error: 'Report type is required',
                details: 'Please specify a report type (e.g., project-status, task-progress)'
            });
        }

        if (!format) {
            return res.status(400).json({
                error: 'Export format is required',
                details: 'Please specify an export format (pdf, excel, or csv)'
            });
        }

        // Verify user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                members: {
                    some: {
                        userId
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({
                error: 'Project not found or access denied',
                details: `Project with ID ${projectId} not found or you don't have access to it`
            });
        }

        // Validate export format early
        const validFormats = ['pdf', 'excel', 'csv'];
        if (!validFormats.includes(format.toLowerCase())) {
            return res.status(400).json({
                error: 'Invalid export format',
                details: `Format must be one of: ${validFormats.join(', ')}`
            });
        }

        // Generate report data based on type
        let reportData = {};
        const parsedFilters = filters ? (typeof filters === 'string' ? JSON.parse(filters) : filters) : {};

        switch (reportType) {
            case 'project-status':
                reportData = await getProjectStatusReport(projectId, parsedFilters);
                break;
            case 'task-progress':
                reportData = await getTaskProgressReport(projectId, parsedFilters);
                break;
            case 'requirements-coverage':
                reportData = await getRequirementsCoverageReport(projectId, parsedFilters);
                break;
            case 'stakeholder-engagement':
                reportData = await getStakeholderEngagementReport(projectId, parsedFilters);
                break;
            case 'dashboard':
                reportData = await getDashboardData(projectId);
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid report type',
                    details: `Report type '${reportType}' is not supported. Available types: project-status, task-progress, requirements-coverage, stakeholder-engagement, dashboard`
                });
        }

        // Check if report data was generated successfully
        if (!reportData || Object.keys(reportData).length === 0) {
            return res.status(500).json({
                error: 'Failed to generate report data',
                details: 'The report data could not be generated. Please ensure the project has relevant data.'
            });
        }

        // Export based on format
        let exportedFile;
        try {
            switch (format.toLowerCase()) {
                case 'pdf':
                    exportedFile = await exportToPDF(reportData);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="report-${reportType}-${Date.now()}.pdf"`);
                    break;
                case 'excel':
                    exportedFile = await exportToExcel(reportData);
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="report-${reportType}-${Date.now()}.xlsx"`);
                    break;
                case 'csv':
                    exportedFile = await exportToCSV(reportData);
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="report-${reportType}-${Date.now()}.csv"`);
                    break;
            }
        } catch (exportError) {
            console.error('Error during file export:', exportError);
            return res.status(500).json({
                error: 'Failed to export file',
                details: `Error exporting to ${format}: ${exportError.message}`
            });
        }

        res.send(exportedFile);
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({
            error: 'Failed to export report',
            details: error.message || 'An unexpected error occurred while exporting the report'
        });
    }
};

// Helper functions for report generation
async function getProjectStatusReport(projectId, filters) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            tasks: {
                include: {
                    assignee: true
                }
            },
            requirements: true,
            risks: true,
            members: {
                include: {
                    user: true
                }
            }
        }
    });

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
    const overdueTasks = project.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;
    
    const totalRequirements = project.requirements.length;
    const completedRequirements = project.requirements.filter(r => r.status === 'IMPLEMENTED' || r.status === 'VERIFIED').length;
    
    const totalRisks = project.risks ? project.risks.length : 0;
    const activeRisks = project.risks ? project.risks.filter(r => r.status === 'MONITORING' || r.status === 'IDENTIFIED').length : 0;
    const criticalRisks = project.risks ? project.risks.filter(r => r.riskLevel === 'CRITICAL').length : 0;

    return {
        project: {
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            start_date: project.start_date,
            end_date: project.end_date
        },
        overview: {
            status: overdueTasks > 5 ? 'AT_RISK' : 'ON_TRACK',
            health: overdueTasks > 5 ? 'red' : completedTasks / totalTasks > 0.7 ? 'green' : 'yellow',
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            startDate: project.start_date,
            endDate: project.end_date,
            budget: project.budget || 0,
            spent: project.spent || 0
        },
        scope: {
            totalRequirements,
            completedRequirements,
            inProgressRequirements: totalRequirements - completedRequirements,
            scopeChanges: 0
        },
        schedule: {
            totalTasks,
            completedTasks,
            overdueTasks,
            upcomingTasks: totalTasks - completedTasks - overdueTasks
        },
        risks: {
            totalRisks,
            activeRisks,
            criticalRisks,
            mitigatedRisks: totalRisks - activeRisks
        },
        team: {
            totalMembers: project.members.length,
            activeMembers: project.members.length
        }
    };
}

async function getTaskProgressReport(projectId, filters) {
    const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
            assignee: true
        }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate summary metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pendingTasks = tasks.filter(t => t.status === 'TODO').length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks created and completed in period
    const tasksCreatedThisPeriod = tasks.filter(t => new Date(t.created_at) > thirtyDaysAgo).length;
    const tasksCompletedThisPeriod = tasks.filter(t => t.status === 'DONE' && new Date(t.updated_at) > thirtyDaysAgo).length;

    // Average completion time (in days)
    const completedTasksWithTime = tasks.filter(t => {
        if (t.status !== 'DONE' || !t.created_at || !t.updated_at) return false;
        try {
            const created = new Date(t.created_at);
            const completed = new Date(t.updated_at);
            return !isNaN(created.getTime()) && !isNaN(completed.getTime());
        } catch (e) {
            return false;
        }
    });
    const averageCompletionTime = completedTasksWithTime.length > 0
        ? Math.round(completedTasksWithTime.reduce((acc, t) => {
            const created = new Date(t.created_at);
            const completed = new Date(t.updated_at);
            return acc + (completed - created) / (1000 * 60 * 60 * 24);
        }, 0) / completedTasksWithTime.length * 10) / 10
        : 0;

    // Group tasks by status
    const byStatus = {
        todo: {
            count: pendingTasks,
            percentage: Math.round((pendingTasks / totalTasks) * 100) || 0,
            tasks: tasks.filter(t => t.status === 'TODO').slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                assignee: t.assignee?.name || 'Unassigned',
                dueDate: t.due_date ? (() => {
                    try {
                        const date = new Date(t.due_date);
                        return !isNaN(date.getTime()) ? date.toLocaleDateString() : null;
                    } catch (e) {
                        return null;
                    }
                })() : null
            }))
        },
        inProgress: {
            count: inProgressTasks,
            percentage: Math.round((inProgressTasks / totalTasks) * 100) || 0,
            tasks: tasks.filter(t => t.status === 'IN_PROGRESS').slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                assignee: t.assignee?.name || 'Unassigned',
                dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : null
            }))
        },
        inReview: {
            count: 0,
            percentage: 0,
            tasks: []
        },
        completed: {
            count: completedTasks,
            percentage: Math.round((completedTasks / totalTasks) * 100) || 0,
            tasks: tasks.filter(t => t.status === 'DONE').slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                assignee: t.assignee?.name || 'Unassigned',
                dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : null
            }))
        },
        cancelled: {
            count: 0,
            percentage: 0,
            tasks: []
        }
    };

    // Group tasks by assignee
    const assigneeMap = {};
    tasks.forEach(task => {
        const assigneeName = task.assignee?.name || task.assignee?.email || 'Unassigned';
        if (!assigneeMap[assigneeName]) {
            assigneeMap[assigneeName] = {
                name: assigneeName,
                avatar: null,
                totalTasks: 0,
                completed: 0,
                inProgress: 0,
                pending: 0,
                overdue: 0
            };
        }
        assigneeMap[assigneeName].totalTasks++;
        if (task.status === 'DONE') assigneeMap[assigneeName].completed++;
        else if (task.status === 'IN_PROGRESS') assigneeMap[assigneeName].inProgress++;
        else if (task.status === 'TODO') assigneeMap[assigneeName].pending++;
        if (task.due_date && new Date(task.due_date) < now && task.status !== 'DONE') {
            assigneeMap[assigneeName].overdue++;
        }
    });

    const byAssignee = Object.values(assigneeMap).map(a => ({
        ...a,
        completionRate: a.totalTasks > 0 ? Math.round((a.completed / a.totalTasks) * 100) : 0
    }));

    // Group tasks by priority
    const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'MEDIUM');
    const lowPriorityTasks = tasks.filter(t => t.priority === 'LOW');

    const byPriority = {
        high: {
            count: highPriorityTasks.length,
            percentage: Math.round((highPriorityTasks.length / totalTasks) * 100) || 0,
            tasks: highPriorityTasks.slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                assignee: t.assignee?.name || 'Unassigned'
            }))
        },
        medium: {
            count: mediumPriorityTasks.length,
            percentage: Math.round((mediumPriorityTasks.length / totalTasks) * 100) || 0,
            tasks: mediumPriorityTasks.slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                assignee: t.assignee?.name || 'Unassigned'
            }))
        },
        low: {
            count: lowPriorityTasks.length,
            percentage: Math.round((lowPriorityTasks.length / totalTasks) * 100) || 0,
            tasks: lowPriorityTasks.slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                assignee: t.assignee?.name || 'Unassigned'
            }))
        }
    };

    // Get overdue tasks list
    const overdueList = tasks
        .filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            title: t.title,
            assignee: t.assignee?.name || 'Unassigned',
            daysOverdue: Math.ceil((now - new Date(t.due_date)) / (1000 * 60 * 60 * 24)),
            priority: t.priority
        }));

    // Get upcoming deadlines
    const upcomingDeadlines = tasks
        .filter(t => t.due_date && new Date(t.due_date) > now && t.status !== 'DONE')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            title: t.title,
            assignee: t.assignee?.name || 'Unassigned',
            dueDate: (() => {
                try {
                    const date = new Date(t.due_date);
                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'N/A';
                } catch (e) {
                    return 'N/A';
                }
            })(),
            daysUntilDue: Math.ceil((new Date(t.due_date) - now) / (1000 * 60 * 60 * 24))
        }));

    // Get recently completed tasks
    const recentlyCompleted = tasks
        .filter(t => t.status === 'DONE' && new Date(t.updated_at) > sevenDaysAgo)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            title: t.title,
            completedBy: t.assignee?.name || 'Unassigned',
            completedDate: (() => {
                try {
                    const date = new Date(t.updated_at);
                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'N/A';
                } catch (e) {
                    return 'N/A';
                }
            })(),
            onTime: !t.due_date || new Date(t.updated_at) <= new Date(t.due_date)
        }));

    // Calculate task trends (simplified)
    const dailyTrends = [];
    for (let i = 4; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const created = tasks.filter(t => {
            if (!t.created_at) return false;
            try {
                const createdDate = new Date(t.created_at);
                if (isNaN(createdDate.getTime())) return false;
                const createdDateStr = createdDate.toISOString().split('T')[0];
                return createdDateStr === dateStr;
            } catch (e) {
                return false;
            }
        }).length;
        const completed = tasks.filter(t => {
            if (t.status !== 'DONE' || !t.updated_at) return false;
            try {
                const completedDate = new Date(t.updated_at);
                if (isNaN(completedDate.getTime())) return false;
                const completedDateStr = completedDate.toISOString().split('T')[0];
                return completedDateStr === dateStr;
            } catch (e) {
                return false;
            }
        }).length;
        dailyTrends.push({ date: dateStr, created, completed });
    }

    // Performance metrics
    const onTimeDelivery = completedTasks > 0
        ? Math.round(tasks.filter(t => {
            if (t.status !== 'DONE') return false;
            if (!t.due_date) return true; // If no due date, consider it on time
            try {
                if (!t.updated_at) return false;
                const updated = new Date(t.updated_at);
                const due = new Date(t.due_date);
                return !isNaN(updated.getTime()) && !isNaN(due.getTime()) && updated <= due;
            } catch (e) {
                return false;
            }
          }).length / completedTasks * 100)
        : 100;

    const avgTaskAge = pendingTasks > 0
        ? Math.round(tasks.filter(t => t.status === 'TODO').reduce((acc, t) => {
            if (!t.created_at) return acc;
            try {
                const created = new Date(t.created_at);
                if (isNaN(created.getTime())) return acc;
                return acc + (now - created) / (1000 * 60 * 60 * 24);
            } catch (e) {
                return acc;
            }
        }, 0) / pendingTasks * 10) / 10
        : 0;

    const velocityTrend = tasksCompletedThisPeriod > tasksCreatedThisPeriod ? 'increasing' :
                         tasksCompletedThisPeriod < tasksCreatedThisPeriod ? 'decreasing' : 'stable';

    const blockedTasks = tasks.filter(t => {
        if (t.status !== 'IN_PROGRESS' || !t.updated_at) return false;
        try {
            const updated = new Date(t.updated_at);
            if (isNaN(updated.getTime())) return false;
            return updated < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } catch (e) {
            return false;
        }
    }).length;

    return {
        summary: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks,
            completionRate,
            averageCompletionTime,
            tasksCreatedThisPeriod,
            tasksCompletedThisPeriod
        },
        byStatus,
        byAssignee,
        byPriority,
        overdueList,
        upcomingDeadlines,
        recentlyCompleted,
        taskTrends: {
            daily: dailyTrends,
            weekly: [] // Simplified for now
        },
        performanceMetrics: {
            onTimeDelivery,
            averageTaskAge: avgTaskAge,
            velocityTrend,
            blockedTasks,
            reworkRate: 5 // Default value
        }
    };
}

async function getRequirementsCoverageReport(projectId, filters) {
    const requirements = await prisma.requirement.findMany({
        where: { projectId },
        include: {
            taskLinks: true,
            testCases: true
        }
    });

    const totalRequirements = requirements.length;
    const coveredRequirements = requirements.filter(r =>
        (r.taskLinks && r.taskLinks.length > 0) && (r.testCases && r.testCases.length > 0)
    ).length;
    const partialCoverage = requirements.filter(r =>
        (r.taskLinks && r.taskLinks.length > 0) || (r.testCases && r.testCases.length > 0)
    ).length - coveredRequirements;
    const noCoverage = requirements.filter(r =>
        (!r.taskLinks || r.taskLinks.length === 0) && (!r.testCases || r.testCases.length === 0)
    ).length;

    // Group by type
    const byType = {
        functional: { total: 0, covered: 0, percentage: 0 },
        nonFunctional: { total: 0, covered: 0, percentage: 0 },
        technical: { total: 0, covered: 0, percentage: 0 },
        business: { total: 0, covered: 0, percentage: 0 }
    };

    // Group by priority
    const byPriority = {
        critical: { total: 0, covered: 0, percentage: 0 },
        high: { total: 0, covered: 0, percentage: 0 },
        medium: { total: 0, covered: 0, percentage: 0 },
        low: { total: 0, covered: 0, percentage: 0 }
    };

    requirements.forEach(req => {
        // Type categorization (based on requirement type if available, otherwise functional)
        const type = req.type?.toLowerCase() || 'functional';
        const typeKey = type.includes('non') ? 'nonFunctional' :
                       type.includes('tech') ? 'technical' :
                       type.includes('bus') ? 'business' : 'functional';
        
        if (byType[typeKey]) {
            byType[typeKey].total++;
            if ((req.taskLinks && req.taskLinks.length > 0) && (req.testCases && req.testCases.length > 0)) {
                byType[typeKey].covered++;
            }
        }

        // Priority categorization
        const priority = (req.priority || 'medium').toLowerCase();
        const priorityKey = priority.includes('crit') || priority.includes('urgent') ? 'critical' :
                           priority.includes('high') ? 'high' :
                           priority.includes('low') ? 'low' : 'medium';
        
        if (byPriority[priorityKey]) {
            byPriority[priorityKey].total++;
            if ((req.taskLinks && req.taskLinks.length > 0) && (req.testCases && req.testCases.length > 0)) {
                byPriority[priorityKey].covered++;
            }
        }
    });

    // Calculate percentages
    Object.keys(byType).forEach(key => {
        byType[key].percentage = byType[key].total > 0
            ? Math.round((byType[key].covered / byType[key].total) * 100)
            : 0;
    });

    Object.keys(byPriority).forEach(key => {
        byPriority[key].percentage = byPriority[key].total > 0
            ? Math.round((byPriority[key].covered / byPriority[key].total) * 100)
            : 0;
    });

    const summary = {
        totalRequirements,
        coveredRequirements,
        partialCoverage,
        noCoverage,
        coveragePercentage: totalRequirements > 0
            ? Math.round((coveredRequirements / totalRequirements) * 100)
            : 0,
        requirementsWithTests: requirements.filter(r => r.testCases && r.testCases.length > 0).length,
        requirementsWithTasks: requirements.filter(r => r.taskLinks && r.taskLinks.length > 0).length,
        requirementsImplemented: requirements.filter(r => r.status === 'IMPLEMENTED' || r.status === 'VERIFIED').length
    };

    // Build traceability matrix
    const traceabilityMatrix = {
        requirements: requirements.slice(0, 10).map(r => ({
            id: r.id,
            title: r.title,
            priority: r.priority || 'MEDIUM',
            type: r.type || 'Functional'
        })),
        tasks: [],
        tests: [],
        mappings: requirements.slice(0, 10).map(r => ({
            requirementId: r.id,
            taskIds: r.taskLinks?.map(tl => tl.taskId) || [],
            testIds: r.testCases?.map(tc => tc.id) || []
        }))
    };

    // Coverage details
    const coverageDetails = requirements.slice(0, 20).map(r => {
        const hasTasks = r.taskLinks && r.taskLinks.length > 0;
        const hasTests = r.testCases && r.testCases.length > 0;
        const coverage = (hasTasks ? 50 : 0) + (hasTests ? 50 : 0);
        
        return {
            id: r.id,
            title: r.title,
            priority: r.priority || 'MEDIUM',
            hasTasks,
            hasTests,
            implemented: r.status === 'IMPLEMENTED' || r.status === 'VERIFIED',
            verified: r.status === 'VERIFIED',
            coverage
        };
    });

    // Identify gaps
    const gaps = requirements
        .filter(r => (!r.taskLinks || r.taskLinks.length === 0) || (!r.testCases || r.testCases.length === 0))
        .slice(0, 10)
        .map(r => {
            const noTasks = !r.taskLinks || r.taskLinks.length === 0;
            const noTests = !r.testCases || r.testCases.length === 0;
            
            return {
                requirement: r.id,
                title: r.title,
                type: noTasks ? 'No Tasks' : 'No Tests',
                severity: r.priority === 'CRITICAL' || r.priority === 'HIGH' ? r.priority : 'MEDIUM',
                description: noTasks
                    ? 'No tasks assigned to this requirement'
                    : 'Missing test coverage for this requirement'
            };
        });

    return {
        summary,
        byType,
        byPriority,
        traceabilityMatrix,
        coverageDetails,
        gaps,
        testCoverage: {
            totalTests: 0,
            passingTests: 0,
            failingTests: 0,
            pendingTests: 0,
            testExecutionRate: 0
        },
        implementationStatus: {
            notStarted: requirements.filter(r => r.status === 'DRAFT' || r.status === 'PENDING').length,
            inProgress: requirements.filter(r => r.status === 'IN_PROGRESS' || r.status === 'APPROVED').length,
            implemented: requirements.filter(r => r.status === 'IMPLEMENTED').length,
            verified: requirements.filter(r => r.status === 'VERIFIED').length
        }
    };
}

async function getStakeholderEngagementReport(projectId, filters) {
    const stakeholders = await prisma.stakeholder.findMany({
        where: { projectId },
        include: {
            history: true
        }
    });

    const summary = {
        totalStakeholders: stakeholders.length,
        activelyEngaged: stakeholders.filter(s => s.interest === 'high' && s.influence === 'high').length,
        partiallyEngaged: stakeholders.filter(s => s.interest === 'medium' || s.influence === 'medium').length,
        notEngaged: stakeholders.filter(s => s.interest === 'low' && s.influence === 'low').length
    };

    summary.engagementRate = summary.totalStakeholders > 0 ? Math.round((summary.activelyEngaged / summary.totalStakeholders) * 100) : 0;

    return { summary, stakeholders };
}

async function getDashboardData(projectId) {
    const [projectStatus, taskProgress, requirements, risks] = await Promise.all([
        getProjectStatusReport(projectId, {}),
        getTaskProgressReport(projectId, {}),
        getRequirementsCoverageReport(projectId, {}),
        prisma.risk.findMany({ where: { projectId } })
    ]);

    return {
        projectHealth: {
            overall: projectStatus.overview.progress,
            schedule: projectStatus.schedule.totalTasks > 0 ? 100 - (projectStatus.schedule.overdueTasks / projectStatus.schedule.totalTasks) * 100 : 100,
            budget: projectStatus.overview.budget ? (1 - projectStatus.overview.spent / projectStatus.overview.budget) * 100 : 100,
            quality: requirements.summary.coveragePercentage,
            risks: risks.length > 0 ? 100 - (risks.filter(r => r.riskLevel === 'CRITICAL').length / risks.length) * 100 : 100
        },
        taskSummary: taskProgress.summary,
        riskOverview: {
            total: risks.length,
            critical: risks.filter(r => r.riskLevel === 'CRITICAL').length,
            high: risks.filter(r => r.riskLevel === 'HIGH').length,
            medium: risks.filter(r => r.riskLevel === 'MEDIUM').length,
            low: risks.filter(r => r.riskLevel === 'LOW').length
        },
        requirementsCoverage: requirements.summary
    };
}

async function generateReportFromConfig(config, projectId) {
    // Generate report data based on saved configuration
    // This would implement the custom report builder logic
    const data = {};
    
    // TODO: Implement actual data generation based on config
    
    return data;
}


// Get report statistics for a project
export const getReportStatistics = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId; // Set by authMiddleware
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                members: {
                    some: {
                        userId
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }

        // Get report statistics
        const [totalReports, savedReports, scheduledReports, lastReport] = await Promise.all([
            // Total reports generated (we'll count based on some activity metric)
            prisma.report.count({
                where: {
                    projectId,
                    OR: [
                        { createdBy: userId },
                        // For JSON field, use array_contains to check if array contains the userId
                        { sharedWith: { array_contains: userId } }
                    ]
                }
            }),
            // Saved reports
            prisma.report.count({
                where: {
                    projectId,
                    createdBy: userId
                }
            }),
            // Scheduled reports
            prisma.report.count({
                where: {
                    projectId,
                    schedule: { not: null },
                    OR: [
                        { createdBy: userId },
                        // For JSON field, use array_contains to check if array contains the userId
                        { sharedWith: { array_contains: userId } }
                    ]
                }
            }),
            // Last generated report
            prisma.report.findFirst({
                where: {
                    projectId,
                    OR: [
                        { createdBy: userId },
                        { sharedWith: { array_contains: userId } }
                    ]
                },
                orderBy: {
                    lastRun: 'desc'
                },
                select: {
                    lastRun: true
                }
            })
        ]);

        res.json({
            totalReports: totalReports || 0,
            savedReports: savedReports || 0,
            scheduledReports: scheduledReports || 0,
            lastGenerated: lastReport?.lastRun || null
        });
    } catch (error) {
        console.error('Error fetching report statistics:', error);
        res.status(500).json({ error: 'Failed to fetch report statistics' });
    }
};

export default {
    getSavedReports,
    getReportData,
    saveReport,
    runReport,
    deleteReport,
    toggleFavorite,
    exportReport,
    getReportStatistics,
    duplicateReport
};