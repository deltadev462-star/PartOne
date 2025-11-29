import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { riskService } from '../services/riskService';
import {
    Plus,
    Filter,
    Download,
    Upload,
    Eye,
    Edit,
    Trash,
    AlertTriangle,
    Shield,
    Target,
    TrendingUp,
    TrendingDown,
    Activity,
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
    BarChart3,
    FolderOpen,
    ArrowRight,
    Users,
    Calendar,
    DollarSign,
    FileText,
    Settings,
    Bell,
    Lightbulb,
    Gauge
} from 'lucide-react';
import RiskOverview from '../components/riskManagement/RiskOverview';
import RiskRegister from '../components/riskManagement/RiskRegister';
import RiskMatrix from '../components/riskManagement/RiskMatrix';
import RiskDetailModal from '../components/riskManagement/RiskDetailModal';
import CreateRiskModal from '../components/riskManagement/CreateRiskModal';
import RiskAssessment from '../components/riskManagement/RiskAssessment';
import RiskResponsePlanning from '../components/riskManagement/RiskResponsePlanning';
import RiskMonitoring from '../components/riskManagement/RiskMonitoring';
import { toast } from 'react-hot-toast';
import {
    exportRisksToExcel,
    exportRisksToCSV,
    exportRisksToPDF,
    importRisksFromExcel,
    downloadRiskTemplate
} from '../services/riskService';

