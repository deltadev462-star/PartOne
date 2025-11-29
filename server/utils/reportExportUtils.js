import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Export report data to PDF
export async function exportToPDF(reportData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];

            // Collect the PDF data
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Add content to PDF
            doc.fontSize(20).text('Report', { align: 'center' });
            doc.moveDown();
            
            // Add project info if available
            if (reportData.project) {
                doc.fontSize(16).text(reportData.project.name, { underline: true });
                doc.fontSize(12);
                doc.text(`Status: ${reportData.project.status}`);
                doc.text(`Priority: ${reportData.project.priority}`);
                doc.moveDown();
            }

            // Add overview section
            if (reportData.overview) {
                doc.fontSize(14).text('Project Overview', { underline: true });
                doc.fontSize(11);
                doc.text(`Status: ${reportData.overview.status}`);
                doc.text(`Progress: ${reportData.overview.progress}%`);
                doc.text(`Health: ${reportData.overview.health}`);
                doc.moveDown();
            }

            // Add schedule section
            if (reportData.schedule) {
                doc.fontSize(14).text('Schedule', { underline: true });
                doc.fontSize(11);
                doc.text(`Total Tasks: ${reportData.schedule.totalTasks}`);
                doc.text(`Completed Tasks: ${reportData.schedule.completedTasks}`);
                doc.text(`Overdue Tasks: ${reportData.schedule.overdueTasks}`);
                doc.text(`Upcoming Tasks: ${reportData.schedule.upcomingTasks}`);
                doc.moveDown();
            }

            // Add scope section
            if (reportData.scope) {
                doc.fontSize(14).text('Scope', { underline: true });
                doc.fontSize(11);
                doc.text(`Total Requirements: ${reportData.scope.totalRequirements}`);
                doc.text(`Completed Requirements: ${reportData.scope.completedRequirements}`);
                doc.text(`In Progress Requirements: ${reportData.scope.inProgressRequirements}`);
                doc.moveDown();
            }

            // Add risks section
            if (reportData.risks) {
                doc.fontSize(14).text('Risks', { underline: true });
                doc.fontSize(11);
                doc.text(`Total Risks: ${reportData.risks.totalRisks}`);
                doc.text(`Active Risks: ${reportData.risks.activeRisks}`);
                doc.text(`Critical Risks: ${reportData.risks.criticalRisks}`);
                doc.text(`Mitigated Risks: ${reportData.risks.mitigatedRisks}`);
                doc.moveDown();
            }

            // Add team section
            if (reportData.team) {
                doc.fontSize(14).text('Team', { underline: true });
                doc.fontSize(11);
                doc.text(`Total Members: ${reportData.team.totalMembers}`);
                doc.text(`Active Members: ${reportData.team.activeMembers}`);
                doc.moveDown();
            }

            // Add footer
            doc.fontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, {
                align: 'right'
            });

            // Finalize PDF file
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Export report data to Excel
export async function exportToExcel(reportData) {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'Project Management System';
    workbook.created = new Date();
    
    // Create main sheet
    const worksheet = workbook.addWorksheet('Report Summary');
    
    // Set column widths
    worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Notes', key: 'notes', width: 40 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    const rows = [];
    
    // Project Overview
    if (reportData.overview) {
        rows.push(
            { metric: 'Project Status', value: reportData.overview.status, status: reportData.overview.health },
            { metric: 'Project Progress', value: `${reportData.overview.progress}%`, status: getProgressStatus(reportData.overview.progress) },
            { metric: 'Start Date', value: reportData.overview.startDate ? new Date(reportData.overview.startDate).toLocaleDateString() : 'N/A' },
            { metric: 'End Date', value: reportData.overview.endDate ? new Date(reportData.overview.endDate).toLocaleDateString() : 'N/A' }
        );
    }
    
    // Schedule metrics
    if (reportData.schedule) {
        rows.push(
            { metric: 'Total Tasks', value: reportData.schedule.totalTasks },
            { metric: 'Completed Tasks', value: reportData.schedule.completedTasks },
            { metric: 'Overdue Tasks', value: reportData.schedule.overdueTasks, status: reportData.schedule.overdueTasks > 0 ? 'Alert' : 'Good' },
            { metric: 'Upcoming Tasks', value: reportData.schedule.upcomingTasks }
        );
    }
    
    // Scope metrics
    if (reportData.scope) {
        rows.push(
            { metric: 'Total Requirements', value: reportData.scope.totalRequirements },
            { metric: 'Completed Requirements', value: reportData.scope.completedRequirements },
            { metric: 'In Progress Requirements', value: reportData.scope.inProgressRequirements }
        );
    }
    
    // Risk metrics
    if (reportData.risks) {
        rows.push(
            { metric: 'Total Risks', value: reportData.risks.totalRisks },
            { metric: 'Active Risks', value: reportData.risks.activeRisks },
            { metric: 'Critical Risks', value: reportData.risks.criticalRisks, status: reportData.risks.criticalRisks > 0 ? 'Critical' : 'Good' },
            { metric: 'Mitigated Risks', value: reportData.risks.mitigatedRisks }
        );
    }
    
    // Team metrics
    if (reportData.team) {
        rows.push(
            { metric: 'Total Members', value: reportData.team.totalMembers },
            { metric: 'Active Members', value: reportData.team.activeMembers }
        );
    }
    
    worksheet.addRows(rows);
    
    // Apply conditional formatting to status column
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const statusCell = row.getCell(3);
            if (statusCell.value === 'Critical' || statusCell.value === 'red') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFF0000' }
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' } };
            } else if (statusCell.value === 'Alert' || statusCell.value === 'yellow') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFD966' }
                };
            } else if (statusCell.value === 'Good' || statusCell.value === 'green') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF70AD47' }
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' } };
            }
        }
    });
    
    // Add Tasks sheet if task data exists
    if (reportData.tasks && reportData.tasks.length > 0) {
        const tasksSheet = workbook.addWorksheet('Tasks');
        tasksSheet.columns = [
            { header: 'Task Title', key: 'title', width: 40 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Priority', key: 'priority', width: 12 },
            { header: 'Due Date', key: 'due_date', width: 15 },
            { header: 'Assignee', key: 'assignee', width: 20 }
        ];
        
        tasksSheet.getRow(1).font = { bold: true };
        tasksSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        tasksSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        
        const taskRows = reportData.tasks.map(task => ({
            title: task.title,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ? new Date(task.due_date).toLocaleDateString() : '',
            assignee: task.assignee?.name || 'Unassigned'
        }));
        
        tasksSheet.addRows(taskRows);
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

// Export report data to CSV
export async function exportToCSV(reportData) {
    const lines = [];
    lines.push('Metric,Value,Status,Notes');
    
    // Project Overview
    if (reportData.overview) {
        lines.push(`"Project Status","${reportData.overview.status}","${reportData.overview.health}",`);
        lines.push(`"Project Progress","${reportData.overview.progress}%","${getProgressStatus(reportData.overview.progress)}",`);
        lines.push(`"Start Date","${reportData.overview.startDate ? new Date(reportData.overview.startDate).toLocaleDateString() : 'N/A'}",,`);
        lines.push(`"End Date","${reportData.overview.endDate ? new Date(reportData.overview.endDate).toLocaleDateString() : 'N/A'}",,`);
    }
    
    // Schedule metrics
    if (reportData.schedule) {
        lines.push(`"Total Tasks","${reportData.schedule.totalTasks}",,`);
        lines.push(`"Completed Tasks","${reportData.schedule.completedTasks}",,`);
        lines.push(`"Overdue Tasks","${reportData.schedule.overdueTasks}","${reportData.schedule.overdueTasks > 0 ? 'Alert' : 'Good'}",`);
        lines.push(`"Upcoming Tasks","${reportData.schedule.upcomingTasks}",,`);
    }
    
    // Scope metrics
    if (reportData.scope) {
        lines.push(`"Total Requirements","${reportData.scope.totalRequirements}",,`);
        lines.push(`"Completed Requirements","${reportData.scope.completedRequirements}",,`);
        lines.push(`"In Progress Requirements","${reportData.scope.inProgressRequirements}",,`);
    }
    
    // Risk metrics
    if (reportData.risks) {
        lines.push(`"Total Risks","${reportData.risks.totalRisks}",,`);
        lines.push(`"Active Risks","${reportData.risks.activeRisks}",,`);
        lines.push(`"Critical Risks","${reportData.risks.criticalRisks}","${reportData.risks.criticalRisks > 0 ? 'Critical' : 'Good'}",`);
        lines.push(`"Mitigated Risks","${reportData.risks.mitigatedRisks}",,`);
    }
    
    // Team metrics
    if (reportData.team) {
        lines.push(`"Total Members","${reportData.team.totalMembers}",,`);
        lines.push(`"Active Members","${reportData.team.activeMembers}",,`);
    }
    
    // Add task details
    if (reportData.tasks && reportData.tasks.length > 0) {
        lines.push('');
        lines.push('Tasks');
        lines.push('Title,Status,Priority,Due Date,Assignee');
        
        reportData.tasks.forEach(task => {
            const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : '';
            const assignee = task.assignee?.name || 'Unassigned';
            lines.push(`"${task.title}","${task.status}","${task.priority}","${dueDate}","${assignee}"`);
        });
    }
    
    return Buffer.from(lines.join('\n'), 'utf-8');
}

function getProgressStatus(progress) {
    if (progress >= 75) return 'Good';
    if (progress >= 50) return 'On Track';
    if (progress >= 25) return 'Behind';
    return 'Critical';
}