import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { 
    Layout,
    BarChart3,
    PieChart,
    LineChart,
    TrendingUp,
    TrendingDown,
    Activity,
    Users,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Calendar,
    DollarSign,
    FileText,
    Settings,
    Download,
    Printer,
    RefreshCw,
    Maximize2,
    Grid,
    Move,
    Plus,
    X,
    ChevronUp,
    ChevronDown,
    MoreVertical,
    Gauge,
    Package,
    Shield,
    Star,
    Flag,
    Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManagementDashboard = ({ projectId, isDark }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedWidgets, setSelectedWidgets] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);

    // Available widgets for the dashboard
    const availableWidgets = [
        { id: 'projectHealth', name: t('reports.widgetNames.projectHealth'), icon: Gauge, size: 'small', color: 'blue' },
        { id: 'taskSummary', name: t('reports.widgetNames.taskSummary'), icon: CheckCircle, size: 'medium', color: 'green' },
        { id: 'riskOverview', name: t('reports.widgetNames.riskOverview'), icon: AlertTriangle, size: 'medium', color: 'red' },
        { id: 'budgetStatus', name: t('reports.widgetNames.budgetStatus'), icon: DollarSign, size: 'small', color: 'yellow' },
        { id: 'teamPerformance', name: t('reports.widgetNames.teamPerformance'), icon: Users, size: 'large', color: 'purple' },
        { id: 'milestones', name: t('reports.widgetNames.milestones'), icon: Flag, size: 'medium', color: 'orange' },
        { id: 'requirementsCoverage', name: t('reports.widgetNames.requirementsCoverage'), icon: Target, size: 'medium', color: 'indigo' },
        { id: 'stakeholderSatisfaction', name: t('reports.widgetNames.stakeholderSatisfaction'), icon: Star, size: 'small', color: 'pink' },
        { id: 'projectTimeline', name: t('reports.widgetNames.projectTimeline'), icon: Calendar, size: 'large', color: 'teal' },
        { id: 'issueTracker', name: t('reports.widgetNames.issueTracker'), icon: Shield, size: 'medium', color: 'gray' },
        { id: 'velocityChart', name: t('reports.widgetNames.velocityChart'), icon: LineChart, size: 'large', color: 'cyan' },
        { id: 'resourceUtilization', name: t('reports.widgetNames.resourceUtilization'), icon: Package, size: 'medium', color: 'lime' }
    ];

    // Default widget layout
    const defaultLayout = [
        'projectHealth',
        'taskSummary',
        'riskOverview',
        'budgetStatus',
        'teamPerformance',
        'milestones'
    ];

    useEffect(() => {
        const savedLayout = localStorage.getItem('dashboardLayout');
        if (savedLayout) {
            setSelectedWidgets(JSON.parse(savedLayout));
        } else {
            setSelectedWidgets(defaultLayout);
        }
        fetchDashboardData();
    }, [projectId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            // TODO: Replace with actual API call
            // const response = await fetch(`/api/reports/dashboard/${projectId}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}`
            //     }
            // });
            // const data = await response.json();
            // setDashboardData(data);

            // Simulated dashboard data
            setDashboardData({
                projectHealth: {
                    overall: 85,
                    schedule: 90,
                    budget: 80,
                    quality: 88,
                    risks: 75
                },
                taskSummary: {
                    total: 156,
                    completed: 98,
                    inProgress: 32,
                    pending: 21,
                    overdue: 5,
                    todaysDue: 3,
                    thisWeekDue: 12
                },
                riskOverview: {
                    total: 15,
                    critical: 2,
                    high: 4,
                    medium: 6,
                    low: 3,
                    mitigated: 8,
                    active: 7
                },
                budgetStatus: {
                    total: 100000,
                    spent: 65000,
                    remaining: 35000,
                    projected: 98000,
                    variance: -2000,
                    burnRate: 2500
                },
                teamPerformance: {
                    members: [
                        { name: 'John Doe', tasks: 28, completed: 22, productivity: 92 },
                        { name: 'Jane Smith', tasks: 24, completed: 18, productivity: 88 },
                        { name: 'Bob Johnson', tasks: 32, completed: 25, productivity: 85 },
                        { name: 'Alice Brown', tasks: 20, completed: 15, productivity: 90 },
                        { name: 'Charlie Wilson', tasks: 18, completed: 12, productivity: 82 }
                    ],
                    averageProductivity: 87.4,
                    velocityTrend: 'increasing'
                },
                milestones: [
                    { name: 'Phase 1 Complete', date: '2024-03-31', status: 'completed', progress: 100 },
                    { name: 'Phase 2 Complete', date: '2024-06-30', status: 'completed', progress: 100 },
                    { name: 'Phase 3 Complete', date: '2024-09-30', status: 'in_progress', progress: 65 },
                    { name: 'Project Complete', date: '2024-12-31', status: 'pending', progress: 0 }
                ],
                requirementsCoverage: {
                    total: 85,
                    covered: 68,
                    partial: 12,
                    uncovered: 5,
                    percentage: 80
                },
                stakeholderSatisfaction: {
                    score: 4.2,
                    trend: 'increasing',
                    responseRate: 75,
                    totalStakeholders: 24,
                    activelyEngaged: 18
                },
                projectTimeline: {
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    currentDate: '2024-11-29',
                    daysElapsed: 333,
                    daysRemaining: 32,
                    progressPercentage: 91
                },
                issueTracker: {
                    open: 8,
                    inProgress: 5,
                    resolved: 45,
                    closed: 38,
                    critical: 2,
                    avgResolutionTime: 3.5
                },
                velocityChart: {
                    data: [
                        { sprint: 'Sprint 1', planned: 20, actual: 18 },
                        { sprint: 'Sprint 2', planned: 22, actual: 21 },
                        { sprint: 'Sprint 3', planned: 25, actual: 23 },
                        { sprint: 'Sprint 4', planned: 24, actual: 26 },
                        { sprint: 'Sprint 5', planned: 26, actual: 24 }
                    ]
                },
                resourceUtilization: {
                    development: 85,
                    design: 70,
                    testing: 90,
                    management: 60,
                    overall: 76
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error(t('reports.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddWidget = (widgetId) => {
        if (!selectedWidgets.includes(widgetId)) {
            const newLayout = [...selectedWidgets, widgetId];
            setSelectedWidgets(newLayout);
            localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
        }
    };

    const handleRemoveWidget = (widgetId) => {
        if (window.confirm(t('reports.confirmDeleteWidget'))) {
            const newLayout = selectedWidgets.filter(id => id !== widgetId);
            setSelectedWidgets(newLayout);
            localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
        }
    };

    const handleMoveWidget = (widgetId, direction) => {
        const index = selectedWidgets.indexOf(widgetId);
        if (index === -1) return;

        const newLayout = [...selectedWidgets];
        if (direction === 'up' && index > 0) {
            [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
        } else if (direction === 'down' && index < newLayout.length - 1) {
            [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
        }
        
        setSelectedWidgets(newLayout);
        localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // TODO: Implement actual export
            toast.success('Dashboard exported successfully');
        } catch (error) {
            toast.error('Failed to export dashboard');
        }
    };

    const renderWidget = (widgetId) => {
        const widget = availableWidgets.find(w => w.id === widgetId);
        if (!widget || !dashboardData) return null;

        const data = dashboardData[widgetId];
        const Icon = widget.icon;

        switch (widgetId) {
            case 'projectHealth':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-2">{data.overall}%</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>{t('reports.schedule')}: {data.schedule}%</div>
                                <div>{t('reports.budgetUtilization').split(' ')[0]}: {data.budget}%</div>
                                <div>Quality: {data.quality}%</div>
                                <div>{t('reports.risks')}: {data.risks}%</div>
                            </div>
                        </div>
                    </div>
                );

            case 'taskSummary':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-500">{data.completed}</p>
                                <p className="text-xs text-gray-500">{t('reports.completed')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-500">{data.inProgress}</p>
                                <p className="text-xs text-gray-500">{t('reports.inProgress')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-500">{data.pending}</p>
                                <p className="text-xs text-gray-500">{t('reports.pending')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">{data.overdue}</p>
                                <p className="text-xs text-gray-500">{t('reports.overdue')}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t dark:border-gray-700">
                            <p className="text-sm">Today's Due: <span className="font-bold">{data.todaysDue}</span></p>
                            <p className="text-sm">This Week: <span className="font-bold">{data.thisWeekDue}</span></p>
                        </div>
                    </div>
                );

            case 'riskOverview':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>{t('reports.critical')}</span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded text-sm">
                                    {data.critical}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{t('reports.high')}</span>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded text-sm">
                                    {data.high}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{t('reports.medium')}</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-sm">
                                    {data.medium}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{t('reports.low')}</span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-sm">
                                    {data.low}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between">
                            <span className="text-sm">Active: {data.active}</span>
                            <span className="text-sm">{t('reports.mitigated')}: {data.mitigated}</span>
                        </div>
                    </div>
                );

            case 'budgetStatus':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold mb-2">
                                ${(data.spent / 1000).toFixed(0)}k / ${(data.total / 1000).toFixed(0)}k
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                                <div 
                                    className="bg-yellow-500 h-3 rounded-full"
                                    style={{ width: `${(data.spent / data.total) * 100}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>{t('reports.remaining')}: ${(data.remaining / 1000).toFixed(0)}k</div>
                                <div>{t('reports.burnRate')}: ${data.burnRate}{t('reports.perDay')}</div>
                            </div>
                        </div>
                    </div>
                );

            case 'teamPerformance':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span>{t('reports.averageProductivity')}</span>
                                <span className="font-bold">{data.averageProductivity}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {data.velocityTrend === 'increasing' ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm capitalize">{t(`reports.${data.velocityTrend}`)}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {data.members.slice(0, 3).map((member, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm">{member.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{member.completed}/{member.tasks}</span>
                                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div 
                                                className="bg-purple-500 h-2 rounded-full"
                                                style={{ width: `${member.productivity}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'milestones':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {data.map((milestone, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">{milestone.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            milestone.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            milestone.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                               {milestone.status === 'completed' ? t('reports.completed') :
                                                milestone.status === 'in_progress' ? t('reports.inProgress') :
                                                t('reports.pending')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${
                                                    milestone.status === 'completed' ? 'bg-green-500' :
                                                    milestone.status === 'in_progress' ? 'bg-yellow-500' :
                                                    'bg-gray-400'
                                                }`}
                                                style={{ width: `${milestone.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-xs">{milestone.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'stakeholderSatisfaction':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                                {data.score}/5
                                <Star className="h-6 w-6 text-yellow-500 fill-current" />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-3">
                                {data.trend === 'increasing' ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm capitalize">{t(`reports.${data.trend}`)}</span>
                            </div>
                            <div className="text-sm space-y-1">
                                <p>{t('reports.responseRate')}: {data.responseRate}%</p>
                                <p>{t('reports.engaged')}: {data.activelyEngaged}/{data.totalStakeholders}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'requirementsCoverage':
                return (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Icon className={`h-5 w-5 text-${widget.color}-500`} />
                                {widget.name}
                            </h3>
                            {editMode && (
                                <button onClick={() => handleRemoveWidget(widgetId)} className="text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div>
                            <div className="text-center mb-3">
                                <div className="text-2xl font-bold">{data.percentage}%</div>
                                <p className="text-sm text-gray-500">{t('reports.coverage')}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold text-green-500">{data.covered}</p>
                                    <p className="text-xs">{t('reports.fullyCovered').split(' ')[1]}</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-yellow-500">{data.partial}</p>
                                    <p className="text-xs">{t('reports.partialCoverage').split(' ')[0]}</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-red-500">{data.uncovered}</p>
                                    <p className="text-xs">{t('reports.noCoverage').split(' ')[1]}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="grid col-span-1 md:flex items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        {t('reports.managementDashboard')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchDashboardData}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Print"
                        >
                            <Printer className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleExport}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Export"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`px-3 py-2 rounded flex items-center gap-2 ${
                                editMode 
                                    ? 'bg-blue-600 text-white' 
                                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Settings className="h-4 w-4" />
                            {editMode ? 'Done' : 'Customize'}
                        </button>
                    </div>
                </div>

                {/* Widget Selector (shown in edit mode) */}
                {editMode && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <h3 className="font-medium mb-3">{t('reports.availableWidgets')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {availableWidgets.map((widget) => {
                                const isSelected = selectedWidgets.includes(widget.id);
                                const WidgetIcon = widget.icon;
                                return (
                                    <button
                                        key={widget.id}
                                        onClick={() => isSelected ? handleRemoveWidget(widget.id) : handleAddWidget(widget.id)}
                                        className={`p-3 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                                            isSelected
                                                ? 'bg-blue-500 text-white'
                                                : `${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`
                                        }`}
                                   >
                                       <WidgetIcon className={`h-4 w-4 text-${widget.color}-500 ${isSelected ? 'text-white' : ''}`} />
                                       {t(`reports.widgetNames.${widget.id}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedWidgets.map((widgetId) => {
                    const widget = availableWidgets.find(w => w.id === widgetId);
                    if (!widget) return null;
                    
                    const colSpan = widget.size === 'large' ? 'md:col-span-2' : 
                                   widget.size === 'medium' ? 'lg:col-span-1' : '';
                    
                    return (
                        <div key={widgetId} className={colSpan}>
                            {renderWidget(widgetId)}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {selectedWidgets.length === 0 && (
                <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <Grid className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">{t('reports.noWidgetsSelected')}</h3>
                    <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('reports.clickCustomizeToAddWidgets')}
                    </p>
                    <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {t('reports.customizeDashboard')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManagementDashboard;