import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import {
    CheckCircle,
    Circle,
    Clock,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    AlertTriangle,
    List,
    Grid,
    ChevronRight,
    Filter,
    User,
    Tag,
    Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import reportService from '../../services/reportService';

const TaskProgressReport = ({ projectId, filters, isDark, data }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('summary'); // summary, byStatus, byAssignee, byPriority
    const [reportData, setReportData] = useState({
        summary: {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 0,
            averageCompletionTime: 0,
            tasksCreatedThisPeriod: 0,
            tasksCompletedThisPeriod: 0
        },
        byStatus: {
            todo: { count: 0, percentage: 0, tasks: [] },
            inProgress: { count: 0, percentage: 0, tasks: [] },
            inReview: { count: 0, percentage: 0, tasks: [] },
            completed: { count: 0, percentage: 0, tasks: [] },
            cancelled: { count: 0, percentage: 0, tasks: [] }
        },
        byAssignee: [],
        byPriority: {
            high: { count: 0, percentage: 0, tasks: [] },
            medium: { count: 0, percentage: 0, tasks: [] },
            low: { count: 0, percentage: 0, tasks: [] }
        },
        overdueList: [],
        upcomingDeadlines: [],
        recentlyCompleted: [],
        taskTrends: {
            daily: [],
            weekly: []
        },
        performanceMetrics: {
            onTimeDelivery: 0,
            averageTaskAge: 0,
            velocityTrend: 'stable',
            blockedTasks: 0,
            reworkRate: 0
        }
    });

    useEffect(() => {
        if (projectId && data) {
            // If data is passed from parent, use it directly
            setReportData(data);
        } else if (projectId && !data) {
            // Only fetch if we have a projectId but no data passed from parent
            fetchReportData();
        }
    }, [projectId, filters, data]);

    const fetchReportData = async () => {
        if (data) {
            // If data is passed from parent, use it directly
            setReportData(data);
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // Fetch actual data from API
            const reportData = await reportService.getTaskProgressReport(projectId, filters, token);
            setReportData(reportData || {});
        } catch (error) {
            console.error('Error fetching task progress report:', error);
            toast.error(t('reports.fetchError'));
            setReportData({});
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            todo: 'gray',
            inProgress: 'blue',
            inReview: 'purple',
            completed: 'green',
            cancelled: 'red'
        };
        return colors[status] || 'gray';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'red',
            medium: 'yellow',
            low: 'green'
        };
        return colors[priority.toLowerCase()] || 'gray';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Ensure we have default values to prevent undefined errors
    const {
        summary = {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 0,
            averageCompletionTime: 0,
            tasksCreatedThisPeriod: 0,
            tasksCompletedThisPeriod: 0
        },
        byStatus = {
            todo: { count: 0, percentage: 0, tasks: [] },
            inProgress: { count: 0, percentage: 0, tasks: [] },
            inReview: { count: 0, percentage: 0, tasks: [] },
            completed: { count: 0, percentage: 0, tasks: [] },
            cancelled: { count: 0, percentage: 0, tasks: [] }
        },
        byAssignee = [],
        byPriority = {
            high: { count: 0, percentage: 0, tasks: [] },
            medium: { count: 0, percentage: 0, tasks: [] },
            low: { count: 0, percentage: 0, tasks: [] }
        },
        overdueList = [],
        upcomingDeadlines = [],
        recentlyCompleted = [],
        taskTrends = {
            daily: [],
            weekly: []
        },
        performanceMetrics = {
            onTimeDelivery: 0,
            averageTaskAge: 0,
            velocityTrend: 'stable',
            blockedTasks: 0,
            reworkRate: 0
        }
    } = reportData || {};

    return (
        <div className="p-6">
            {/* Report Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('reports.taskProgressReport')}</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('reports.generatedOn')}: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`rounded-lg p-4  shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.totalTasks')}
                            </p>
                            <p className="text-2xl font-bold">{summary.totalTasks}</p>
                        </div>
                        <List className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.completed')}
                            </p>
                            <p className="text-2xl font-bold text-green-500">{summary.completedTasks}</p>
                            <p className="text-xs">{summary.completionRate}%</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.inProgress')}
                            </p>
                            <p className="text-2xl font-bold text-blue-500">{summary.inProgressTasks}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.overdue')}
                            </p>
                            <p className="text-2xl font-bold text-red-500">{summary.overdueTasks}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2 mb-6">
                {['summary', 'byStatus', 'byAssignee', 'byPriority'].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            viewMode === mode
                                ? 'bg-blue-500 text-white'
                                : `${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 dark:hover:bg-gray-700`
                        }`}
                    >
                        {t(`reports.view.${mode}`)}
                    </button>
                ))}
            </div>

            {/* Content based on view mode */}
            {viewMode === 'summary' && (
                <div className="space-y-6">
                    {/* Performance Metrics */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            {t('reports.performanceMetrics')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.onTimeDelivery')}
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xl font-bold">{performanceMetrics.onTimeDelivery}%</p>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${performanceMetrics.onTimeDelivery}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.averageTaskAge')}
                                </p>
                                <p className="text-xl font-bold">{performanceMetrics.averageTaskAge} days</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.velocityTrend')}
                                </p>
                                <div className="flex items-center gap-2">
                                    {performanceMetrics.velocityTrend === 'increasing' ? (
                                        <TrendingUp className="h-5 w-5 text-green-500" />
                                    ) : performanceMetrics.velocityTrend === 'decreasing' ? (
                                        <TrendingDown className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <Activity className="h-5 w-5 text-gray-500" />
                                    )}
                                    <p className="text-xl font-bold capitalize">{performanceMetrics.velocityTrend}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overdue Tasks */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            {t('reports.overdueTasks')}
                        </h3>
                        <div className="space-y-3">
                            {overdueList && overdueList.length > 0 ? overdueList.map((task, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{task.title}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {task.assignee} • {task.daysOverdue} days overdue
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        task.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            )) : (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.noOverdueTasks') || 'No overdue tasks'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {t('reports.upcomingDeadlines')}
                        </h3>
                        <div className="space-y-3">
                            {upcomingDeadlines && upcomingDeadlines.length > 0 ? upcomingDeadlines.map((task, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {task.assignee} • {t('reports.dueDate')}: {task.dueDate}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        task.daysUntilDue <= 2 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                        task.daysUntilDue <= 5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                        {task.daysUntilDue} {t('reports.daysUntilDue')}
                                    </span>
                                </div>
                            )) : (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.noUpcomingDeadlines') || 'No upcoming deadlines'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'byStatus' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4">{t('reports.tasksByStatus')}</h3>
                    <div className="space-y-4">
                        {Object.entries(byStatus).map(([status, data]) => (
                            <div key={status}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium capitalize">{status}</span>
                                    <span>{data.count} ({data.percentage}%)</span>
                                </div>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div 
                                        className={`bg-${getStatusColor(status)}-500 h-3 rounded-full`}
                                        style={{ width: `${data.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'byAssignee' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4">{t('reports.tasksByAssignee')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className="text-left py-2">{t('reports.assignee')}</th>
                                    <th className="text-center py-2">{t('reports.total')}</th>
                                    <th className="text-center py-2">{t('reports.completed')}</th>
                                    <th className="text-center py-2">{t('reports.inProgress')}</th>
                                    <th className="text-center py-2">{t('reports.pending')}</th>
                                    <th className="text-center py-2">{t('reports.overdue')}</th>
                                    <th className="text-center py-2">{t('reports.completionRate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {byAssignee && byAssignee.length > 0 ? byAssignee.map((assignee, index) => (
                                    <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <td className="py-3 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {assignee.name}
                                        </td>
                                        <td className="text-center py-3">{assignee.totalTasks}</td>
                                        <td className="text-center py-3 text-green-500">{assignee.completed}</td>
                                        <td className="text-center py-3 text-blue-500">{assignee.inProgress}</td>
                                        <td className="text-center py-3 text-gray-500">{assignee.pending}</td>
                                        <td className="text-center py-3 text-red-500">{assignee.overdue}</td>
                                        <td className="text-center py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>{assignee.completionRate}%</span>
                                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${assignee.completionRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {t('reports.noAssigneeData') || 'No assignee data available'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'byPriority' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4">{t('reports.tasksByPriority')}</h3>
                    <div className="space-y-4">
                        {Object.entries(byPriority).map(([priority, data]) => (
                            <div key={priority}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Flag className={`h-4 w-4 text-${getPriorityColor(priority)}-500`} />
                                        <span className="font-medium capitalize">{priority} {t('reports.priority')}</span>
                                    </div>
                                    <span>{data.count} ({data.percentage}%)</span>
                                </div>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div 
                                        className={`bg-${getPriorityColor(priority)}-500 h-3 rounded-full`}
                                        style={{ width: `${data.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskProgressReport;