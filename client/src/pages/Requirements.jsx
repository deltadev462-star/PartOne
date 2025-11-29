import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { requirementService, rfcService } from '../services/requirementService';
import {
    Plus,
    Filter,
    Download,
    Upload,
    Eye,
    Edit,
    Trash,
    GitBranch,
    FileText,
    MessageSquare,
    Link,
    TestTube,
    History,
    ChevronRight,
    ChevronDown,
    Search,
    Grid,
    List,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreHorizontal,
    Archive,
    RefreshCw,
    Target,
    FolderOpen,
    ArrowRight,
    Users,
    Calendar
} from 'lucide-react';
import RequirementsList from '../components/requirements/RequirementsList';
import RequirementDetailModal from '../components/requirements/RequirementDetailModal';
import CreateRequirementModal from '../components/requirements/CreateRequirementModal';
import RFCList from '../components/requirements/RFCList';
import CreateRFCModal from '../components/requirements/CreateRFCModal';
import RequirementsOverview from '../components/requirements/RequirementsOverview';
import TraceabilityMatrix from '../components/requirements/TraceabilityMatrix';
import { toast } from 'react-hot-toast';
import {
    exportRequirementsToExcel,
    exportRequirementsToCSV,
    exportRequirementsToPDF,
    importRequirementsFromExcel,
    downloadRequirementTemplate,
    parseExcelFile
} from '../utils/exportImportUtils';

