import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { 
    CheckCircle,
    Circle,
    XCircle,
    AlertCircle,
    Target,
    FileText,
    GitBranch,
    Link,
    TestTube,
    Shield,
    TrendingUp,
    BarChart3,
    Activity,
    AlertTriangle,
    List,
    ChevronRight,
    Package,
    Layers,
    Database,
    Code
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RequirementsCoverageReport = ({ projectId, filters, isDark }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('overview'); // overview, traceability, coverage, gaps
    const [reportData, setReportData] = useState({
        summary: {
            totalRequirements: 0,
            coveredRequirements: 0,
            partialCoverage: 0,
            noCoverage: 0,
            coveragePercentage: 0,
            requirementsWithTests: 0,
            requirementsWithTasks: 0,
            requirementsImplemented: 0
        },
        byType: {
            functional: { total: 0, covered: 0, percentage: 0 },
            nonFunctional: { total: 0, covered: 0, percentage: 0 },
            technical: { total: 0, covered: 0, percentage: 0 },
            business: { total: 0, covered: 0, percentage: 0 }
        },
        byPriority: {
            critical: { total: 0, covered: 0, percentage: 0 },
            high: { total: 0, covered: 0, percentage: 0 },
            medium: { total: 0, covered: 0, percentage: 0 },
            low: { total: 0, covered: 0, percentage: 0 }
        },
        traceabilityMatrix: {
            requirements: [],
            tasks: [],
            tests: [],
            mappings: []
        },
        coverageDetails: [],
        gaps: [],
        testCoverage: {
            totalTests: 0,
            passingTests: 0,
            failingTests: 0,
            pendingTests: 0,
            testExecutionRate: 0
        },
        implementationStatus: {
            notStarted: 0,
            inProgress: 0,
            implemented: 0,
            verified: 0
        }
    });

    useEffect(() => {
        if (projectId) {
            fetchReportData();
        }
    }, [projectId, filters]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            // TODO: Replace with actual API call
            // const response = await fetch(`/api/reports/requirements-coverage/${projectId}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}`
            //     }
            // });
            // const data = await response.json();
            // setReportData(data);

            // Simulated data
            setReportData({
                summary: {
                    totalRequirements: 85,
                    coveredRequirements: 68,
                    partialCoverage: 12,
                    noCoverage: 5,
                    coveragePercentage: 80,
                    requirementsWithTests: 62,
                    requirementsWithTasks: 75,
                    requirementsImplemented: 58
                },
                byType: {
                    functional: { total: 45, covered: 40, percentage: 89 },
                    nonFunctional: { total: 20, covered: 15, percentage: 75 },
                    technical: { total: 12, covered: 8, percentage: 67 },
                    business: { total: 8, covered: 5, percentage: 63 }
                },
                byPriority: {
                    critical: { total: 15, covered: 15, percentage: 100 },
                    high: { total: 25, covered: 23, percentage: 92 },
                    medium: { total: 30, covered: 22, percentage: 73 },
                    low: { total: 15, covered: 8, percentage: 53 }
                },
                traceabilityMatrix: {
                    requirements: [
                        { id: 'REQ-001', title: 'User Authentication', priority: 'CRITICAL', type: 'Functional' },
                        { id: 'REQ-002', title: 'Dashboard Analytics', priority: 'HIGH', type: 'Functional' },
                        { id: 'REQ-003', title: 'Data Export', priority: 'MEDIUM', type: 'Functional' },
                        { id: 'REQ-004', title: 'Performance Optimization', priority: 'HIGH', type: 'Non-Functional' },
                        { id: 'REQ-005', title: 'Security Compliance', priority: 'CRITICAL', type: 'Non-Functional' }
                    ],
                    tasks: [
                        { id: 'TASK-001', title: 'Implement JWT authentication' },
                        { id: 'TASK-002', title: 'Create dashboard components' },
                        { id: 'TASK-003', title: 'Add export functionality' },
                        { id: 'TASK-004', title: 'Optimize database queries' },
                        { id: 'TASK-005', title: 'Security audit' }
                    ],
                    tests: [
                        { id: 'TEST-001', title: 'Authentication test suite' },
                        { id: 'TEST-002', title: 'Dashboard integration tests' },
                        { id: 'TEST-003', title: 'Export feature tests' },
                        { id: 'TEST-004', title: 'Performance benchmarks' },
                        { id: 'TEST-005', title: 'Security penetration tests' }
                    ],
                    mappings: [
                        { requirementId: 'REQ-001', taskIds: ['TASK-001'], testIds: ['TEST-001'] },
                        { requirementId: 'REQ-002', taskIds: ['TASK-002'], testIds: ['TEST-002'] },
                        { requirementId: 'REQ-003', taskIds: ['TASK-003'], testIds: ['TEST-003'] },
                        { requirementId: 'REQ-004', taskIds: ['TASK-004'], testIds: ['TEST-004'] },
                        { requirementId: 'REQ-005', taskIds: ['TASK-005'], testIds: ['TEST-005'] }
                    ]
                },
                coverageDetails: [
                    { 
                        id: 'REQ-001', 
                        title: 'User Authentication', 
                        priority: 'CRITICAL',
                        hasTasks: true, 
                        hasTests: true, 
                        implemented: true, 
                        verified: true,
                        coverage: 100 
                    },
                    { 
                        id: 'REQ-002', 
                        title: 'Dashboard Analytics', 
                        priority: 'HIGH',
                        hasTasks: true, 
                        hasTests: true, 
                        implemented: true, 
                        verified: false,
                        coverage: 85 
                    },
                    { 
                        id: 'REQ-003', 
                        title: 'Data Export', 
                        priority: 'MEDIUM',
                        hasTasks: true, 
                        hasTests: false, 
                        implemented: false, 
                        verified: false,
                        coverage: 40 
                    },
                    { 
                        id: 'REQ-004', 
                        title: 'Performance Optimization', 
                        priority: 'HIGH',
                        hasTasks: true, 
                        hasTests: true, 
                        implemented: false, 
                        verified: false,
                        coverage: 60 
                    },
                    { 
                        id: 'REQ-005', 
                        title: 'Security Compliance', 
                        priority: 'CRITICAL',
                        hasTasks: false, 
                        hasTests: false, 
                        implemented: false, 
                        verified: false,
                        coverage: 0 
                    }
                ],
                gaps: [
                    { 
                        requirement: 'REQ-005', 
                        title: 'Security Compliance', 
                        type: 'No Tasks', 
                        severity: 'CRITICAL',
                        description: 'No tasks assigned to this critical requirement' 
                    },
                    { 
                        requirement: 'REQ-003', 
                        title: 'Data Export', 
                        type: 'No Tests', 
                        severity: 'MEDIUM',
                        description: 'Missing test coverage for export functionality' 
                    },
                    { 
                        requirement: 'REQ-004', 
                        title: 'Performance Optimization', 
                        type: 'Not Implemented', 
                        severity: 'HIGH',
                        description: 'Tasks exist but implementation not started' 
                    }
                ],
                testCoverage: {
                    totalTests: 45,
                    passingTests: 38,
                    failingTests: 3,
                    pendingTests: 4,
                    testExecutionRate: 84
                },
                implementationStatus: {
                    notStarted: 15,
                    inProgress: 12,
                    implemented: 48,
                    verified: 10
                }
            });
        } catch (error) {
            console.error('Error fetching requirements coverage report:', error);
            toast.error(t('reports.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const getCoverageColor = (percentage) => {
        if (percentage >= 80) return 'green';
        if (percentage >= 60) return 'yellow';
        if (percentage >= 40) return 'orange';
        return 'red';
    };

    const getCoverageIcon = (coverage) => {
        if (coverage >= 80) return CheckCircle;
        if (coverage >= 60) return AlertCircle;
        if (coverage >= 40) return Circle;
        return XCircle;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const { summary, byType, byPriority, traceabilityMatrix, coverageDetails, gaps, testCoverage, implementationStatus } = reportData;

    return (
        <div className="p-6">
            {/* Report Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('reports.requirementsCoverageReport')}</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('reports.generatedOn')}: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* Overall Coverage */}
            <div className={`rounded-lg p-6 mb-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-semibold mb-4">{t('reports.overallCoverage')}</h3>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">{t('reports.requirementsCoverage')}</span>
                            <span className="font-bold text-2xl">{summary.coveragePercentage}%</span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div 
                                className={`bg-${getCoverageColor(summary.coveragePercentage)}-500 h-4 rounded-full`}
                                style={{ width: `${summary.coveragePercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{summary.coveredRequirements}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.fullyCovered')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-500">{summary.partialCoverage}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.partialCoverage')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{summary.noCoverage}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.noCoverage')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{summary.totalRequirements}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.totalRequirements')}</p>
                    </div>
                </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2 mb-6">
                {['overview', 'traceability', 'coverage', 'gaps'].map((mode) => (
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
            {viewMode === 'overview' && (
                <div className="space-y-6">
                    {/* Coverage by Type */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            {t('reports.coverageByType')}
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(byType).map(([type, data]) => (
                                <div key={type}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium capitalize">{type}</span>
                                        <span>{data.covered}/{data.total} ({data.percentage}%)</span>
                                    </div>
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div 
                                            className={`bg-${getCoverageColor(data.percentage)}-500 h-3 rounded-full`}
                                            style={{ width: `${data.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coverage by Priority */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            {t('reports.coverageByPriority')}
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(byPriority).map(([priority, data]) => {
                                const Icon = getCoverageIcon(data.percentage);
                                return (
                                    <div key={priority} className="flex items-center gap-4">
                                        <Icon className={`h-5 w-5 text-${getCoverageColor(data.percentage)}-500`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium capitalize">{priority} Priority</span>
                                                <span>{data.covered}/{data.total} ({data.percentage}%)</span>
                                            </div>
                                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div 
                                                    className={`bg-${getCoverageColor(data.percentage)}-500 h-3 rounded-full`}
                                                    style={{ width: `${data.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Test Coverage */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TestTube className="h-5 w-5" />
                            {t('reports.testCoverage')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.totalTests')}</p>
                                <p className="text-xl font-bold">{testCoverage.totalTests}</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.passing')}</p>
                                <p className="text-xl font-bold text-green-500">{testCoverage.passingTests}</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.failing')}</p>
                                <p className="text-xl font-bold text-red-500">{testCoverage.failingTests}</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.pending')}</p>
                                <p className="text-xl font-bold text-yellow-500">{testCoverage.pendingTests}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'traceability' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        {t('reports.traceabilityMatrix')}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className="text-left py-2">{t('reports.requirement')}</th>
                                    <th className="text-left py-2">{t('reports.priority')}</th>
                                    <th className="text-left py-2">{t('reports.type')}</th>
                                    <th className="text-center py-2">{t('reports.tasks')}</th>
                                    <th className="text-center py-2">{t('reports.tests')}</th>
                                    <th className="text-center py-2">{t('reports.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {traceabilityMatrix.requirements.map((req, index) => {
                                    const mapping = traceabilityMatrix.mappings.find(m => m.requirementId === req.id);
                                    return (
                                        <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <td className="py-3">
                                                <div>
                                                    <p className="font-medium">{req.id}</p>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{req.title}</p>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    req.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                    req.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    req.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                    {req.priority}
                                                </span>
                                            </td>
                                            <td className="py-3">{req.type}</td>
                                            <td className="text-center py-3">
                                                {mapping?.taskIds?.length > 0 ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="text-center py-3">
                                                {mapping?.testIds?.length > 0 ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="text-center py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link className="h-4 w-4" />
                                                    <span className="text-sm">Linked</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'coverage' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4">{t('reports.detailedCoverage')}</h3>
                    <div className="space-y-4">
                        {coverageDetails.map((requirement, index) => (
                            <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-medium">{requirement.id}: {requirement.title}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Priority: {requirement.priority}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            requirement.coverage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            requirement.coverage >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            requirement.coverage >= 40 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {requirement.coverage}% Coverage
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-3">
                                    <div className="flex items-center gap-1">
                                        {requirement.hasTasks ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm">Tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {requirement.hasTests ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm">Tests</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {requirement.implemented ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm">Implemented</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {requirement.verified ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm">Verified</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'gaps' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {t('reports.coverageGaps')}
                    </h3>
                    <div className="space-y-4">
                        {gaps.map((gap, index) => (
                            <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                gap.severity === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                                gap.severity === 'HIGH' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                                gap.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                                'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                            }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium">{gap.requirement}: {gap.title}</p>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {gap.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            gap.type === 'No Tasks' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                            gap.type === 'No Tests' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {gap.type}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            gap.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                            gap.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {gap.severity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequirementsCoverageReport;