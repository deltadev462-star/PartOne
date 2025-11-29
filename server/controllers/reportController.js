import prisma from '../configs/prisma.js';

// Get all saved reports for a user
export const getSavedReports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { projectId, category } = req.query;

        const where = {
            OR: [
                { createdBy: userId },
                { sharedWith: { has: userId } }
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
                where.sharedWith = { has: userId };
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
        const { userId } = req.user;

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
                reportData = await getProjectStatusReport(projectId, filters);
                break;
            case 'task-progress':
                reportData = await getTaskProgressReport(projectId, filters);
                break;
            case 'requirements-coverage':
                reportData = await getRequirementsCoverageReport(projectId, filters);
                break;
            case 'stakeholder-engagement':
                reportData = await getStakeholderEngagementReport(projectId, filters);
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
        const { userId } = req.user;
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
        const { userId } = req.user;

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                OR: [
                    { createdBy: userId },
                    { sharedWith: { has: userId } }
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
        const { userId } = req.user;

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
        const { userId } = req.user;

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                OR: [
                    { createdBy: userId },
                    { sharedWith: { has: userId } }
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

// Export report
export const exportReport = async (req, res) => {
    try {
        const { projectId, reportType } = req.params;
        const { format } = req.query;
        const { userId } = req.user;

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

        // Generate report data
        const reportData = await getReportData(req, res);

        // Export based on format
        let exportedFile;
        switch (format) {
            case 'pdf':
                exportedFile = await exportToPDF(reportData);
                res.setHeader('Content-Type', 'application/pdf');
                break;
            case 'excel':
                exportedFile = await exportToExcel(reportData);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                break;
            case 'csv':
                exportedFile = await exportToCSV(reportData);
                res.setHeader('Content-Type', 'text/csv');
                break;
            default:
                return res.status(400).json({ error: 'Invalid export format' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.${format}"`);
        res.send(exportedFile);
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
};

// Helper functions for report generation
async function getProjectStatusReport(projectId, filters) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            tasks: true,
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
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const overdueTasks = project.tasks.filter(t => t.dueDate < new Date() && t.status !== 'COMPLETED').length;
    
    const totalRequirements = project.requirements.length;
    const completedRequirements = project.requirements.filter(r => r.status === 'COMPLETED').length;
    
    const totalRisks = project.risks.length;
    const activeRisks = project.risks.filter(r => r.status === 'ACTIVE').length;
    const criticalRisks = project.risks.filter(r => r.severity === 'CRITICAL').length;

    return {
        project: {
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority
        },
        overview: {
            status: overdueTasks > 5 ? 'AT_RISK' : 'ON_TRACK',
            health: overdueTasks > 5 ? 'red' : completedTasks / totalTasks > 0.7 ? 'green' : 'yellow',
            progress: Math.round((completedTasks / totalTasks) * 100),
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget,
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
            activeMembers: project.members.filter(m => m.status === 'ACTIVE').length
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

    const summary = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        pendingTasks: tasks.filter(t => t.status === 'TODO').length,
        overdueTasks: tasks.filter(t => t.dueDate < new Date() && t.status !== 'COMPLETED').length
    };

    summary.completionRate = Math.round((summary.completedTasks / summary.totalTasks) * 100);

    return { summary, tasks };
}

async function getRequirementsCoverageReport(projectId, filters) {
    const requirements = await prisma.requirement.findMany({
        where: { projectId },
        include: {
            tasks: true,
            tests: true
        }
    });

    const summary = {
        totalRequirements: requirements.length,
        coveredRequirements: requirements.filter(r => r.tasks.length > 0 && r.tests.length > 0).length,
        partialCoverage: requirements.filter(r => r.tasks.length > 0 || r.tests.length > 0).length,
        noCoverage: requirements.filter(r => r.tasks.length === 0 && r.tests.length === 0).length
    };

    summary.coveragePercentage = Math.round((summary.coveredRequirements / summary.totalRequirements) * 100);

    return { summary, requirements };
}

async function getStakeholderEngagementReport(projectId, filters) {
    const stakeholders = await prisma.stakeholder.findMany({
        where: { projectId },
        include: {
            communications: true
        }
    });

    const summary = {
        totalStakeholders: stakeholders.length,
        activelyEngaged: stakeholders.filter(s => s.engagementLevel === 'HIGH').length,
        partiallyEngaged: stakeholders.filter(s => s.engagementLevel === 'MEDIUM').length,
        notEngaged: stakeholders.filter(s => s.engagementLevel === 'LOW').length
    };

    summary.engagementRate = Math.round((summary.activelyEngaged / summary.totalStakeholders) * 100);

    return { summary, stakeholders };
}

async function getDashboardData(projectId) {
    const [projectStatus, taskProgress, requirements, risks] = await Promise.all([
        getProjectStatusReport(projectId),
        getTaskProgressReport(projectId),
        getRequirementsCoverageReport(projectId),
        prisma.risk.findMany({ where: { projectId } })
    ]);

    return {
        projectHealth: {
            overall: projectStatus.overview.progress,
            schedule: 100 - (projectStatus.schedule.overdueTasks / projectStatus.schedule.totalTasks) * 100,
            budget: projectStatus.overview.budget ? (1 - projectStatus.overview.spent / projectStatus.overview.budget) * 100 : 100,
            quality: requirements.summary.coveragePercentage,
            risks: 100 - (risks.filter(r => r.severity === 'CRITICAL').length / risks.length) * 100
        },
        taskSummary: taskProgress.summary,
        riskOverview: {
            total: risks.length,
            critical: risks.filter(r => r.severity === 'CRITICAL').length,
            high: risks.filter(r => r.severity === 'HIGH').length,
            medium: risks.filter(r => r.severity === 'MEDIUM').length,
            low: risks.filter(r => r.severity === 'LOW').length
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

// Export helper functions (placeholder implementations)
async function exportToPDF(data) {
    // TODO: Implement PDF export using a library like puppeteer or jsPDF
    return Buffer.from('PDF content');
}

async function exportToExcel(data) {
    // TODO: Implement Excel export using a library like exceljs
    return Buffer.from('Excel content');
}

async function exportToCSV(data) {
    // TODO: Implement CSV export
    return Buffer.from('CSV content');
}

export default {
    getSavedReports,
    getReportData,
    saveReport,
    runReport,
    deleteReport,
    toggleFavorite,
    exportReport
};