const Requirements = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const isDark = useSelector((state) => state.theme.theme === 'dark');
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Requirements state
    const [requirements, setRequirements] = useState([]);
    const [hierarchicalRequirements, setHierarchicalRequirements] = useState([]);
    const [selectedRequirement, setSelectedRequirement] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // list, tree, board
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // RFC state
    const [rfcs, setRfcs] = useState([]);
    const [selectedRFC, setSelectedRFC] = useState(null);
    const [isCreateRFCModalOpen, setIsCreateRFCModalOpen] = useState(false);
    
    // Filter state
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        priority: '',
        owner: '',
        search: ''
    });
    
    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        byStatus: {},
        byType: {},
        byPriority: {},
        coverage: 0
    });

    useEffect(() => {
        if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [projectId]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchRequirements();
            fetchRFCs();
        }
    }, [selectedProjectId, filters]);


    const handleProjectChange = (newProjectId) => {
        // Navigate to the requirements page with the project ID
        navigate(`/requirements/${newProjectId}`);
    };

    const fetchRequirements = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                toast.error('Authentication required');
                return;
            }
            const [flatData, hierarchyData] = await Promise.all([
                requirementService.getProjectRequirements(selectedProjectId, filters, token),
                requirementService.getRequirementsHierarchy(selectedProjectId, token)
            ]);

            
            setRequirements(flatData.requirements || []);
            setHierarchicalRequirements(hierarchyData.requirements || []);
            calculateStats(flatData.requirements || []);
        } catch (error) {
            console.error('Error fetching requirements:', error);
            toast.error(t('requirements.fetchError') || 'Failed to fetch requirements');
            // Set empty arrays on error
            setRequirements([]);
            setHierarchicalRequirements([]);
            calculateStats([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRFCs = async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                return;
            }
            
            // Only pass valid RFC statuses
            const rfcFilters = {};
            const validRFCStatuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELLED'];
            
            // Only include status if it's a valid RFC status
            if (filters.status && validRFCStatuses.includes(filters.status)) {
                rfcFilters.status = filters.status;
            }
            
            const data = await rfcService.getProjectRFCs(selectedProjectId, rfcFilters, token);
            setRfcs(data.rfcs || []);
        } catch (error) {
            console.error('Error fetching RFCs:', error);
            setRfcs([]);
        }
    };

    // Filter projects based on search term
    const filteredProjects = projects.filter(project =>
        !searchTerm ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Debug logging
    console.log('Current state:', {
        projectId,
        selectedProjectId,
        projects,
        requirements,
        loading
    });
    
    // Show project selector if no projectId
    if (!projectId && !selectedProjectId) {
        return (
            <div className={`min-h-screen p-3 md:p-6`}>
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{t('requirements.title')}</h1>
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('requirements.description')}
                        </p>
                    </div>
                    
                    {/* Module Capabilities Preview */}
                    <div className={`rounded-lg shadow-lg p-6 mb-8 `}>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            {t('requirements.moduleFeatures')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('requirements.features.management')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.features.managementDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <GitBranch className="h-5 w-5 text-purple-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('requirements.features.traceability')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.features.traceabilityDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <RefreshCw className="h-5 w-5 text-orange-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('requirements.features.changeManagement')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.features.changeManagementDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg md:text-xl font-semibold">
                                {projects.length > 0 ? t('requirements.selectProjectTitle') : t('requirements.noProjectsAvailable')}
                            </h2>
                            {projects.length > 0 && (
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                            isDark
                                                ? 'bg-gray-800 border-gray-700 text-white'
                                                : 'bg-white border-gray-300'
                                        } focus:outline-none  `}
                                    />
                                </div>
                            )}
                        </div>

                        {projects.length === 0 ? (
                            <div className={`rounded-lg shadow p-8 text-center`}>
                                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">{t('requirements.noProjectsFound')}</h3>
                                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.createFirstProject')}
                                </p>
                                <button
                                    onClick={() => navigate('/projects')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                                >
                                    {t('requirements.goToProjects')}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className={`rounded-lg shadow p-8 text-center  `}>
                                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">{t('requirements.noProjectsMatchSearch')}</h3>
                                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.adjustSearchTerms')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleProjectChange(project.id)}
                                        className={`cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-shadow p-6  `}
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
                                                <span className={`px-2 py-1 rounded ${
                                                    project.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                    project.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {project.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Users className="h-3 w-3" />
                                                <span>{project.members?.length || 0}</span>
                                            </div>
                                        </div>
                                        
                                        {project.startDate && (
                                            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Calendar className="h-3 w-3" />
                                                <span>{t('requirements.startedOn')}: {new Date(project.startDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const calculateStats = (reqs) => {
        const stats = {
            total: reqs.length,
            byStatus: {},
            byType: {},
            byPriority: {},
            coverage: 0
        };

        reqs.forEach(req => {
            // Status stats
            stats.byStatus[req.status] = (stats.byStatus[req.status] || 0) + 1;
            // Type stats
            stats.byType[req.type] = (stats.byType[req.type] || 0) + 1;
            // Priority stats
            stats.byPriority[req.priority] = (stats.byPriority[req.priority] || 0) + 1;
        });

        // Calculate coverage (requirements with linked tasks/test cases)
        const linkedReqs = reqs.filter(req => 
            req.taskLinks?.length > 0 || req.testCases?.length > 0
        ).length;
        stats.coverage = reqs.length > 0 
            ? Math.round((linkedReqs / reqs.length) * 100) 
            : 0;

        setStats(stats);
    };

    const handleCreateRequirement = async (data) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            const result = await requirementService.createRequirement({
                ...data,
                projectId: selectedProjectId
            }, token);
            toast.success(t('requirements.createSuccess'));
            setIsCreateModalOpen(false);
            fetchRequirements();
        } catch (error) {
            toast.error(t('requirements.createError'));
        }
    };

    const handleUpdateRequirement = async (id, data) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            await requirementService.updateRequirement(id, data, token);
            toast.success(t('requirements.updateSuccess'));
            fetchRequirements();
        } catch (error) {
            toast.error(t('requirements.updateError'));
        }
    };

    const handleDeleteRequirement = async (id) => {
        if (!window.confirm(t('requirements.deleteConfirm'))) return;
        
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            await requirementService.deleteRequirement(id, token);
            toast.success(t('requirements.deleteSuccess'));
            fetchRequirements();
        } catch (error) {
            toast.error(t('requirements.deleteError'));
        }
    };

    const handleBaselineRequirement = async (id) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            await requirementService.baselineRequirement(id, token);
            toast.success(t('requirements.baselineSuccess'));
            fetchRequirements();
        } catch (error) {
            toast.error(t('requirements.baselineError'));
        }
    };

    const handleExport = async (format) => {
        try {
            if (!selectedProjectId) {
                toast.error(t('requirements.selectProject'));
                return;
            }

            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const exportFilters = {
                status: filters.status || undefined,
                priority: filters.priority || undefined,
                type: filters.type || undefined
            };

            switch (format) {
                case 'excel':
                    await exportRequirementsToExcel(selectedProjectId, exportFilters, token);
                    toast.success(t('requirements.exportSuccess'));
                    break;
                case 'csv':
                    await exportRequirementsToCSV(selectedProjectId, exportFilters, token);
                    toast.success(t('requirements.exportSuccess'));
                    break;
                case 'pdf':
                    await exportRequirementsToPDF(selectedProjectId, exportFilters, token);
                    toast.success(t('requirements.exportSuccess'));
                    break;
                default:
                    break;
            }
            setShowExportMenu(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error(t('requirements.exportError'));
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedProjectId) {
            toast.error(t('requirements.selectProject'));
            return;
        }

        const token = await getToken();
        if (!token) {
            toast.error('Authentication required');
            return;
        }

        setIsImporting(true);
        try {
            const result = await importRequirementsFromExcel(selectedProjectId, file, token);
            toast.success(result.message || t('requirements.importSuccess'));
            // Refresh requirements list
            fetchRequirements();
        } catch (error) {
            console.error("Import error:", error);
            const errorMsg = error.response?.data?.message || t('requirements.importError');
            toast.error(errorMsg);
            
            // Show validation errors if any
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => toast.error(err));
            }
        } finally {
            setIsImporting(false);
            event.target.value = '';
            setShowImportMenu(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await downloadRequirementTemplate(token);
            toast.success(t('requirements.templateDownloaded'));
            setShowImportMenu(false);
        } catch (error) {
            console.error("Template download error:", error);
            toast.error(t('requirements.templateDownloadError'));
        }
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            DRAFT: 'bg-gray-500',
            REVIEW: 'bg-blue-500',
            APPROVED: 'bg-green-500',
            IMPLEMENTED: 'bg-purple-500',
            VERIFIED: 'bg-teal-500',
            CLOSED: 'bg-gray-700'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getPriorityBadgeColor = (priority) => {
        const colors = {
            LOW: 'bg-gray-500',
            MEDIUM: 'bg-yellow-500',
            HIGH: 'bg-orange-500',
            CRITICAL: 'bg-red-500'
        };
        return colors[priority] || 'bg-gray-500';
    };

    // Find current project details
    const currentProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className={`min-h-screen p-3 md:p-6`}>
            {/* Header */}
            <div className="mb-6">
                {/* Back button and breadcrumb */}
                {/* {projectId && (
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => navigate('/requirements')}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                            {t('requirements.backToProjectSelection')}
                        </button>
                    </div>
                )} */}
                
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex-1 w-full">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{t('requirements.title')}</h1>
                        
                        {/* Project Info and Selector */}
                        {currentProject ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.currentProject')}:
                                </p>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                    className={`px-3 py-2 text-sm rounded-lg border font-medium w-full sm:w-auto
                                        dark:bg-[#101010]  dark:border-gray-700 dark:text-white border-gray-200
                                    focus:outline-none   cursor-pointer transition-colors`}
                                >
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                    <span className={`px-2 py-1 rounded ${
                                        currentProject.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        currentProject.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                        {currentProject.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded ${
                                        currentProject.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                        currentProject.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                        {t(`project.priority.${currentProject.priority.toLowerCase()}`)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('requirements.description')}
                            </p>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        {/* Export Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs sm:text-sm">{t('requirements.export')}</span>
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FileText className="size-4 mr-2" />
                                        {t('requirements.exportToExcel')}
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FileText className="size-4 mr-2" />
                                        {t('requirements.exportToCSV')}
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FileText className="size-4 mr-2" />
                                        {t('requirements.exportToPDF')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Import Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowImportMenu(!showImportMenu)}
                                className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                disabled={isImporting}
                            >
                                <Upload className="h-4 w-4" />
                                <span className="text-xs sm:text-sm">{isImporting ? t('requirements.importing') : t('requirements.import')}</span>
                            </button>
                            {showImportMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                                    <label className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <FileText className="size-4 mr-2" />
                                        {t('requirements.importFromExcel')}
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleImport}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <Download className="size-4 mr-2" />
                                        {t('requirements.downloadTemplate')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-initial"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{t('requirements.createNew')}</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className={`rounded-lg shadow   dark:bg-gray-900 dark:text-white`}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.total')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-lg shadow dark:bg-gray-900 dark:text-white `}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.approved')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.byStatus.APPROVED || 0}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-lg shadow dark:bg-gray-900 dark:text-white`}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.inReview')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.byStatus.REVIEW || 0}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-lg shadow dark:bg-gray-900 dark:text-white `}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('requirements.coverage')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.coverage}%</p>
                                </div>
                                <Target className="h-8 w-8 text-purple-500 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 mb-6">
                    <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
                        <input
                            placeholder={t('requirements.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className={`w-full px-3 py-2 pl-10 text-sm border rounded-lg focus:outline-none    dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                        />
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none   dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('requirements.allTypes')}</option>
                        <option value="FUNCTIONAL">{t('requirements.functional')}</option>
                        <option value="NON_FUNCTIONAL">{t('requirements.nonFunctional')}</option>
                        <option value="BUSINESS">{t('requirements.business')}</option>
                        <option value="TECHNICAL">{t('requirements.technical')}</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none    dark:bg-gray-900 dark:border-gray-700  border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('requirements.allStatuses')}</option>
                        {activeTab === 'rfcs' ? (
                            <>
                                <option value="PROPOSED">{t('requirements.rfc.proposed')}</option>
                                <option value="UNDER_REVIEW">{t('requirements.rfc.under_review')}</option>
                                <option value="APPROVED">{t('requirements.rfc.approved')}</option>
                                <option value="REJECTED">{t('requirements.rfc.rejected')}</option>
                                <option value="IMPLEMENTED">{t('requirements.rfc.implemented')}</option>
                                <option value="CANCELLED">{t('requirements.rfc.cancelled')}</option>
                            </>
                        ) : (
                            <>
                                <option value="DRAFT">{t('requirements.draft')}</option>
                                <option value="REVIEW">{t('requirements.review')}</option>
                                <option value="APPROVED">{t('requirements.approved')}</option>
                                <option value="IMPLEMENTED">{t('requirements.implemented')}</option>
                                <option value="VERIFIED">{t('requirements.verified')}</option>
                                <option value="CLOSED">{t('requirements.closed')}</option>
                            </>
                        )}
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none    dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('requirements.allPriorities')}</option>
                        <option value="LOW">{t('requirements.low')}</option>
                        <option value="MEDIUM">{t('requirements.medium')}</option>
                        <option value="HIGH">{t('requirements.high')}</option>
                        <option value="CRITICAL">{t('requirements.critical')}</option>
                    </select>

                    
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className={`border-b dark:border-gray-700 border-gray-200 mb-6 overflow-x-auto`}>
                    <nav className="-mb-px   space-x-4 md:space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('requirements.overview')}
                        </button>
                        <button
                            onClick={() => setActiveTab('requirements')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'requirements'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('requirements.requirements')}
                        </button>
                        <button
                            onClick={() => setActiveTab('rfcs')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'rfcs'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('requirements.rfcs')}
                        </button>
                        <button
                            onClick={() => setActiveTab('traceability')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'traceability'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('requirements.traceability')}
                        </button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'overview' && (
                        <RequirementsOverview
                            requirements={requirements}
                            rfcs={rfcs}
                            stats={stats}
                            projectId={selectedProjectId}
                            isDark={isDark}
                        />
                    )}

                    {activeTab === 'requirements' && (
                        <RequirementsList
                            requirements={viewMode === 'tree' ? hierarchicalRequirements : requirements}
                            viewMode={viewMode}
                            onSelect={(requirement) => {
                                console.log('Selected requirement:', requirement);
                                setSelectedRequirement(requirement);
                            }}
                            onUpdate={handleUpdateRequirement}
                            onDelete={handleDeleteRequirement}
                            onBaseline={handleBaselineRequirement}
                            isDark={isDark}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'rfcs' && (
                        <RFCList
                            rfcs={rfcs}
                            onSelect={setSelectedRFC}
                            onCreateNew={() => setIsCreateRFCModalOpen(true)}
                            isDark={isDark}
                        />
                    )}

                    {activeTab === 'traceability' && (
                        <TraceabilityMatrix
                            projectId={selectedProjectId}
                            requirements={requirements}
                            isDark={isDark}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateRequirementModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateRequirement}
                    projectId={selectedProjectId}
                    parentRequirement={null}
                    isDark={isDark}
                />
            )}

            <RequirementDetailModal
                isOpen={!!selectedRequirement}
                onClose={() => {
                    console.log('Closing requirement detail modal');
                    setSelectedRequirement(null);
                }}
                requirement={selectedRequirement}
                onUpdate={(id, data) => {
                    handleUpdateRequirement(id, data);
                    setSelectedRequirement(null);
                }}
                onDelete={(id) => {
                    handleDeleteRequirement(id);
                    setSelectedRequirement(null);
                }}
                isDark={isDark}
            />

            {isCreateRFCModalOpen && (
                <CreateRFCModal
                    isOpen={isCreateRFCModalOpen}
                    onClose={() => setIsCreateRFCModalOpen(false)}
                    requirements={requirements}
                    projectId={selectedProjectId}
                    isDark={isDark}
                />
            )}

            {/* Click outside to close menus */}
            {(showExportMenu || showImportMenu) && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => {
                        setShowExportMenu(false);
                        setShowImportMenu(false);
                    }}
                />
            )}
        </div>
    );
};

export default Requirements;