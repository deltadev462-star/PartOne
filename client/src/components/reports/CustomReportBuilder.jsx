import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { 
    Database,
    Table,
    Filter,
    Columns,
    Save,
    Download,
    Plus,
    Trash,
    Edit,
    Eye,
    ChevronRight,
    ChevronDown,
    Settings,
    FileText,
    BarChart3,
    PieChart,
    LineChart,
    Calendar,
    User,
    Tag,
    Flag,
    Clock,
    CheckSquare,
    X,
    RefreshCw,
    Copy,
    Share2,
    Code,
    List,
    Grid,
    Layout,
    Move
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CustomReportBuilder = ({ projectId, isDark }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState('dataSource'); // dataSource, columns, filters, preview
    const [reportName, setReportName] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    
    // Report configuration
    const [reportConfig, setReportConfig] = useState({
        dataSource: '',
        columns: [],
        filters: [],
        groupBy: '',
        sortBy: '',
        sortOrder: 'asc',
        aggregations: [],
        chartType: '',
        layout: 'table'
    });

    // Available data sources
    const dataSources = [
        { id: 'projects', name: t('reports.projects'), icon: Database, color: 'blue' },
        { id: 'tasks', name: t('tasks.title'), icon: CheckSquare, color: 'green' },
        { id: 'requirements', name: t('requirements.title'), icon: FileText, color: 'purple' },
        { id: 'risks', name: t('reports.risks'), icon: Tag, color: 'red' },
        { id: 'stakeholders', name: t('stakeholders.title'), icon: User, color: 'orange' },
        { id: 'milestones', name: t('reports.milestones'), icon: Flag, color: 'yellow' }
    ];

    // Available columns per data source
    const availableColumns = {
        projects: [
            { id: 'name', label: 'Project Name', type: 'text' },
            { id: 'status', label: 'Status', type: 'select' },
            { id: 'priority', label: 'Priority', type: 'select' },
            { id: 'startDate', label: 'Start Date', type: 'date' },
            { id: 'endDate', label: 'End Date', type: 'date' },
            { id: 'budget', label: 'Budget', type: 'number' },
            { id: 'progress', label: 'Progress', type: 'percentage' },
            { id: 'owner', label: 'Owner', type: 'text' },
            { id: 'teamSize', label: 'Team Size', type: 'number' }
        ],
        tasks: [
            { id: 'title', label: 'Task Title', type: 'text' },
            { id: 'status', label: 'Status', type: 'select' },
            { id: 'priority', label: 'Priority', type: 'select' },
            { id: 'assignee', label: 'Assignee', type: 'text' },
            { id: 'dueDate', label: 'Due Date', type: 'date' },
            { id: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
            { id: 'actualHours', label: 'Actual Hours', type: 'number' },
            { id: 'completionRate', label: 'Completion Rate', type: 'percentage' },
            { id: 'tags', label: 'Tags', type: 'text' }
        ],
        requirements: [
            { id: 'id', label: 'Requirement ID', type: 'text' },
            { id: 'title', label: 'Title', type: 'text' },
            { id: 'type', label: 'Type', type: 'select' },
            { id: 'priority', label: 'Priority', type: 'select' },
            { id: 'status', label: 'Status', type: 'select' },
            { id: 'coverage', label: 'Coverage', type: 'percentage' },
            { id: 'testCount', label: 'Test Count', type: 'number' },
            { id: 'taskCount', label: 'Task Count', type: 'number' }
        ],
        risks: [
            { id: 'title', label: 'Risk Title', type: 'text' },
            { id: 'category', label: 'Category', type: 'select' },
            { id: 'severity', label: 'Severity', type: 'select' },
            { id: 'likelihood', label: 'Likelihood', type: 'select' },
            { id: 'impact', label: 'Impact', type: 'number' },
            { id: 'status', label: 'Status', type: 'select' },
            { id: 'owner', label: 'Owner', type: 'text' },
            { id: 'mitigationStrategy', label: 'Mitigation', type: 'text' }
        ],
        stakeholders: [
            { id: 'name', label: 'Name', type: 'text' },
            { id: 'role', label: 'Role', type: 'text' },
            { id: 'category', label: 'Category', type: 'select' },
            { id: 'influence', label: 'Influence', type: 'select' },
            { id: 'interest', label: 'Interest', type: 'select' },
            { id: 'engagement', label: 'Engagement', type: 'percentage' },
            { id: 'satisfaction', label: 'Satisfaction', type: 'number' }
        ],
        milestones: [
            { id: 'name', label: 'Milestone', type: 'text' },
            { id: 'date', label: 'Date', type: 'date' },
            { id: 'status', label: 'Status', type: 'select' },
            { id: 'completion', label: 'Completion', type: 'percentage' },
            { id: 'dependencies', label: 'Dependencies', type: 'number' }
        ]
    };

    // Filter operators
    const filterOperators = {
        text: ['contains', 'equals', 'starts with', 'ends with', 'is empty', 'is not empty'],
        number: ['equals', 'not equals', 'greater than', 'less than', 'between', 'is empty'],
        date: ['equals', 'before', 'after', 'between', 'is empty'],
        select: ['equals', 'not equals', 'in', 'not in', 'is empty'],
        percentage: ['equals', 'greater than', 'less than', 'between']
    };

    // Aggregation functions
    const aggregationFunctions = ['Count', 'Sum', 'Average', 'Min', 'Max', 'Distinct Count'];

    // Chart types
    const chartTypes = [
        { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
        { id: 'pie', name: 'Pie Chart', icon: PieChart },
        { id: 'line', name: 'Line Chart', icon: LineChart },
        { id: 'table', name: 'Table', icon: Table }
    ];

    // Sample data for preview
    const [previewData, setPreviewData] = useState([]);
    const [savedReports, setSavedReports] = useState([]);

    useEffect(() => {
        if (reportConfig.dataSource && reportConfig.columns.length > 0) {
            generatePreviewData();
        }
    }, [reportConfig]);

    useEffect(() => {
        fetchSavedReports();
    }, []);

    const fetchSavedReports = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            // TODO: Replace with actual API call
            // const response = await fetch(`/api/reports/saved`, {
            //     headers: {
            //         Authorization: `Bearer ${token}`
            //     }
            // });
            // const data = await response.json();
            // setSavedReports(data);

            // Simulated saved reports
            setSavedReports([
                {
                    id: 1,
                    name: 'Weekly Task Summary',
                    description: 'Tasks grouped by status and assignee',
                    dataSource: 'tasks',
                    createdAt: '2024-11-25',
                    lastRun: '2024-11-29'
                },
                {
                    id: 2,
                    name: 'Risk Dashboard',
                    description: 'High priority risks by category',
                    dataSource: 'risks',
                    createdAt: '2024-11-20',
                    lastRun: '2024-11-28'
                },
                {
                    id: 3,
                    name: 'Requirements Coverage',
                    description: 'Requirements with test coverage metrics',
                    dataSource: 'requirements',
                    createdAt: '2024-11-15',
                    lastRun: '2024-11-27'
                }
            ]);
        } catch (error) {
            console.error('Error fetching saved reports:', error);
        }
    };

    const generatePreviewData = () => {
        // Generate sample data based on selected columns
        const sampleData = [];
        for (let i = 0; i < 10; i++) {
            const row = {};
            reportConfig.columns.forEach(col => {
                const column = availableColumns[reportConfig.dataSource]?.find(c => c.id === col);
                if (column) {
                    switch (column.type) {
                        case 'text':
                            row[col] = `Sample ${column.label} ${i + 1}`;
                            break;
                        case 'number':
                            row[col] = Math.floor(Math.random() * 100);
                            break;
                        case 'percentage':
                            row[col] = Math.floor(Math.random() * 100);
                            break;
                        case 'date':
                            row[col] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
                            break;
                        case 'select':
                            row[col] = ['Option A', 'Option B', 'Option C'][Math.floor(Math.random() * 3)];
                            break;
                        default:
                            row[col] = 'Sample Data';
                    }
                }
            });
            sampleData.push(row);
        }
        setPreviewData(sampleData);
    };

    const handleAddColumn = (columnId) => {
        if (!reportConfig.columns.includes(columnId)) {
            setReportConfig({
                ...reportConfig,
                columns: [...reportConfig.columns, columnId]
            });
        }
    };

    const handleRemoveColumn = (columnId) => {
        setReportConfig({
            ...reportConfig,
            columns: reportConfig.columns.filter(col => col !== columnId)
        });
    };

    const handleMoveColumn = (columnId, direction) => {
        const index = reportConfig.columns.indexOf(columnId);
        if (index === -1) return;

        const newColumns = [...reportConfig.columns];
        if (direction === 'up' && index > 0) {
            [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
        } else if (direction === 'down' && index < newColumns.length - 1) {
            [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
        }
        setReportConfig({ ...reportConfig, columns: newColumns });
    };

    const handleAddFilter = () => {
        const newFilter = {
            id: Date.now(),
            column: '',
            operator: '',
            value: '',
            conjunction: reportConfig.filters.length > 0 ? 'AND' : null
        };
        setReportConfig({
            ...reportConfig,
            filters: [...reportConfig.filters, newFilter]
        });
    };

    const handleUpdateFilter = (filterId, field, value) => {
        setReportConfig({
            ...reportConfig,
            filters: reportConfig.filters.map(filter =>
                filter.id === filterId ? { ...filter, [field]: value } : filter
            )
        });
    };

    const handleRemoveFilter = (filterId) => {
        setReportConfig({
            ...reportConfig,
            filters: reportConfig.filters.filter(filter => filter.id !== filterId)
        });
    };

    const handleSaveReport = async () => {
        if (!reportName) {
            toast.error(t('reports.enterReportName'));
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // TODO: Implement actual save functionality
            // const response = await fetch('/api/reports/save', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         Authorization: `Bearer ${token}`
            //     },
            //     body: JSON.stringify({
            //         name: reportName,
            //         description: reportDescription,
            //         config: reportConfig,
            //         projectId
            //     })
            // });

            toast.success(t('reports.saveSuccess'));
            fetchSavedReports();
        } catch (error) {
            toast.error(t('reports.saveError'));
        }
    };

    const handleLoadReport = (report) => {
        setReportName(report.name);
        setReportDescription(report.description);
        // TODO: Load report configuration
        toast.success(t('reports.loadedReport', { name: report.name }));
    };

    const handleExportReport = async (format) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // TODO: Implement actual export functionality
            toast.success(`Report exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { id: 'dataSource', label: t('reports.dataSource'), icon: Database },
            { id: 'columns', label: t('reports.columns'), icon: Columns },
            { id: 'filters', label: t('reports.filters'), icon: Filter },
            { id: 'preview', label: t('reports.preview'), icon: Eye }
        ];

        return (
            <div className="flex items-center justify-between mb-6">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <button
                            onClick={() => setActiveStep(step.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                activeStep === step.id
                                    ? 'bg-blue-500 text-white'
                                    : `${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 dark:hover:bg-gray-700`
                            }`}
                        >
                            <step.icon className="h-4 w-4" />
                            <span className="hidden md:inline">{step.label}</span>
                        </button>
                        {index < steps.length - 1 && (
                            <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Report Builder Header */}
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {t('reports.customReportBuilder')}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExportReport('excel')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                            <Download className="h-4 w-4" />
                            {t('reports.export')}
                        </button>
                        <button
                            onClick={handleSaveReport}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                        >
                            <Save className="h-4 w-4" />
                            {t('common.save')}
                        </button>
                    </div>
                </div>

                {/* Report Name and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder={t('reports.reportName')}
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className={`px-3 py-2 rounded-lg border ${
                            isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'
                        } focus:outline-none`}
                    />
                    <input
                        type="text"
                        placeholder={t('reports.reportDescription')}
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className={`px-3 py-2 rounded-lg border ${
                            isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'
                        } focus:outline-none`}
                    />
                </div>

                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Step Content */}
                <div className="mt-6">
                    {/* Data Source Selection */}
                    {activeStep === 'dataSource' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('reports.selectDataSource')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dataSources.map((source) => (
                                    <button
                                        key={source.id}
                                        onClick={() => setReportConfig({ ...reportConfig, dataSource: source.id, columns: [] })}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            reportConfig.dataSource === source.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <source.icon className={`h-8 w-8 mb-2 mx-auto text-${source.color}-500`} />
                                        <p className="font-medium">{source.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Column Selection */}
                    {activeStep === 'columns' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('reports.selectColumns')}</h3>
                            {reportConfig.dataSource ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Available Columns */}
                                    <div>
                                        <h4 className="font-medium mb-2">{t('reports.availableColumns')}</h4>
                                        <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} max-h-96 overflow-y-auto`}>
                                            {availableColumns[reportConfig.dataSource]?.map((column) => (
                                                <div
                                                    key={column.id}
                                                    className={`flex items-center justify-between p-2 mb-2 rounded ${
                                                        reportConfig.columns.includes(column.id)
                                                            ? 'bg-gray-200 dark:bg-gray-700 opacity-50'
                                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <span className="text-sm">{column.label}</span>
                                                    <button
                                                        onClick={() => handleAddColumn(column.id)}
                                                        disabled={reportConfig.columns.includes(column.id)}
                                                        className="text-blue-500 hover:text-blue-600 disabled:opacity-50"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Selected Columns */}
                                    <div>
                                        <h4 className="font-medium mb-2">{t('reports.selectedColumns')}</h4>
                                        <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-96`}>
                                            {reportConfig.columns.length === 0 ? (
                                                <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {t('reports.noColumnsSelected')}
                                                </p>
                                            ) : (
                                                reportConfig.columns.map((columnId, index) => {
                                                    const column = availableColumns[reportConfig.dataSource]?.find(c => c.id === columnId);
                                                    return column ? (
                                                        <div
                                                            key={columnId}
                                                            className="flex items-center justify-between p-2 mb-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            <span className="text-sm">{column.label}</span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleMoveColumn(columnId, 'up')}
                                                                    disabled={index === 0}
                                                                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                                                >
                                                                    <ChevronDown className="h-4 w-4 rotate-180" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMoveColumn(columnId, 'down')}
                                                                    disabled={index === reportConfig.columns.length - 1}
                                                                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                                                >
                                                                    <ChevronDown className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveColumn(columnId)}
                                                                    className="text-red-500 hover:text-red-600 ml-2"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null;
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.selectDataSourceFirst')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Filters */}
                    {activeStep === 'filters' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{t('reports.configureFilters')}</h3>
                                <button
                                    onClick={handleAddFilter}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('reports.addFilter')}
                                </button>
                            </div>
                            {reportConfig.dataSource && reportConfig.columns.length > 0 ? (
                                <div className="space-y-3">
                                    {reportConfig.filters.length === 0 ? (
                                        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('reports.noFilters')}
                                        </p>
                                    ) : (
                                        reportConfig.filters.map((filter, index) => (
                                            <div key={filter.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                                {index > 0 && (
                                                    <select
                                                        value={filter.conjunction}
                                                        onChange={(e) => handleUpdateFilter(filter.id, 'conjunction', e.target.value)}
                                                        className={`mb-3 px-2 py-1 rounded border text-sm ${
                                                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="AND">{t('reports.and')}</option>
                                                        <option value="OR">{t('reports.or')}</option>
                                                    </select>
                                                )}
                                                <div className="flex gap-2 items-center">
                                                    <select
                                                        value={filter.column}
                                                        onChange={(e) => handleUpdateFilter(filter.id, 'column', e.target.value)}
                                                        className={`flex-1 px-3 py-2 rounded border ${
                                                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="">{t('reports.selectColumn')}</option>
                                                        {reportConfig.columns.map(colId => {
                                                            const column = availableColumns[reportConfig.dataSource]?.find(c => c.id === colId);
                                                            return column ? (
                                                                <option key={colId} value={colId}>{column.label}</option>
                                                            ) : null;
                                                        })}
                                                    </select>
                                                    <select
                                                        value={filter.operator}
                                                        onChange={(e) => handleUpdateFilter(filter.id, 'operator', e.target.value)}
                                                        className={`px-3 py-2 rounded border ${
                                                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="">{t('reports.operator')}</option>
                                                        {filter.column && (() => {
                                                            const column = availableColumns[reportConfig.dataSource]?.find(c => c.id === filter.column);
                                                            return filterOperators[column?.type]?.map(op => (
                                                                <option key={op} value={op}>{op}</option>
                                                            ));
                                                        })()}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder={t('reports.value')}
                                                        value={filter.value}
                                                        onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                                                        className={`flex-1 px-3 py-2 rounded border ${
                                                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveFilter(filter.id)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.configureColumnsFirst')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Preview */}
                    {activeStep === 'preview' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{t('reports.reportPreview')}</h3>
                                <div className="flex gap-2">
                                    {chartTypes.map((chart) => (
                                        <button
                                            key={chart.id}
                                            onClick={() => setReportConfig({ ...reportConfig, layout: chart.id })}
                                            className={`p-2 rounded ${
                                                reportConfig.layout === chart.id
                                                    ? 'bg-blue-500 text-white'
                                                    : `${isDark ? 'bg-gray-800' : 'bg-gray-100'} hover:bg-gray-200 dark:hover:bg-gray-700`
                                            }`}
                                            title={chart.name}
                                        >
                                            <chart.icon className="h-4 w-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {reportConfig.dataSource && reportConfig.columns.length > 0 ? (
                                <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                    {reportConfig.layout === 'table' ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                                        {reportConfig.columns.map(colId => {
                                                            const column = availableColumns[reportConfig.dataSource]?.find(c => c.id === colId);
                                                            return column ? (
                                                                <th key={colId} className="px-4 py-2 text-left text-sm font-medium">
                                                                    {column.label}
                                                                </th>
                                                            ) : null;
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewData.map((row, index) => (
                                                        <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                                            {reportConfig.columns.map(colId => (
                                                                <td key={colId} className="px-4 py-2 text-sm">
                                                                    {row[colId]}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {t('reports.chartPreviewNotAvailable')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.configureReportFirst')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Saved Reports */}
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <h3 className="text-lg font-semibold mb-4">{t('reports.savedReports')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedReports.map((report) => (
                        <div
                            key={report.id}
                            className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'} hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="font-medium">{report.name}</h4>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {report.description}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleLoadReport(report)}
                                        className="text-blue-500 hover:text-blue-600"
                                        title="Load Report"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="text-green-500 hover:text-green-600"
                                        title="Run Report"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-600"
                                        title="Delete Report"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                <p>Created: {report.createdAt}</p>
                                <p>Last Run: {report.lastRun}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomReportBuilder;