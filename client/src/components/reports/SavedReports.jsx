import React, { useState, useEffect } from 'react';
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

            // TODO: Replace with actual API call
            // const response = await fetch(`/api/reports/saved?projectId=${projectId}&category=${filterCategory}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}`
            //     }
            // });
            // const data = await response.json();
            // setSavedReports(data);

            // Simulated data
            const mockReports = [
                {
                    id: '1',
                    name: 'Weekly Project Status Report',
                    description: 'Comprehensive overview of project health, milestones, and team performance',
                    type: 'standard',
                    category: 'Project Status',
                    createdBy: 'John Doe',
                    createdAt: '2024-11-15T10:00:00Z',
                    lastModified: '2024-11-28T14:30:00Z',
                    lastRun: '2024-11-29T08:00:00Z',
                    nextRun: '2024-12-06T08:00:00Z',
                    schedule: 'Weekly',
                    isFavorite: true,
                    isShared: true,
                    sharedWith: ['jane.smith@example.com', 'bob.johnson@example.com'],
                    permissions: 'view',
                    format: 'PDF',
                    dataSource: 'projects',
                    runCount: 12,
                    avgRunTime: 2.5,
                    tags: ['weekly', 'status', 'management']
                },
                {
                    id: '2',
                    name: 'Risk Assessment Dashboard',
                    description: 'Real-time risk tracking and mitigation status',
                    type: 'custom',
                    category: 'Risk Management',
                    createdBy: 'Jane Smith',
                    createdAt: '2024-10-20T09:00:00Z',
                    lastModified: '2024-11-27T16:00:00Z',
                    lastRun: '2024-11-28T10:00:00Z',
                    nextRun: null,
                    schedule: 'On Demand',
                    isFavorite: true,
                    isShared: false,
                    sharedWith: [],
                    permissions: 'edit',
                    format: 'Excel',
                    dataSource: 'risks',
                    runCount: 25,
                    avgRunTime: 1.8,
                    tags: ['risk', 'dashboard', 'critical']
                },
                {
                    id: '3',
                    name: 'Task Progress Summary',
                    description: 'Daily task completion rates and team productivity metrics',
                    type: 'standard',
                    category: 'Task Management',
                    createdBy: 'Current User',
                    createdAt: '2024-11-01T11:00:00Z',
                    lastModified: '2024-11-29T09:00:00Z',
                    lastRun: '2024-11-29T07:00:00Z',
                    nextRun: '2024-11-30T07:00:00Z',
                    schedule: 'Daily',
                    isFavorite: false,
                    isShared: true,
                    sharedWith: ['team@example.com'],
                    permissions: 'edit',
                    format: 'CSV',
                    dataSource: 'tasks',
                    runCount: 28,
                    avgRunTime: 1.2,
                    tags: ['daily', 'tasks', 'productivity']
                },
                {
                    id: '4',
                    name: 'Requirements Coverage Matrix',
                    description: 'Traceability matrix showing requirements vs tasks and tests',
                    type: 'custom',
                    category: 'Requirements',
                    createdBy: 'Bob Johnson',
                    createdAt: '2024-09-15T13:00:00Z',
                    lastModified: '2024-11-25T11:00:00Z',
                    lastRun: '2024-11-26T15:00:00Z',
                    nextRun: null,
                    schedule: 'Monthly',
                    isFavorite: false,
                    isShared: true,
                    sharedWith: ['qa-team@example.com', 'dev-team@example.com'],
                    permissions: 'view',
                    format: 'PDF',
                    dataSource: 'requirements',
                    runCount: 8,
                    avgRunTime: 3.2,
                    tags: ['requirements', 'coverage', 'quality']
                },
                {
                    id: '5',
                    name: 'Stakeholder Communication Log',
                    description: 'Monthly stakeholder engagement and satisfaction metrics',
                    type: 'standard',
                    category: 'Stakeholder Management',
                    createdBy: 'Current User',
                    createdAt: '2024-10-10T10:00:00Z',
                    lastModified: '2024-11-20T14:00:00Z',
                    lastRun: '2024-11-15T09:00:00Z',
                    nextRun: '2024-12-15T09:00:00Z',
                    schedule: 'Monthly',
                    isFavorite: true,
                    isShared: false,
                    sharedWith: [],
                    permissions: 'edit',
                    format: 'Excel',
                    dataSource: 'stakeholders',
                    runCount: 6,
                    avgRunTime: 2.0,
                    tags: ['stakeholder', 'monthly', 'communication']
                }
            ];

            // Apply category filter
            let filteredReports = mockReports;
            if (filterCategory === 'favorites') {
                filteredReports = mockReports.filter(r => r.isFavorite);
            } else if (filterCategory === 'scheduled') {
                filteredReports = mockReports.filter(r => r.schedule !== 'On Demand');
            } else if (filterCategory === 'shared') {
                filteredReports = mockReports.filter(r => r.isShared && r.createdBy !== 'Current User');
            } else if (filterCategory === 'personal') {
                filteredReports = mockReports.filter(r => r.createdBy === 'Current User');
            }

            // Update category counts
            // Update categories with translations
            categories[0].name = t('reports.allReports');
            categories[1].name = t('reports.favorites');
            categories[2].name = t('reports.scheduled');
            categories[3].name = t('reports.sharedWithMe');
            categories[4].name = t('reports.myReports');
            
            categories[0].count = mockReports.length;
            categories[1].count = mockReports.filter(r => r.isFavorite).length;
            categories[2].count = mockReports.filter(r => r.schedule !== 'On Demand').length;
            categories[3].count = mockReports.filter(r => r.isShared && r.createdBy !== 'Current User').length;
            categories[4].count = mockReports.filter(r => r.createdBy === 'Current User').length;

            setSavedReports(filteredReports);
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

            toast.success(t('reports.runningReport', { name: report.name }));
            // TODO: Implement actual report execution
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

            // TODO: Implement actual API call
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

            // TODO: Implement actual API call
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

            // TODO: Implement actual API call
            toast.success(t('reports.duplicatedReport', { name: report.name }));
            fetchSavedReports();
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

            // TODO: Implement actual export
            toast.success(`Exported ${report.name} as ${format}`);
        } catch (error) {
            toast.error('Failed to export report');
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
                                <button
                                    onClick={() => handleExportReport(report, report.format)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                                >
                                    <Download className="h-3 w-3" />
                                </button>
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
                                            <button
                                                onClick={() => handleExportReport(report, report.format)}
                                                className="text-green-500 hover:text-green-600"
                                                title={t('reports.export')}
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
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