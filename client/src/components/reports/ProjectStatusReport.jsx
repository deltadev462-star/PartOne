import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { 
    AlertCircle,
    CheckCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    AlertTriangle,
    DollarSign,
    FileText,
    ChevronRight,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProjectStatusReport = ({ projectId, filters, isDark, data }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Set default values for all nested objects
    const defaultReportData = {
        project: null,
        overview: {
            status: '',
            health: 'green',
            progress: 0,
            startDate: null,
            endDate: null,
            duration: 0,
            budget: 0,
            spent: 0,
            remaining: 0
        },
        scope: {
            totalRequirements: 0,
            completedRequirements: 0,
            inProgressRequirements: 0,
            pendingRequirements: 0,
            scopeChanges: 0,
            lastChange: null
        },
        schedule: {
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            upcomingTasks: 0,
            milestones: [],
            criticalPath: [],
            scheduleVariance: 0
        },
        risks: {
            totalRisks: 0,
            activeRisks: 0,
            mitigatedRisks: 0,
            criticalRisks: 0,
            riskScore: 0,
            topRisks: []
        },
        issues: {
            totalIssues: 0,
            openIssues: 0,
            resolvedIssues: 0,
            criticalIssues: 0,
            topIssues: []
        },
        team: {
            totalMembers: 0,
            activeMembers: 0,
            workload: [],
            productivity: 0
        },
        stakeholders: {
            total: 0,
            engaged: 0,
            satisfaction: 0,
            communicationLog: []
        }
    };
    
    // Use data passed from parent or set default values
    const reportData = data || defaultReportData;
    
    // Ensure all nested objects exist
    const {
        overview = defaultReportData.overview,
        scope = defaultReportData.scope,
        schedule = defaultReportData.schedule,
        risks = defaultReportData.risks,
        issues = defaultReportData.issues,
        team = defaultReportData.team,
        stakeholders = defaultReportData.stakeholders
    } = reportData;

    const getHealthColor = (health) => {
        switch (health) {
            case 'green': return 'text-green-500';
            case 'yellow': return 'text-yellow-500';
            case 'red': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getRAGStatus = (value, thresholds = { green: 80, yellow: 60 }) => {
        if (value >= thresholds.green) return { color: 'green', icon: CheckCircle };
        if (value >= thresholds.yellow) return { color: 'yellow', icon: AlertCircle };
        return { color: 'red', icon: AlertTriangle };
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Report Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('reports.projectStatusReport')}</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('reports.generatedOn')}: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* Executive Summary */}
            <div className={`rounded-lg p-6 mb-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {t('reports.executiveSummary')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('reports.overallStatus')}
                        </p>
                        <p className={`text-xl font-bold ${getHealthColor(overview.health)}`}>
                            {overview.status}
                        </p>
                    </div>
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('reports.progress')}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold">{overview.progress}%</p>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${overview.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('reports.budgetUtilization')}
                        </p>
                        <p className="text-xl font-bold">
                            {overview?.budget > 0 ? Math.round((overview.spent / overview.budget) * 100) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* RAG Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Scope RAG */}
                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{t('reports.scope')}</h4>
                        {(() => {
                            const completion = scope.totalRequirements > 0
                                ? (scope.completedRequirements / scope.totalRequirements) * 100
                                : 0;
                            const status = getRAGStatus(completion);
                            const Icon = status.icon;
                            return <Icon className={`h-5 w-5 text-${status.color}-500`} />;
                        })()}
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>{t('reports.requirements')}: {scope.completedRequirements}/{scope.totalRequirements}</p>
                        <p>{t('reports.scopeChanges')}: {scope.scopeChanges}</p>
                    </div>
                </div>

                {/* Schedule RAG */}
                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{t('reports.schedule')}</h4>
                        {(() => {
                            const onTime = schedule.totalTasks > 0
                                ? ((schedule.totalTasks - schedule.overdueTasks) / schedule.totalTasks) * 100
                                : 100;
                            const status = getRAGStatus(onTime, { green: 95, yellow: 90 });
                            const Icon = status.icon;
                            return <Icon className={`h-5 w-5 text-${status.color}-500`} />;
                        })()}
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>{t('reports.tasksComplete')}: {schedule.completedTasks}/{schedule.totalTasks}</p>
                        <p>{t('reports.overdueTasks')}: {schedule.overdueTasks}</p>
                    </div>
                </div>

                {/* Risk RAG */}
                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{t('reports.risks')}</h4>
                        {(() => {
                            const riskHealth = risks.criticalRisks === 0 ? 'green' : 
                                              risks.criticalRisks <= 2 ? 'yellow' : 'red';
                            const status = getRAGStatus(
                                riskHealth === 'green' ? 100 : riskHealth === 'yellow' ? 70 : 30
                            );
                            const Icon = status.icon;
                            return <Icon className={`h-5 w-5 text-${status.color}-500`} />;
                        })()}
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>{t('reports.activeRisks')}: {risks.activeRisks}</p>
                        <p>{t('reports.criticalRisks')}: {risks.criticalRisks}</p>
                    </div>
                </div>

                {/* Issues RAG */}
                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{t('reports.issues')}</h4>
                        {(() => {
                            const issueHealth = issues.criticalIssues === 0 ? 'green' : 
                                               issues.criticalIssues <= 2 ? 'yellow' : 'red';
                            const status = getRAGStatus(
                                issueHealth === 'green' ? 100 : issueHealth === 'yellow' ? 70 : 30
                            );
                            const Icon = status.icon;
                            return <Icon className={`h-5 w-5 text-${status.color}-500`} />;
                        })()}
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>{t('reports.openIssues')}: {issues.openIssues}</p>
                        <p>{t('reports.resolvedIssues')}: {issues.resolvedIssues}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-6">
                {/* Milestones */}
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {t('reports.milestones')}
                    </h3>
                    <div className="space-y-3">
                        {schedule.milestones && schedule.milestones.length > 0 ? schedule.milestones.map((milestone, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                        milestone.status === 'completed' ? 'bg-green-500' :
                                        milestone.status === 'in_progress' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                    }`} />
                                    <span className="font-medium">{milestone.name}</span>
                                </div>
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {milestone.date}
                                </span>
                            </div>
                        )) : (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.noMilestonesAvailable')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Top Risks */}
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {t('reports.topRisks')}
                    </h3>
                    <div className="space-y-3">
                        {risks.topRisks && risks.topRisks.length > 0 ? risks.topRisks.map((risk, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span>{risk.name}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                    risk.level === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    risk.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                    {risk.level}
                                </span>
                            </div>
                        )) : (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.noRisksIdentified')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Team Productivity */}
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {t('reports.teamProductivity')}
                    </h3>
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span>{t('reports.overallProductivity')}</span>
                            <span className="font-bold">{team.productivity}%</span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${team.productivity}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {team.workload && team.workload.length > 0 ? team.workload.map((member, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <span>{member.member}</span>
                                <span>{member.tasks} tasks ({Math.round((member.tasks / member.capacity) * 100)}% capacity)</span>
                            </div>
                        )) : (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.noTeamData')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectStatusReport;