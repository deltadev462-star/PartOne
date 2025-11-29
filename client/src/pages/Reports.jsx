import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import {
    FileText,
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Plus,
    Search,
    Filter,
    Calendar,
    Users,
    CheckSquare,
    AlertTriangle,
    Target,
    Activity,
    Grid,
    List,
    Settings,
    Save,
    Share2,
    Eye,
    Edit,
    Trash,
    FolderOpen,
    ArrowRight,
    Clock,
    ChevronRight,
    DollarSign,
    Gauge,
    Layout,
    Database,
    FileSpreadsheet,
    Mail,
    Printer,
    RefreshCw,
    ChevronDown
} from 'lucide-react';

// Import report components
import ProjectStatusReport from '../components/reports/ProjectStatusReport';
import TaskProgressReport from '../components/reports/TaskProgressReport';
import RequirementsCoverageReport from '../components/reports/RequirementsCoverageReport';
import StakeholderEngagementReport from '../components/reports/StakeholderEngagementReport';
import CustomReportBuilder from '../components/reports/CustomReportBuilder';
import SavedReports from '../components/reports/SavedReports';
import ManagementDashboard from '../components/reports/ManagementDashboard';

import reportService from '../services/reportService';

const Reports = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const isDark = useSelector((state) => state.theme.theme === 'dark');
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);
    
    const [activeTab, setActiveTab] = useState('standard');
    const [activeReport, setActiveReport] = useState('projectStatus');
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    
    // Filter state for reports
    const [filters, setFilters] = useState({
        dateRange: '30days',
        startDate: null,
        endDate: null,
        status: '',
        priority: '',
        assignee: '',
        category: ''
    });
    
    // Report types configuration
    const standardReports = [
        {
            id: 'projectStatus',
            name: t('reports.projectStatusReport'),
            description: t('reports.projectStatusDesc'),
            icon: Gauge,
            color: 'blue'
        },
        {
            id: 'taskProgress',
            name: t('reports.taskProgressReport'),
            description: t('reports.taskProgressDesc'),
            icon: CheckSquare,
            color: 'green'
        },
        {
            id: 'requirementsCoverage',
            name: t('reports.requirementsCoverageReport'),
            description: t('reports.requirementsCoverageDesc'),
            icon: Target,
            color: 'purple'
        },
        {
            id: 'stakeholderEngagement',
            name: t('reports.stakeholderEngagementReport'),
            description: t('reports.stakeholderEngagementDesc'),
            icon: Users,
            color: 'orange'
        }
    ];
    
    // Statistics for overview
    const [stats, setStats] = useState({
        totalReports: 0,
        savedReports: 0,
        scheduledReports: 0,
        lastGenerated: null
    });

    useEffect(() => {
        if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [projectId]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchStatistics();
            // Don't automatically fetch report data on mount - wait for user to click Generate Report
            // if (activeReport) {
            //     fetchReportData();
            // }
        }
    }, [selectedProjectId]);

    const fetchStatistics = async () => {
        try {
            const token = await getToken();
            if (!token) {
                return;
            }
            
            const statistics = await reportService.getReportStatistics(selectedProjectId, token);
            setStats(statistics);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const fetchReportData = async () => {
        // Ensure we have required data before fetching
        if (!selectedProjectId) {
            toast.error(t('reports.selectProject'));
            return;
        }
        
        if (!activeReport) {
            toast.error('Please select a report type');
            return;
        }
        
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            // Clear previous data to show loading state
            setReportData(null);
            
            console.log('Fetching report:', { projectId: selectedProjectId, reportType: activeReport, filters });
            
            // Fetch actual report data from API
            const data = await reportService.getReportData(selectedProjectId, activeReport, filters, token);
            
            console.log('Report data received:', data);
            
            if (data) {
                setReportData(data);
                
                // Update stats if it's a saved report
                if (data.stats) {
                    setStats(data.stats);
                }
                
                toast.success(t('reports.generatedSuccessfully') || 'Report generated successfully');
            } else {
                toast.error('No data returned from server');
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                toast.error(error.response.data?.error || t('reports.fetchError'));
            } else if (error.request) {
                toast.error('No response from server. Please check your connection.');
            } else {
                toast.error(t('reports.fetchError'));
            }
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectChange = (newProjectId) => {
        navigate(`/reports/${newProjectId}`);
        setSelectedProjectId(newProjectId);
    };

    const handleExportReport = async (format) => {
        // Validate that we have the necessary data
        if (!selectedProjectId) {
            toast.error(t('reports.selectProject') || 'Please select a project first');
            return;
        }
        
        if (!activeReport) {
            toast.error(t('reports.selectReportType') || 'Please select a report type');
            return;
        }
        
        if (!reportData) {
            toast.error(t('reports.generateReportFirst') || 'Please generate a report first before exporting');
            return;
        }
        
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            console.log('Exporting report:', { projectId: selectedProjectId, reportType: activeReport, format, filters });
            
            // Export report using the API
            await reportService.exportReport(selectedProjectId, activeReport, format, filters, token);
            toast.success(t('reports.exportSuccess') || 'Report exported successfully');
        } catch (error) {
            console.error('Error exporting report:', error);
            
            // Provide more detailed error message
            if (error.response?.data?.error) {
                toast.error(`Export failed: ${error.response.data.error}`);
            } else if (error.message) {
                toast.error(`Export failed: ${error.message}`);
            } else {
                toast.error(t('reports.exportError') || 'Failed to export report');
            }
        }
    };

    const handleShareReport = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            // For now, copy the report link to clipboard
            const reportUrl = `${window.location.origin}/reports/${selectedProjectId}?type=${activeReport}`;
            await navigator.clipboard.writeText(reportUrl);
            toast.success(t('reports.shareSuccess'));
        } catch (error) {
            console.error('Error sharing report:', error);
            toast.error(t('reports.shareError'));
        }
    };

    const handlePrintReport = () => {
        window.print();
    };

    // Filter projects based on search term
    const filteredProjects = projects.filter(project =>
        !searchTerm ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Show project selector if no projectId
    if (!projectId && !selectedProjectId) {
        return (
            <div className={`min-h-screen p-3 md:p-6`}>
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{t('reports.title')}</h1>
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('reports.description')}
                        </p>
                    </div>
                    
                    {/* Module Features */}
                    <div className={`rounded-lg shadow-lg p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            {t('reports.moduleFeatures')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-blue-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('reports.features.standardReports')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('reports.features.standardReportsDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Settings className="h-5 w-5 text-green-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('reports.features.customReports')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('reports.features.customReportsDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Layout className="h-5 w-5 text-purple-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('reports.features.dashboards')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('reports.features.dashboardsDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg md:text-xl font-semibold">
                                {projects.length > 0 ? t('reports.selectProjectTitle') : t('reports.noProjectsAvailable')}
                            </h2>
                            {projects.length > 0 && (
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('reports.searchProjects')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                            isDark
                                                ? 'bg-gray-800 border-gray-700 text-white'
                                                : 'bg-white border-gray-300'
                                        } focus:outline-none`}
                                    />
                                </div>
                            )}
                        </div>

                        {projects.length === 0 ? (
                            <div className={`rounded-lg shadow p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">{t('reports.noProjectsFound')}</h3>
                                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.createFirstProject')}
                                </p>
                                <button
                                    onClick={() => navigate('/projects')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                                >
                                    {t('reports.goToProjects')}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className={`rounded-lg shadow p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">{t('reports.noProjectsMatchSearch')}</h3>
                                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.adjustSearchTerms')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleProjectChange(project.id)}
                                        className={`cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 ${
                                            isDark ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                                    {project.description || t('common.noDescription')}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 rounded ${
                                                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {project.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Users className="h-3 w-3" />
                                                <span>{project.members?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Find current project details
    const currentProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className={`min-h-screen p-3 md:p-6`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex-1 w-full">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{t('reports.title')}</h1>
                        
                        {/* Project Info and Selector */}
                        {currentProject && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.currentProject')}:
                                </p>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                    className={`px-3 py-2 text-sm rounded-lg border font-medium w-full sm:w-auto
                                        ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}
                                    focus:outline-none cursor-pointer transition-colors`}
                                >
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handlePrintReport}
                            className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{t('reports.print')}</span>
                        </button>
                        <button
                            onClick={handleShareReport}
                            className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{t('reports.share')}</span>
                        </button>
                        <div className="relative group">
                            <button
                                onClick={() => {
                                    if (!reportData) {
                                        toast.error(t('reports.generateReportFirst') || 'Please generate a report first');
                                        return;
                                    }
                                    handleExportReport('pdf');
                                }}
                                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                                    reportData
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                }`}
                                disabled={!reportData}
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs sm:text-sm">{t('reports.export')}</span>
                            </button>
                            {!reportData && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-10">
                                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                        {t('reports.generateReportFirst') || 'Generate a report first'}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.totalReports')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.totalReports || 0}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </div>

                    <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.savedReports')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.savedReports || 0}</p>
                            </div>
                            <Save className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </div>

                    <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.scheduledReports')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.scheduledReports || 0}</p>
                            </div>
                            <Clock className="h-8 w-8 text-purple-500 opacity-50" />
                        </div>
                    </div>

                    <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.lastGenerated')}
                                </p>
                                <p className="text-sm font-medium">
                                    {stats.lastGenerated
                                        ? new Date(stats.lastGenerated).toLocaleDateString()
                                        : t('reports.never')}
                                </p>
                            </div>
                            <RefreshCw className="h-8 w-8 text-orange-500 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs - Using Grid Layout */}
            <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
                <nav className="-mb-px grid grid-cols-2 md:flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => setActiveTab('standard')}
                        className={`py-2 px-3 border-b-2 font-medium text-sm text-center transition-colors ${
                            activeTab === 'standard'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        {t('reports.standardReports')}
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`py-2 px-3 border-b-2 font-medium text-sm text-center transition-colors ${
                            activeTab === 'custom'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        {t('reports.customReports')}
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`py-2 px-3 border-b-2 font-medium text-sm text-center transition-colors ${
                            activeTab === 'dashboard'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        {t('reports.managementDashboard')}
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`py-2 px-3 border-b-2 font-medium text-sm text-center transition-colors ${
                            activeTab === 'saved'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        {t('reports.savedReports')}
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {/* Standard Reports Tab */}
                {activeTab === 'standard' && (
                    <div>
                        {/* Report Type Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {standardReports.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveReport(report.id)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        activeReport === report.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <report.icon className={`h-8 w-8 mb-2 mx-auto text-${report.color}-500`} />
                                    <h3 className="font-medium text-sm">{report.name}</h3>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {report.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Date Range and Filters */}
                        <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                    className={`px-3 py-2 rounded-lg border text-sm ${
                                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                                    }`}
                                >
                                    <option value="7days">{t('reports.last7Days')}</option>
                                    <option value="30days">{t('reports.last30Days')}</option>
                                    <option value="90days">{t('reports.last90Days')}</option>
                                    <option value="custom">{t('reports.customRange')}</option>
                                </select>
                                
                                {filters.dateRange === 'custom' && (
                                    <>
                                        <input
                                            type="date"
                                            className={`px-3 py-2 rounded-lg border text-sm ${
                                                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                                            }`}
                                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className={`px-3 py-2 rounded-lg border text-sm ${
                                                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                                            }`}
                                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        />
                                    </>
                                )}
                                
                                <button
                                    onClick={fetchReportData}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    {t('reports.generateReport')}
                                </button>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className={`rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                    <p className="ml-4">{t('reports.generatingReport') || 'Generating report...'}</p>
                                </div>
                            ) : reportData ? (
                                <>
                                    {activeReport === 'projectStatus' && (
                                        <ProjectStatusReport
                                            projectId={selectedProjectId}
                                            filters={filters}
                                            isDark={isDark}
                                            data={reportData}
                                        />
                                    )}
                                    {activeReport === 'taskProgress' && (
                                        <TaskProgressReport
                                            projectId={selectedProjectId}
                                            filters={filters}
                                            isDark={isDark}
                                            data={reportData}
                                        />
                                    )}
                                    {activeReport === 'requirementsCoverage' && (
                                        <RequirementsCoverageReport
                                            projectId={selectedProjectId}
                                            filters={filters}
                                            isDark={isDark}
                                            data={reportData}
                                        />
                                    )}
                                    {activeReport === 'stakeholderEngagement' && (
                                        <StakeholderEngagementReport
                                            projectId={selectedProjectId}
                                            filters={filters}
                                            isDark={isDark}
                                            data={reportData}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                                        {t('reports.noDataAvailable')}
                                    </p>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('reports.clickGenerateToStart') || 'Click "Generate Report" to create your report'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Custom Reports Tab */}
                {activeTab === 'custom' && (
                    <CustomReportBuilder
                        projectId={selectedProjectId}
                        isDark={isDark}
                    />
                )}

                {/* Management Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <ManagementDashboard
                        projectId={selectedProjectId}
                        isDark={isDark}
                    />
                )}

                {/* Saved Reports Tab */}
                {activeTab === 'saved' && (
                    <SavedReports
                        projectId={selectedProjectId}
                        isDark={isDark}
                    />
                )}
            </div>
        </div>
    );
};

export default Reports;