const RiskManagement = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const isDark = useSelector((state) => state.theme.theme === 'dark');
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Risk state
    const [risks, setRisks] = useState([]);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // list, matrix, board
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // Filter state
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        severity: '',
        likelihood: '',
        riskLevel: '',
        owner: '',
        search: ''
    });
    
    // Risk categories
    const riskCategories = {
        TECHNICAL: { name: 'Technical', color: 'blue' },
        SCHEDULE: { name: 'Schedule', color: 'purple' },
        BUDGET: { name: 'Budget', color: 'green' },
        RESOURCE: { name: 'Resource', color: 'yellow' },
        QUALITY: { name: 'Quality', color: 'orange' },
        EXTERNAL: { name: 'External', color: 'red' },
        COMPLIANCE: { name: 'Compliance', color: 'pink' },
        OPERATIONAL: { name: 'Operational', color: 'indigo' }
    };
    
    // Risk statistics
    const [stats, setStats] = useState({
        total: 0,
        byStatus: {},
        byCategory: {},
        bySeverity: {},
        byRiskLevel: {},
        activeRisks: 0,
        mitigatedRisks: 0,
        averageRiskScore: 0,
        criticalRisks: 0
    });

    useEffect(() => {
        if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [projectId]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchRisks();
        }
    }, [selectedProjectId, filters]);

    const handleProjectChange = (newProjectId) => {
        navigate(`/risk-management/${newProjectId}`);
    };

    const fetchRisks = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                toast.error('Authentication required');
                return;
            }
            const data = await riskService.getProjectRisks(selectedProjectId, filters, token);

            
            setRisks(data.risks || []);
            calculateStats(data.risks || []);
        } catch (error) {
            console.error('Error fetching risks:', error);
            toast.error(t('riskManagement.fetchError') || 'Failed to fetch risks');
            setRisks([]);
            calculateStats([]);
        } finally {
            setLoading(false);
        }
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
                        <h1 className="text-3xl font-bold mb-2">{t('riskManagement.title')}</h1>
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('riskManagement.description')}
                        </p>
                    </div>
                    
                    {/* Module Capabilities Preview */}
                    <div className={`rounded-lg shadow-lg p-6 mb-8`}>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-red-500" />
                            {t('riskManagement.moduleFeatures')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('riskManagement.features.identification')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.features.identificationDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="h-5 w-5 text-orange-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('riskManagement.features.assessment')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.features.assessmentDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-green-500 mt-1" />
                                <div>
                                    <p className="font-medium">{t('riskManagement.features.mitigation')}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.features.mitigationDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg md:text-xl font-semibold">
                                {projects.length > 0 ? t('riskManagement.selectProjectTitle') : t('riskManagement.noProjectsAvailable')}
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
                                        } focus:outline-none`}
                                    />
                                </div>
                            )}
                        </div>

                        {projects.length === 0 ? (
                            <div className={`rounded-lg shadow p-8 text-center`}>
                                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">{t('riskManagement.noProjectsFound')}</h3>
                                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.createFirstProject')}
                                </p>
                                <button
                                    onClick={() => navigate('/projects')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                                >
                                    {t('riskManagement.goToProjects')}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className={`rounded-lg shadow p-8 text-center`}>
                                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">{t('riskManagement.noProjectsMatchSearch')}</h3>
                                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.adjustSearchTerms')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleProjectChange(project.id)}
                                        className={`cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-shadow p-6`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                                    {project.description || t('common.noDescription')}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" />
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
                                                <span>{t('riskManagement.startedOn')}: {new Date(project.startDate).toLocaleDateString()}</span>
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

    const calculateStats = (risksList) => {
        const stats = {
            total: risksList.length,
            byStatus: {},
            byCategory: {},
            bySeverity: {},
            byRiskLevel: {},
            activeRisks: 0,
            mitigatedRisks: 0,
            averageRiskScore: 0,
            criticalRisks: 0
        };

        let totalRiskScore = 0;

        risksList.forEach(risk => {
            // Status stats
            stats.byStatus[risk.status] = (stats.byStatus[risk.status] || 0) + 1;
            // Category stats
            stats.byCategory[risk.category] = (stats.byCategory[risk.category] || 0) + 1;
            // Severity stats
            stats.bySeverity[risk.severity] = (stats.bySeverity[risk.severity] || 0) + 1;
            // Risk level stats
            stats.byRiskLevel[risk.riskLevel] = (stats.byRiskLevel[risk.riskLevel] || 0) + 1;
            
            // Count active risks
            if (risk.status === 'ACTIVE' || risk.status === 'MONITORING') {
                stats.activeRisks++;
            }
            
            // Count mitigated risks
            if (risk.status === 'MITIGATED' || risk.status === 'CLOSED') {
                stats.mitigatedRisks++;
            }
            
            // Count critical risks
            if (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'HIGH') {
                stats.criticalRisks++;
            }
            
            // Calculate risk score
            if (risk.riskScore) {
                totalRiskScore += risk.riskScore;
            }
        });

        // Calculate average risk score
        stats.averageRiskScore = risksList.length > 0 
            ? Math.round(totalRiskScore / risksList.length) 
            : 0;

        setStats(stats);
    };

    const handleCreateRisk = async (data) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            const result = await riskService.createRisk({
                ...data,
                projectId: selectedProjectId
            }, token);
            toast.success(t('riskManagement.createSuccess'));
            setIsCreateModalOpen(false);
            fetchRisks();
        } catch (error) {
            toast.error(t('riskManagement.createError'));
        }
    };

    const handleUpdateRisk = async (id, data) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            await riskService.updateRisk(id, data, token);
            toast.success(t('riskManagement.updateSuccess'));
            fetchRisks();
        } catch (error) {
            toast.error(t('riskManagement.updateError'));
        }
    };

    const handleDeleteRisk = async (id) => {
        if (!window.confirm(t('riskManagement.deleteConfirm'))) return;
        
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            
            await riskService.deleteRisk(id, token);
            toast.success(t('riskManagement.deleteSuccess'));
            fetchRisks();
        } catch (error) {
            toast.error(t('riskManagement.deleteError'));
        }
    };

    const handleExport = async (format) => {
        try {
            if (!selectedProjectId) {
                toast.error(t('riskManagement.selectProject'));
                return;
            }

            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const exportFilters = {
                status: filters.status || undefined,
                category: filters.category || undefined,
                severity: filters.severity || undefined,
                riskLevel: filters.riskLevel || undefined
            };

            switch (format) {
                case 'excel':
                    await exportRisksToExcel(selectedProjectId, exportFilters, token);
                    toast.success(t('riskManagement.exportSuccess'));
                    break;
                case 'csv':
                    await exportRisksToCSV(selectedProjectId, exportFilters, token);
                    toast.success(t('riskManagement.exportSuccess'));
                    break;
                case 'pdf':
                    await exportRisksToPDF(selectedProjectId, exportFilters, token);
                    toast.success(t('riskManagement.exportSuccess'));
                    break;
                default:
                    break;
            }
            setShowExportMenu(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error(t('riskManagement.exportError'));
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedProjectId) {
            toast.error(t('riskManagement.selectProject'));
            return;
        }

        const token = await getToken();
        if (!token) {
            toast.error('Authentication required');
            return;
        }

        setIsImporting(true);
        try {
            const result = await importRisksFromExcel(selectedProjectId, file, token);
            toast.success(result.message || t('riskManagement.importSuccess'));
            fetchRisks();
        } catch (error) {
            console.error("Import error:", error);
            const errorMsg = error.response?.data?.message || t('riskManagement.importError');
            toast.error(errorMsg);
            
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

            await downloadRiskTemplate(token);
            toast.success(t('riskManagement.templateDownloaded'));
            setShowImportMenu(false);
        } catch (error) {
            console.error("Template download error:", error);
            toast.error(t('riskManagement.templateDownloadError'));
        }
    };

    const getRiskLevelColor = (level) => {
        const colors = {
            LOW: 'bg-green-500',
            MEDIUM: 'bg-yellow-500',
            HIGH: 'bg-orange-500',
            CRITICAL: 'bg-red-500'
        };
        return colors[level] || 'bg-gray-500';
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            IDENTIFIED: 'bg-gray-500',
            ANALYZING: 'bg-blue-500',
            ACTIVE: 'bg-red-500',
            MONITORING: 'bg-orange-500',
            MITIGATED: 'bg-green-500',
            CLOSED: 'bg-gray-700'
        };
        return colors[status] || 'bg-gray-500';
    };

    // Find current project details
    const currentProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className={`min-h-screen p-3 md:p-6`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex-1 w-full">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{t('riskManagement.title')}</h1>
                        
                        {/* Project Info and Selector */}
                        {currentProject ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.currentProject')}:
                                </p>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                    className={`px-3 py-2 text-sm rounded-lg border font-medium w-full sm:w-auto
                                        dark:bg-[#101010] dark:border-gray-700 dark:text-white border-gray-200
                                    focus:outline-none cursor-pointer transition-colors`}
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
                                {t('riskManagement.description')}
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
                                <span className="text-xs sm:text-sm">{t('riskManagement.export')}</span>
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FileText className="size-4 mr-2" />
                                        {t('riskManagement.exportToExcel')}
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FileText className="size-4 mr-2" />
                                        {t('riskManagement.exportToCSV')}
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FileText className="size-4 mr-2" />
                                        {t('riskManagement.exportToPDF')}
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
                                <span className="text-xs sm:text-sm">{isImporting ? t('riskManagement.importing') : t('riskManagement.import')}</span>
                            </button>
                            {showImportMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                                    <label className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <FileText className="size-4 mr-2" />
                                        {t('riskManagement.importFromExcel')}
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
                                        {t('riskManagement.downloadTemplate')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1 sm:flex-initial"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{t('riskManagement.createNew')}</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className={`rounded-lg shadow dark:bg-gray-900 dark:text-white`}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.totalRisks')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-lg shadow dark:bg-gray-900 dark:text-white`}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.activeRisks')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.activeRisks}</p>
                                </div>
                                <Activity className="h-8 w-8 text-orange-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-lg shadow dark:bg-gray-900 dark:text-white`}>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.mitigatedRisks')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.mitigatedRisks}</p>
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
                                        {t('riskManagement.criticalRisks')}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.criticalRisks}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 mb-6">
                    <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
                        <input
                            placeholder={t('riskManagement.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className={`w-full px-3 py-2 pl-10 text-sm border rounded-lg focus:outline-none dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                        />
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('riskManagement.allCategories')}</option>
                        {Object.entries(riskCategories).map(([key, category]) => (
                            <option key={key} value={key}>{category.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('riskManagement.allStatuses')}</option>
                        <option value="IDENTIFIED">{t('riskManagement.identified')}</option>
                        <option value="ANALYZING">{t('riskManagement.analyzing')}</option>
                        <option value="ACTIVE">{t('riskManagement.active')}</option>
                        <option value="MONITORING">{t('riskManagement.monitoring')}</option>
                        <option value="MITIGATED">{t('riskManagement.mitigated')}</option>
                        <option value="CLOSED">{t('riskManagement.closed')}</option>
                    </select>

                    <select
                        value={filters.riskLevel}
                        onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('riskManagement.allRiskLevels')}</option>
                        <option value="LOW">{t('riskManagement.low')}</option>
                        <option value="MEDIUM">{t('riskManagement.medium')}</option>
                        <option value="HIGH">{t('riskManagement.high')}</option>
                        <option value="CRITICAL">{t('riskManagement.critical')}</option>
                    </select>

                    <select
                        value={filters.likelihood}
                        onChange={(e) => setFilters({ ...filters, likelihood: e.target.value })}
                        className={`w-full sm:w-[150px] md:w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none dark:bg-gray-900 dark:border-gray-700 border-gray-200 dark:text-white`}
                    >
                        <option value="">{t('riskManagement.allLikelihoods')}</option>
                        <option value="RARE">{t('riskManagement.rare')}</option>
                        <option value="UNLIKELY">{t('riskManagement.unlikely')}</option>
                        <option value="POSSIBLE">{t('riskManagement.possible')}</option>
                        <option value="LIKELY">{t('riskManagement.likely')}</option>
                        <option value="ALMOST_CERTAIN">{t('riskManagement.almostCertain')}</option>
                    </select>
                </div>
            </div>

            {/* Tabs - Mobile Grid & Desktop Horizontal */}
            <div>
                {/* Mobile Grid Tabs */}
                <div className={`md:hidden mb-6`}>
                    <nav className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'overview'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('riskManagement.overview')}
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'register'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('riskManagement.riskRegister')}
                        </button>
                        <button
                            onClick={() => setActiveTab('matrix')}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'matrix'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('riskManagement.riskMatrix')}
                        </button>
                        <button
                            onClick={() => setActiveTab('assessment')}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'assessment'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('riskManagement.assessment')}
                        </button>
                        <button
                            onClick={() => setActiveTab('response')}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'response'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('riskManagement.responseTab')}
                        </button>
                        <button
                            onClick={() => setActiveTab('monitoring')}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'monitoring'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('riskManagement.monitoringTab')}
                        </button>
                    </nav>
                </div>

                {/* Desktop Horizontal Tabs */}
                <div className={`hidden md:block border-b dark:border-gray-700 border-gray-200 mb-6`}>
                    <nav className="-mb-px space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'overview'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('riskManagement.overview')}
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'register'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('riskManagement.riskRegister')}
                        </button>
                        <button
                            onClick={() => setActiveTab('matrix')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'matrix'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('riskManagement.riskMatrix')}
                        </button>
                        <button
                            onClick={() => setActiveTab('assessment')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'assessment'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('riskManagement.assessment')}
                        </button>
                        <button
                            onClick={() => setActiveTab('response')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'response'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('riskManagement.responseTab')}
                        </button>
                        <button
                            onClick={() => setActiveTab('monitoring')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'monitoring'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('riskManagement.monitoringTab')}
                        </button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'overview' && (
                        <RiskOverview
                            risks={risks}
                            stats={stats}
                            projectId={selectedProjectId}
                            isDark={isDark}
                            riskCategories={riskCategories}
                        />
                    )}

                    {activeTab === 'register' && (
                        <RiskRegister
                            risks={risks}
                            viewMode={viewMode}
                            onSelect={(risk) => {
                                console.log('Selected risk:', risk);
                                setSelectedRisk(risk);
                            }}
                            onUpdate={handleUpdateRisk}
                            onDelete={handleDeleteRisk}
                            isDark={isDark}
                            loading={loading}
                            riskCategories={riskCategories}
                        />
                    )}

                    {activeTab === 'matrix' && (
                        <RiskMatrix
                            risks={risks}
                            onSelectRisk={(risk) => setSelectedRisk(risk)}
                            isDark={isDark}
                        />
                    )}

                    {activeTab === 'assessment' && (
                        <RiskAssessment
                            risks={risks}
                            onUpdateRisk={handleUpdateRisk}
                            isDark={isDark}
                        />
                    )}

                    {activeTab === 'response' && (
                        <RiskResponsePlanning
                            risks={risks}
                            onUpdateRisk={handleUpdateRisk}
                            isDark={isDark}
                        />
                    )}

                    {activeTab === 'monitoring' && (
                        <RiskMonitoring
                            risks={risks}
                            onUpdateRisk={handleUpdateRisk}
                            isDark={isDark}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateRiskModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateRisk}
                    projectId={selectedProjectId}
                    isDark={isDark}
                    riskCategories={riskCategories}
                />
            )}

            <RiskDetailModal
                isOpen={!!selectedRisk}
                onClose={() => {
                    console.log('Closing risk detail modal');
                    setSelectedRisk(null);
                }}
                risk={selectedRisk}
                onUpdate={(id, data) => {
                    handleUpdateRisk(id, data);
                    setSelectedRisk(null);
                }}
                onDelete={(id) => {
                    handleDeleteRisk(id);
                    setSelectedRisk(null);
                }}
                isDark={isDark}
                riskCategories={riskCategories}
            />

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

export default RiskManagement;