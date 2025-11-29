import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import {
    Save,
    FileText,
    Clock,
    Calendar,
    User,
    Play,
    Download,
    Share2,
    Edit,
    Trash,
    Copy,
    Star,
    StarOff,
    Filter,
    Search,
    MoreVertical,
    FolderOpen,
    Grid,
    List,
    RefreshCw,
    ChevronRight,
    Tag,
    Mail,
    Lock,
    Unlock,
    Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import reportService from '../../services/reportService';

const SavedReports = ({ projectId, isDark }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [savedReports, setSavedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownTimeoutRef = useRef(null);

    // Report categories
    const categories = [
        { id: 'all', name: 'All Reports', count: 0 },
        { id: 'favorites', name: 'Favorites', count: 0 },
        { id: 'scheduled', name: 'Scheduled', count: 0 },
        { id: 'shared', name: 'Shared with Me', count: 0 },
        { id: 'personal', name: 'My Reports', count: 0 }
    ];

    useEffect(() => {
        fetchSavedReports();
    }, [projectId, filterCategory]);

    const fetchSavedReports = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            // Fetch actual data from API
            const data = await reportService.getSavedReports(projectId, filterCategory === 'all' ? null : filterCategory, token);
            const fetchedReports = data.reports || [];

            // Update categories with translations and counts
            categories[0].name = t('reports.allReports');
            categories[1].name = t('reports.favorites');
            categories[2].name = t('reports.scheduled');
            categories[3].name = t('reports.sharedWithMe');
            categories[4].name = t('reports.myReports');
            
            // If we have reports, update counts based on actual data
            if (fetchedReports.length > 0) {
                categories[0].count = fetchedReports.length;
                categories[1].count = fetchedReports.filter(r => r.isFavorite).length;
                categories[2].count = fetchedReports.filter(r => r.schedule && r.schedule !== 'On Demand').length;
                categories[3].count = fetchedReports.filter(r => r.sharedWith && r.sharedWith.length > 0).length;
                categories[4].count = fetchedReports.filter(r => !r.sharedWith || r.sharedWith.length === 0).length;
            }

            setSavedReports(fetchedReports);
        } catch (error) {
            console.error('Error fetching saved reports:', error);
            toast.error(t('reports.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleRunReport = async (report) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // Call actual API
            await reportService.runReport(report.id, token);
            toast.success(t('reports.runningReport', { name: report.name }));
            fetchSavedReports(); // Refresh data after running
        } catch (error) {
            toast.error(t('reports.failedToRunReport'));
        }
    };

    const handleToggleFavorite = async (reportId, currentState) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // Call actual API
            await reportService.toggleFavorite(reportId, token);
            
            setSavedReports(prevReports =>
                prevReports.map(report =>
                    report.id === reportId
                        ? { ...report, isFavorite: !currentState }
                        : report
                )
            );
            
            toast.success(currentState ? t('reports.removedFromFavorites') : t('reports.addedToFavorites'));
        } catch (error) {
            toast.error(t('reports.failedToUpdateFavorite'));
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm(t('reports.confirmDeleteReport'))) return;

        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // Call actual API
            await reportService.deleteReport(reportId, token);
            setSavedReports(prevReports => prevReports.filter(r => r.id !== reportId));
            toast.success(t('reports.reportDeletedSuccess'));
        } catch (error) {
            toast.error(t('reports.failedToDeleteReport'));
        }
    };

    const handleDuplicateReport = async (report) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // Call actual API
            await reportService.duplicateReport(report.id, token);
            toast.success(t('reports.duplicatedReport', { name: report.name }));
            fetchSavedReports(); // Refresh the list
        } catch (error) {
            toast.error(t('reports.failedToDuplicateReport'));
        }
    };

    const handleExportReport = async (report, format) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error(t('reports.authenticationRequired'));
                return;
            }

            // Validate required data
            if (!projectId) {
                toast.error(t('reports.selectProject') || 'Please select a project');
                return;
            }

            // Map report type to expected API format (server expects kebab-case)
            let reportType = report.type;
            
            // First, check for dataSource or reportType fields
            if (report.dataSource) {
                reportType = report.dataSource;
            } else if (report.reportType) {
                reportType = report.reportType;
            } else if (report.config?.reportType) {
                reportType = report.config.reportType;
            } else if (report.config?.type) {
                reportType = report.config.type;
            }
            
            // Map common variations to valid server types
            const typeMapping = {
                'tasks': 'task-progress',
                'task': 'task-progress',
                'taskProgress': 'task-progress',
                'task-progress': 'task-progress',
                'projectStatus': 'project-status',
                'project-status': 'project-status',
                'status': 'project-status',
                'overview': 'project-status',
                'requirements': 'requirements-coverage',
                'requirement': 'requirements-coverage',
                'requirementsCoverage': 'requirements-coverage',
                'requirements-coverage': 'requirements-coverage',
                'coverage': 'requirements-coverage',
                'stakeholder': 'stakeholder-engagement',
                'stakeholders': 'stakeholder-engagement',
                'stakeholderEngagement': 'stakeholder-engagement',
                'stakeholder-engagement': 'stakeholder-engagement',
                'engagement': 'stakeholder-engagement',
                'dashboard': 'dashboard',
                'management': 'dashboard',
                'managementDashboard': 'dashboard',
                'custom': 'project-status',
                'standard': 'project-status'
            };
            
            // Check if we have a direct mapping
            if (typeMapping[reportType]) {
                reportType = typeMapping[reportType];
            } else if (!reportType || reportType === 'custom' || reportType === 'standard') {
                // If type is generic or missing, try to infer from name
                if (report.name) {
                    const nameLower = report.name.toLowerCase();
                    if (nameLower.includes('task') || nameLower.includes('progress')) {
                        reportType = 'task-progress';
                    } else if (nameLower.includes('status') || nameLower.includes('overview')) {
                        reportType = 'project-status';
                    } else if (nameLower.includes('requirement') || nameLower.includes('coverage')) {
                        reportType = 'requirements-coverage';
                    } else if (nameLower.includes('stakeholder') || nameLower.includes('engagement')) {
                        reportType = 'stakeholder-engagement';
                    } else if (nameLower.includes('dashboard') || nameLower.includes('management')) {
                        reportType = 'dashboard';
                    } else {
                        reportType = 'project-status'; // Default fallback
                    }
                } else {
                    reportType = 'project-status'; // Default fallback
                }
            } else if (!reportType.includes('-')) {
                // Convert camelCase to kebab-case if not already in kebab-case
                reportType = reportType
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .toLowerCase();
                    
                // Check mapping again after conversion
                if (typeMapping[reportType]) {
                    reportType = typeMapping[reportType];
                }
            }
            
            // Final validation - ensure it's one of the valid types
            const validTypes = ['project-status', 'task-progress', 'requirements-coverage', 'stakeholder-engagement', 'dashboard'];
            if (!validTypes.includes(reportType)) {
                console.warn(`Invalid report type '${reportType}', falling back to 'project-status'`);
                reportType = 'project-status';
            }

            // Ensure format is lowercase
            const exportFormat = format?.toLowerCase() || 'pdf';
            
            // Get filters from report config if available
            const filters = report.config?.filters || report.filters || {};

            console.log('Exporting saved report:', {
                reportId: report.id,
                reportName: report.name,
                projectId,
                reportType,
                format: exportFormat,
                filters
            });

            // Call actual API - the reportService will handle any additional transformations
            await reportService.exportReport(projectId, reportType, exportFormat, filters, token);
            toast.success(t('reports.exportSuccess', { name: report.name, format: exportFormat.toUpperCase() }) || `Exported ${report.name} as ${exportFormat.toUpperCase()}`);
        } catch (error) {
            console.error('Error exporting saved report:', error);
            const errorMessage = error.message || 'Failed to export report';
            toast.error(t('reports.exportError') || errorMessage);
        }
    };

    const filteredReports = savedReports.filter(report =>
        searchTerm === '' ||
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getScheduleIcon = (schedule) => {
        if (schedule === 'Daily') return '📅';
        if (schedule === 'Weekly') return '📆';
        if (schedule === 'Monthly') return '📊';
        return '⏰';
    };

    const getFormatColor = (format) => {
        if (format === 'PDF') return 'red';
        if (format === 'Excel') return 'green';
        if (format === 'CSV') return 'blue';
        return 'gray';
    };

    const handleDropdownEnter = (reportId) => {
        // Clear any existing timeout
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
        setActiveDropdown(reportId);
    };

    const handleDropdownLeave = (reportId) => {
        // Add delay before closing dropdown
        dropdownTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(prev => prev === reportId ? null : prev);
        }, 300);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="grid col-span-1 md:flex items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        {t('reports.savedReports')}
                    </h2>
                    <div className="grid col-span-1 md:flex items-center gap-2">
                         {/* Search */}
                        <div className="relative my-3 md:my-0">
                            <Search className="absolute right-3 top-1/2 transform   -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={t('reports.searchReports')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`  px-4 py-2 rounded-lg border ms-3 ${
                                    isDark
                                        ? 'bg-gray-900 border-gray-700 text-white'
                                        : 'bg-white border-gray-300'
                                } focus:outline-none`}
                            />
                        </div>
                        {/* View Mode Toggle */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-500 text-white'
                                        : `${isDark ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-200 dark:hover:bg-gray-600`
                                }`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded hidden md:block ${
                                    viewMode === 'list'
                                        ? 'bg-blue-500 text-white'
                                        : `${isDark ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-200 dark:hover:bg-gray-600`
                                }`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                       
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setFilterCategory(category.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filterCategory === category.id
                                    ? 'bg-blue-500 text-white'
                                    : `${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 dark:hover:bg-gray-600`
                            }`}
                        >
                            {category.name}
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                {category.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports Display */}
            {filteredReports.length === 0 ? (
                <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">{t('reports.noReportsFound')}</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchTerm ? t('reports.tryAdjustingSearch') : t('reports.createYourFirstReport')}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReports.map((report) => (
                        <div
                            key={report.id}
                            className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow hover:shadow-lg transition-shadow`}
                        >
                            {/* Report Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {report.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggleFavorite(report.id, report.isFavorite)}
                                    className="text-yellow-500 hover:text-yellow-600"
                                >
                                    {report.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Report Metadata */}
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <User className="h-3 w-3" />
                                    <span>{report.createdBy}</span>
                                    {report.isShared && (
                                        <>
                                            <Share2 className="h-3 w-3 ml-2" />
                                            <span>{report.sharedWith.length} {t('reports.shared')}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Clock className="h-3 w-3" />
                                    <span>Last run: {new Date(report.lastRun).toLocaleDateString()}</span>
                                </div>
                                {report.schedule !== 'On Demand' && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="h-3 w-3" />
                                        <span>{report.schedule}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs bg-${getFormatColor(report.format)}-100 text-${getFormatColor(report.format)}-800 dark:bg-${getFormatColor(report.format)}-900/30 dark:text-${getFormatColor(report.format)}-400`}>
                                        {report.format}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        {report.type === 'standard' ? t('reports.standard') :
                                         report.type === 'custom' ? t('reports.custom') :
                                         report.type}
                                    </span>
                                </div>
                            </div>

                            {/* Tags */}
                            {report.tags && report.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {report.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className={`px-2 py-1 rounded-full text-xs ${
                                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-700 border-gray-200">
                                <button
                                    onClick={() => handleRunReport(report)}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center justify-center gap-1"
                                >
                                    <Play className="h-3 w-3" />
                                    {t('reports.run')}
                                </button>
                                <div
                                    className="relative"
                                    onMouseEnter={() => handleDropdownEnter(`grid-${report.id}`)}
                                    onMouseLeave={() => handleDropdownLeave(`grid-${report.id}`)}
                                >
                                    <button
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                                    >
                                        <Download className="h-3 w-3" />
                                    </button>
                                    <div
                                        className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 ${
                                            activeDropdown === `grid-${report.id}` ? 'flex' : 'hidden'
                                        } gap-1 z-10 bg-gray-800 rounded-lg p-1 shadow-lg`}
                                    >
                                        <button
                                            onClick={() => {
                                                handleExportReport(report, 'pdf');
                                                setActiveDropdown(null);
                                            }}
                                            className="px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 whitespace-nowrap transition-colors"
                                        >
                                            PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleExportReport(report, 'excel');
                                                setActiveDropdown(null);
                                            }}
                                            className="px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 whitespace-nowrap transition-colors"
                                        >
                                            Excel
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleExportReport(report, 'csv');
                                                setActiveDropdown(null);
                                            }}
                                            className="px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 whitespace-nowrap transition-colors"
                                        >
                                            CSV
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(report)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden`}>
                    <table className="w-full">
                        <thead>
                            <tr className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                <th className="px-4 py-3 text-left text-xs font-medium">{t('reports.name')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">{t('reports.type')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">{t('reports.schedule')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">{t('reports.lastRun')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">{t('reports.createdBy')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">{t('reports.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report, index) => (
                                <tr
                                    key={report.id}
                                    className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleFavorite(report.id, report.isFavorite)}
                                                className="text-yellow-500 hover:text-yellow-600"
                                            >
                                                {report.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                            </button>
                                            <div>
                                                <p className="font-medium text-sm">{report.name}</p>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            report.type === 'standard' 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                        }`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {report.schedule === 'Daily' ? t('reports.dailyRun') :
                                         report.schedule === 'Weekly' ? t('reports.weeklyRun') :
                                         report.schedule === 'Monthly' ? t('reports.monthlyRun') :
                                         report.schedule === 'On Demand' ? t('reports.onDemand') :
                                         report.schedule}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {new Date(report.lastRun).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            {report.createdBy}
                                            {report.isShared && <Share2 className="h-3 w-3" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleRunReport(report)}
                                                className="text-blue-500 hover:text-blue-600"
                                                title={t('reports.runReport')}
                                            >
                                                <Play className="h-4 w-4" />
                                            </button>
                                            <div
                                                className="relative"
                                                onMouseEnter={() => handleDropdownEnter(`list-${report.id}`)}
                                                onMouseLeave={() => handleDropdownLeave(`list-${report.id}`)}
                                            >
                                                <button
                                                    className="text-green-500 hover:text-green-600"
                                                    title={t('reports.export')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <div
                                                    className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 ${
                                                        activeDropdown === `list-${report.id}` ? 'flex' : 'hidden'
                                                    } gap-1 z-10 bg-gray-800 rounded-lg p-1 shadow-lg`}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            handleExportReport(report, 'pdf');
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 whitespace-nowrap transition-colors"
                                                    >
                                                        PDF
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleExportReport(report, 'excel');
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 whitespace-nowrap transition-colors"
                                                    >
                                                        Excel
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleExportReport(report, 'csv');
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 whitespace-nowrap transition-colors"
                                                    >
                                                        CSV
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDuplicateReport(report)}
                                                className="text-purple-500 hover:text-purple-600"
                                                title={t('reports.duplicate')}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReport(report.id)}
                                                className="text-red-500 hover:text-red-600"
                                                title={t('reports.deleteReport')}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Report Details Modal (if selected) */}
            {selectedReport && (
                <div className="fixed inset-0  flex items-center justify-center  backdrop-blur-xl z-50">
                    <div className={`rounded-lg p-6 max-w-md w-full bg-white backdrop-blur-3xl dark:bg-[#101010] border border-gray-200 dark:border-gray-900`}>
                        <h3 className="text-lg font-semibold mb-4">{selectedReport.name}</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    handleRunReport(selectedReport);
                                    setSelectedReport(null);
                                }}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Play className="h-4 w-4" />
                                {t('reports.runReport')}
                            </button>
                            <button
                                onClick={() => {
                                    // Navigate to edit
                                    setSelectedReport(null);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                {t('reports.editReport')}
                            </button>
                            <button
                                onClick={() => {
                                    handleDuplicateReport(selectedReport);
                                    setSelectedReport(null);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                            >
                                <Copy className="h-4 w-4" />
                                {t('reports.duplicateReport')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowShareModal(true);
                                    setSelectedReport(null);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                            >
                                <Share2 className="h-4 w-4" />
                                {t('reports.shareReport')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowScheduleModal(true);
                                    setSelectedReport(null);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                {t('reports.scheduleReport')}
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteReport(selectedReport.id);
                                    setSelectedReport(null);
                                }}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                                <Trash className="h-4 w-4" />
                                {t('reports.deleteReport')}
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="mt-4 w-full px-4 py-2 text-gray-600 dark:text-gray-400"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedReports;