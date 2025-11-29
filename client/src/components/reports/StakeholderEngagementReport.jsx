import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { 
    Users,
    UserCheck,
    UserX,
    MessageSquare,
    Mail,
    Calendar,
    TrendingUp,
    TrendingDown,
    Activity,
    BarChart3,
    PieChart,
    Star,
    AlertCircle,
    CheckCircle,
    Clock,
    Target,
    Heart,
    ThumbsUp,
    ThumbsDown,
    PhoneCall,
    Video,
    FileText,
    ChevronRight,
    GitBranch
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import reportService from '../../services/reportService';

const StakeholderEngagementReport = ({ projectId, filters, isDark, data }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('overview'); // overview, engagement, communications, matrix, satisfaction
    const [reportData, setReportData] = useState({
        summary: {
            totalStakeholders: 0,
            activelyEngaged: 0,
            partiallyEngaged: 0,
            notEngaged: 0,
            engagementRate: 0,
            averageSatisfaction: 0,
            totalCommunications: 0,
            upcomingMeetings: 0
        },
        byCategory: {
            internal: { total: 0, engaged: 0, satisfaction: 0 },
            external: { total: 0, engaged: 0, satisfaction: 0 },
            customer: { total: 0, engaged: 0, satisfaction: 0 },
            partner: { total: 0, engaged: 0, satisfaction: 0 },
            vendor: { total: 0, engaged: 0, satisfaction: 0 }
        },
        byInfluence: {
            high: { total: 0, engaged: 0, satisfaction: 0 },
            medium: { total: 0, engaged: 0, satisfaction: 0 },
            low: { total: 0, engaged: 0, satisfaction: 0 }
        },
        engagementMatrix: {
            highPowerHighInterest: [],
            highPowerLowInterest: [],
            lowPowerHighInterest: [],
            lowPowerLowInterest: []
        },
        communications: {
            meetings: [],
            emails: [],
            reports: [],
            reviews: []
        },
        stakeholderList: [],
        satisfactionTrends: [],
        engagementActivities: [],
        communicationEffectiveness: {
            responseRate: 0,
            averageResponseTime: 0,
            feedbackScore: 0,
            actionItemsCompleted: 0
        }
    });

    useEffect(() => {
        if (projectId) {
            fetchReportData();
        }
    }, [projectId, filters, data]);

    const fetchReportData = async () => {
        if (data) {
            // If data is passed from parent, merge it with default structure
            setReportData(prevData => ({
                ...prevData,
                ...data,
                byCategory: data.byCategory || prevData.byCategory,
                byInfluence: data.byInfluence || prevData.byInfluence,
                engagementMatrix: data.engagementMatrix || prevData.engagementMatrix,
                communications: data.communications || prevData.communications,
                stakeholderList: data.stakeholderList || prevData.stakeholderList,
                satisfactionTrends: data.satisfactionTrends || prevData.satisfactionTrends,
                engagementActivities: data.engagementActivities || prevData.engagementActivities,
                communicationEffectiveness: data.communicationEffectiveness || prevData.communicationEffectiveness
            }));
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
            const reportData = await reportService.getStakeholderEngagementReport(projectId, filters, token);
            setReportData(reportData);
        } catch (error) {
            console.error('Error fetching stakeholder engagement report:', error);
            toast.error(t('reports.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const getEngagementColor = (rate) => {
        if (rate >= 80) return 'green';
        if (rate >= 60) return 'yellow';
        if (rate >= 40) return 'orange';
        return 'red';
    };

    const getSatisfactionIcon = (score) => {
        if (score >= 4.5) return ThumbsUp;
        if (score >= 3.5) return Activity;
        if (score >= 2.5) return ThumbsDown;
        return AlertCircle;
    };

    const getSatisfactionColor = (score) => {
        if (score >= 4) return 'green';
        if (score >= 3) return 'yellow';
        if (score >= 2) return 'orange';
        return 'red';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const { summary, byCategory, byInfluence, engagementMatrix, communications, stakeholderList, satisfactionTrends, engagementActivities, communicationEffectiveness } = reportData;

    return (
        <div className="p-6">
            {/* Report Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('reports.stakeholderEngagementReport')}</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('reports.generatedOn')}: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.totalStakeholders')}
                            </p>
                            <p className="text-2xl font-bold">{summary.totalStakeholders}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.engagementRate')}
                            </p>
                            <p className={`text-2xl font-bold text-${getEngagementColor(summary.engagementRate)}-500`}>
                                {summary.engagementRate}%
                            </p>
                        </div>
                        <UserCheck className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.avgSatisfaction')}
                            </p>
                            <p className={`text-2xl font-bold text-${getSatisfactionColor(summary.averageSatisfaction)}-500`}>
                                {summary.averageSatisfaction}/5
                            </p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-500 opacity-50" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('reports.totalCommunications')}
                            </p>
                            <p className="text-2xl font-bold">{summary.totalCommunications}</p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-purple-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['overview', 'engagement', 'communications', 'matrix', 'satisfaction'].map((mode) => (
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
                    {/* Engagement Overview */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.engagementOverview')}</h3>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm">{t('reports.overallEngagement')}</span>
                                    <span className="font-bold text-2xl">{summary.engagementRate}%</span>
                                </div>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                    <div 
                                        className={`bg-${getEngagementColor(summary.engagementRate)}-500 h-4 rounded-full`}
                                        style={{ width: `${summary.engagementRate}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-500">{summary.activelyEngaged}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.activelyEngaged')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-500">{summary.partiallyEngaged}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.partiallyEngaged')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">{summary.notEngaged}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.notEngaged')}</p>
                            </div>
                        </div>
                    </div>

                    {/* By Category */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.engagementByCategory')}</h3>
                        <div className="space-y-4">
                            {byCategory && Object.entries(byCategory).map(([category, data]) => (
                                <div key={category}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium capitalize">{category}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm">{data.engaged}/{data.total} engaged</span>
                                            <span className={`text-sm text-${getSatisfactionColor(data.satisfaction)}-500`}>
                                                {data.satisfaction.toFixed(1)} satisfaction
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div 
                                            className={`bg-${getEngagementColor((data.engaged / data.total) * 100)}-500 h-3 rounded-full`}
                                            style={{ width: `${(data.engaged / data.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Communication Effectiveness */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.communicationEffectiveness')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.responseRate')}
                                </p>
                                <p className="text-xl font-bold">{communicationEffectiveness.responseRate}%</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.avgResponseTime')}
                                </p>
                                <p className="text-xl font-bold">{communicationEffectiveness.averageResponseTime} days</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.feedbackScore')}
                                </p>
                                <p className="text-xl font-bold">{communicationEffectiveness.feedbackScore}/5</p>
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('reports.actionItemsComplete')}
                                </p>
                                <p className="text-xl font-bold">{communicationEffectiveness.actionItemsCompleted}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'engagement' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4">{t('reports.stakeholderEngagementDetails')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className="text-left py-2">{t('reports.stakeholder')}</th>
                                    <th className="text-left py-2">{t('reports.role')}</th>
                                    <th className="text-center py-2">{t('reports.influence')}</th>
                                    <th className="text-center py-2">{t('reports.interest')}</th>
                                    <th className="text-center py-2">{t('reports.engagement')}</th>
                                    <th className="text-center py-2">{t('reports.satisfaction')}</th>
                                    <th className="text-center py-2">{t('reports.lastContact')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stakeholderList && stakeholderList.length > 0 ? (
                                    stakeholderList.map((stakeholder, index) => (
                                        <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <td className="py-3">{stakeholder.name}</td>
                                            <td className="py-3">{stakeholder.role}</td>
                                            <td className="text-center py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    stakeholder.influence === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                    stakeholder.influence === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                    {stakeholder.influence}
                                                </span>
                                            </td>
                                            <td className="text-center py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    stakeholder.interest === 'High' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    stakeholder.interest === 'Medium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {stakeholder.interest}
                                                </span>
                                            </td>
                                            <td className="text-center py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`text-${getEngagementColor(stakeholder.engagement)}-500`}>
                                                        {stakeholder.engagement}%
                                                    </span>
                                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`bg-${getEngagementColor(stakeholder.engagement)}-500 h-2 rounded-full`}
                                                            style={{ width: `${stakeholder.engagement}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center py-3">
                                                <span className={`text-${getSatisfactionColor(stakeholder.satisfaction)}-500`}>
                                                    {stakeholder.satisfaction}/5
                                                </span>
                                            </td>
                                            <td className="text-center py-3 text-sm">
                                                {stakeholder.lastContact}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-gray-500">
                                            {t('reports.noStakeholderData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'communications' && (
                <div className="space-y-6">
                    {/* Recent Communications */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.recentCommunications')}</h3>
                        <div className="space-y-3">
                            {engagementActivities && engagementActivities.length > 0 && engagementActivities.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {activity.type === 'Meeting' && <Calendar className="h-5 w-5 text-blue-500" />}
                                        {activity.type === 'Email' && <Mail className="h-5 w-5 text-green-500" />}
                                        {activity.type === 'Workshop' && <Users className="h-5 w-5 text-purple-500" />}
                                        {activity.type === 'Review' && <FileText className="h-5 w-5 text-orange-500" />}
                                        {activity.type === 'Demo' && <Video className="h-5 w-5 text-pink-500" />}
                                        <div>
                                            <p className="font-medium">{activity.activity}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {activity.date} • {activity.participants || activity.recipients} {activity.recipients ? t('reports.recipients') : t('reports.participants')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Communication Channels */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.communicationChannels')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium mb-2">{t('reports.meetings')}</h4>
                                {communications.meetings && communications.meetings.length > 0 && communications.meetings.map((meeting, index) => (
                                    <div key={index} className="mb-2 text-sm">
                                        <p>{meeting.type} - {meeting.date}</p>
                                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {meeting.attendees} {t('reports.attendees')} • {meeting.satisfaction}/5 {t('reports.satisfaction')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">{t('reports.emails')}</h4>
                                {communications.emails && communications.emails.length > 0 && communications.emails.map((email, index) => (
                                    <div key={index} className="mb-2 text-sm">
                                        <p>{email.subject} - {email.date}</p>
                                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {email.opened}/{email.recipients} {t('reports.opened')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'matrix' && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        {t('reports.stakeholderMatrix')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* High Power, High Interest */}
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border-2 border-red-500`}>
                            <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">{t('reports.manageClosely')}</h4>
                            <p className="text-xs mb-3">{t('reports.highPowerHighInterest')}</p>
                            {engagementMatrix.highPowerHighInterest && engagementMatrix.highPowerHighInterest.length > 0 && engagementMatrix.highPowerHighInterest.map((stakeholder, index) => (
                                <div key={index} className="mb-2">
                                    <p className="font-medium">{stakeholder.name}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {stakeholder.role} • {stakeholder.engagement}% {t('reports.engaged')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* High Power, Low Interest */}
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'} border-2 border-orange-500`}>
                            <h4 className="font-medium mb-2 text-orange-600 dark:text-orange-400">{t('reports.keepSatisfied')}</h4>
                            <p className="text-xs mb-3">{t('reports.highPowerLowInterest')}</p>
                            {engagementMatrix.highPowerLowInterest && engagementMatrix.highPowerLowInterest.length > 0 && engagementMatrix.highPowerLowInterest.map((stakeholder, index) => (
                                <div key={index} className="mb-2">
                                    <p className="font-medium">{stakeholder.name}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {stakeholder.role} • {stakeholder.engagement}% engaged
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Low Power, High Interest */}
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border-2 border-blue-500`}>
                            <h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">{t('reports.keepInformed')}</h4>
                            <p className="text-xs mb-3">{t('reports.lowPowerHighInterest')}</p>
                            {engagementMatrix.lowPowerHighInterest && engagementMatrix.lowPowerHighInterest.length > 0 && engagementMatrix.lowPowerHighInterest.map((stakeholder, index) => (
                                <div key={index} className="mb-2">
                                    <p className="font-medium">{stakeholder.name}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {stakeholder.role} • {stakeholder.engagement}% engaged
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Low Power, Low Interest */}
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-2 border-gray-400`}>
                            <h4 className="font-medium mb-2 text-gray-600 dark:text-gray-400">{t('reports.monitor')}</h4>
                            <p className="text-xs mb-3">{t('reports.lowPowerLowInterest')}</p>
                            {engagementMatrix.lowPowerLowInterest && engagementMatrix.lowPowerLowInterest.length > 0 && engagementMatrix.lowPowerLowInterest.map((stakeholder, index) => (
                                <div key={index} className="mb-2">
                                    <p className="font-medium">{stakeholder.name}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {stakeholder.role} • {stakeholder.engagement}% engaged
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'satisfaction' && (
                <div className="space-y-6">
                    {/* Satisfaction Trends */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.satisfactionTrends')}</h3>
                        <div className="space-y-3">
                            {satisfactionTrends && satisfactionTrends.length > 0 && satisfactionTrends.map((trend, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="font-medium">{trend.month}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Heart className={`h-4 w-4 text-${getSatisfactionColor(trend.satisfaction)}-500`} />
                                            <span>{trend.satisfaction}/5</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{trend.responseRate}% response</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Satisfaction by Influence */}
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.satisfactionByInfluence')}</h3>
                        <div className="space-y-4">
                            {byInfluence && Object.entries(byInfluence).map(([influence, data]) => (
                                <div key={influence}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium capitalize">{influence} Influence</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm">{data.engaged}/{data.total} {t('reports.engaged')}</span>
                                            <span className={`text-${getSatisfactionColor(data.satisfaction)}-500`}>
                                                {data.satisfaction.toFixed(1)}/5
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div 
                                            className={`bg-${getSatisfactionColor(data.satisfaction)}-500 h-3 rounded-full`}
                                            style={{ width: `${(data.satisfaction / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StakeholderEngagementReport;