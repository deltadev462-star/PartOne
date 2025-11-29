import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    Progress
} from '@/components/ui';
import {
    Activity,
    Bell,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Clock,
    Calendar,
    Eye,
    RefreshCw,
    Settings,
    BarChart3,
    Shield,
    Target,
    AlertCircle,
    Info,
    ChevronRight,
    Filter,
    Users,
    FileText
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const RiskMonitoring = ({ risks, onUpdateRisk, isDark }) => {
    const { t } = useTranslation();
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [monitoringView, setMonitoringView] = useState('dashboard'); // dashboard, reviews, indicators, escalations
    const [dateRange, setDateRange] = useState('30'); // days
    
    // Calculate monitoring metrics
    const getMonitoringMetrics = () => {
        const now = new Date();
        
        const overdueReviews = risks.filter(r => {
            if (!r.nextReviewDate) return false;
            return new Date(r.nextReviewDate) < now && r.status !== 'CLOSED';
        });
        
        const upcomingReviews = risks.filter(r => {
            if (!r.nextReviewDate) return false;
            const reviewDate = new Date(r.nextReviewDate);
            const daysDiff = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff <= 7;
        });
        
        const activeIndicators = risks.reduce((count, risk) => {
            return count + (risk.indicators?.filter(i => i.active)?.length || 0);
        }, 0);
        
        const triggeredIndicators = risks.reduce((count, risk) => {
            return count + (risk.indicators?.filter(i => i.triggered)?.length || 0);
        }, 0);
        
        const escalatedRisks = risks.filter(r => r.escalated);
        
        const trendsIncreasing = risks.filter(r => r.trend === 'INCREASING');
        const trendsDecreasing = risks.filter(r => r.trend === 'DECREASING');
        
        return {
            overdueReviews: overdueReviews.length,
            upcomingReviews: upcomingReviews.length,
            activeIndicators,
            triggeredIndicators,
            escalatedRisks: escalatedRisks.length,
            trendsIncreasing: trendsIncreasing.length,
            trendsDecreasing: trendsDecreasing.length,
            reviewCompliance: risks.length > 0 
                ? Math.round(((risks.length - overdueReviews.length) / risks.length) * 100)
                : 100
        };
    };
    
    const metrics = getMonitoringMetrics();
    
    // Generate trend data (mock data for demonstration)
    const generateTrendData = () => {
        const days = parseInt(dateRange);
        const data = [];
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toLocaleDateString(),
                totalRisks: Math.floor(Math.random() * 20 + 30),
                activeRisks: Math.floor(Math.random() * 15 + 10),
                mitigatedRisks: Math.floor(Math.random() * 10 + 5),
                newRisks: Math.floor(Math.random() * 5)
            });
        }
        
        return data;
    };
    
    const trendData = generateTrendData();
    
    // Review Schedule Component
    const ReviewSchedule = () => {
        const upcomingReviews = risks
            .filter(r => r.nextReviewDate)
            .sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate))
            .slice(0, 10);
        
        return (
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>{t('riskManagement.monitoring.reviewSchedule')}</CardTitle>
                    <CardDescription>
                        {t('riskManagement.monitoring.reviewScheduleDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {upcomingReviews.map(risk => {
                            const reviewDate = new Date(risk.nextReviewDate);
                            const daysUntil = Math.ceil((reviewDate - new Date()) / (1000 * 60 * 60 * 24));
                            const isOverdue = daysUntil < 0;
                            
                            return (
                                <div
                                    key={risk.id}
                                    className={`p-3 rounded-lg border ${
                                        isOverdue 
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                                            : 'dark:border-gray-700'
                                    } hover:shadow-md transition-shadow cursor-pointer`}
                                    onClick={() => setSelectedRisk(risk)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">{risk.riskId}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    {risk.category}
                                                </Badge>
                                                {isOverdue ? (
                                                    <Badge className="bg-red-500 text-white text-xs">
                                                        {t('riskManagement.monitoring.overdue')}
                                                    </Badge>
                                                ) : daysUntil <= 3 ? (
                                                    <Badge className="bg-yellow-500 text-white text-xs">
                                                        {t('riskManagement.monitoring.dueSoon')}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {risk.title}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {reviewDate.toLocaleDateString()}
                                            </p>
                                            <p className={`text-xs ${
                                                isOverdue ? 'text-red-500' : 'text-gray-500'
                                            }`}>
                                                {isOverdue 
                                                    ? `${Math.abs(daysUntil)} days overdue`
                                                    : `In ${daysUntil} days`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    // Early Warning Indicators Component
    const EarlyWarningIndicators = () => {
        const risksWithIndicators = risks.filter(r => r.indicators && r.indicators.length > 0);
        
        return (
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>{t('riskManagement.monitoring.earlyWarningIndicators')}</CardTitle>
                    <CardDescription>
                        {t('riskManagement.monitoring.earlyWarningDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {risksWithIndicators.length === 0 ? (
                            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('riskManagement.monitoring.noIndicators')}
                            </p>
                        ) : (
                            risksWithIndicators.map(risk => (
                                <div key={risk.id} className="border dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-medium">{risk.riskId}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {risk.title}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {risk.indicators?.filter(i => i.triggered)?.length || 0} / {risk.indicators?.length || 0} triggered
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {risk.indicators?.map((indicator, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-3 p-2 rounded ${
                                                    indicator.triggered 
                                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                        : 'bg-gray-50 dark:bg-gray-800'
                                                }`}
                                            >
                                                {indicator.triggered ? (
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                ) : indicator.active ? (
                                                    <Activity className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                )}
                                                <span className="flex-1 text-sm">{indicator.name || indicator}</span>
                                                {indicator.value && (
                                                    <span className="text-sm font-medium">{indicator.value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    // Escalation Management Component
    const EscalationManagement = () => {
        const escalatedRisks = risks.filter(r => r.escalated || r.riskLevel === 'CRITICAL');
        
        return (
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>{t('riskManagement.monitoring.escalationManagement')}</CardTitle>
                    <CardDescription>
                        {t('riskManagement.monitoring.escalationDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {escalatedRisks.map(risk => (
                            <div
                                key={risk.id}
                                className="p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                            <p className="font-medium">{risk.riskId}</p>
                                            <Badge className="bg-red-500 text-white">
                                                {risk.riskLevel}
                                            </Badge>
                                        </div>
                                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {risk.title}
                                        </p>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.monitoring.escalatedTo')}</p>
                                                <p className="text-sm font-medium">{risk.escalatedTo || 'Management'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.monitoring.escalationDate')}</p>
                                                <p className="text-sm font-medium">
                                                    {risk.escalationDate 
                                                        ? new Date(risk.escalationDate).toLocaleDateString()
                                                        : 'N/A'
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.monitoring.priority')}</p>
                                                <p className="text-sm font-medium">{risk.priority || 'HIGH'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.monitoring.status')}</p>
                                                <p className="text-sm font-medium">{risk.escalationStatus || 'PENDING'}</p>
                                            </div>
                                        </div>
                                        
                                        {risk.escalationNotes && (
                                            <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded">
                                                <p className="text-xs font-medium mb-1">{t('riskManagement.monitoring.notes')}</p>
                                                <p className="text-sm">{risk.escalationNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {escalatedRisks.length === 0 && (
                            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('riskManagement.monitoring.noEscalations')}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    return (
        <div className="space-y-6">
            {/* Monitoring Dashboard Header */}
            <Card className="border-gray-200 dark:bg-[#101010] dark:border-gray-900">
                <CardHeader>
                    <div className="grid grid-cols-2 md:flex md:justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>{t('riskManagement.monitoring.title')}</CardTitle>
                            <CardDescription>
                                {t('riskManagement.monitoring.description')}
                            </CardDescription>
                        </div>
                        <div className="grid grid-cols-1 md:flex items-center gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className={`px-3 py-2 border rounded-lg text-sm  dark:bg-[#101010] dark:border-gray-900 border-gray-200`}
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                            </select>
                            <Button variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {t('common.refresh')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* View Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-4 md:w-150 gap-2 mb-6">
                        {[
                            { key: 'dashboard', label: t('riskManagement.monitoring.dashboard'), icon: <BarChart3 /> },
                            { key: 'reviews', label: t('riskManagement.monitoring.reviews'), icon: <Eye /> },
                            { key: 'indicators', label: t('riskManagement.monitoring.indicators'), icon: <Bell /> },
                            { key: 'escalations', label: t('riskManagement.monitoring.escalations'), icon: <AlertTriangle /> }
                        ].map(view => (
                            <button
                                key={view.key}
                                onClick={() => setMonitoringView(view.key)}
                                className={`flex space-x-2 gap-2 px-4 py-2 rounded-lg transition-colors ${
                                    monitoringView === view.key
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="h-4 w-4">{view.icon}</span>
                                <span>{view.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Metrics Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                <span className="text-2xl font-bold">{metrics.upcomingReviews}</span>
                            </div>
                            <p className="text-sm">{t('riskManagement.monitoring.upcomingReviews')}</p>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="h-5 w-5 text-red-500" />
                                <span className="text-2xl font-bold">{metrics.overdueReviews}</span>
                            </div>
                            <p className="text-sm">{t('riskManagement.monitoring.overdueReviews')}</p>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <Bell className="h-5 w-5 text-yellow-500" />
                                <span className="text-2xl font-bold">{metrics.triggeredIndicators}</span>
                            </div>
                            <p className="text-sm">{t('riskManagement.monitoring.triggeredIndicators')}</p>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                <span className="text-2xl font-bold">{metrics.escalatedRisks}</span>
                            </div>
                            <p className="text-sm">{t('riskManagement.monitoring.escalatedRisks')}</p>
                        </div>
                    </div>
                    
                    {/* Review Compliance */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{t('riskManagement.monitoring.reviewCompliance')}</span>
                            <span className="text-sm font-bold">{metrics.reviewCompliance}%</span>
                        </div>
                        <Progress value={metrics.reviewCompliance} className="h-2" />
                    </div>
                    
                    {/* Trend Chart */}
                    {monitoringView === 'dashboard' && (
                        <div className="space-y-6">
                            <Card className="border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-lg">{t('riskManagement.monitoring.riskTrend')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{ fontSize: 11 }}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="totalRisks"
                                                stackId="1"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                name={t('riskManagement.monitoring.totalRisks')}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="activeRisks"
                                                stackId="2"
                                                stroke="#82ca9d"
                                                fill="#82ca9d"
                                                name={t('riskManagement.monitoring.activeRisks')}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="mitigatedRisks"
                                                stackId="3"
                                                stroke="#ffc658"
                                                fill="#ffc658"
                                                name={t('riskManagement.monitoring.mitigatedRisks')}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            
                            {/* Risk Trends Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">{t('riskManagement.monitoring.increasing')}</p>
                                                <p className="text-2xl font-bold flex items-center gap-2">
                                                    {metrics.trendsIncreasing}
                                                    <TrendingUp className="h-5 w-5 text-red-500" />
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">{t('riskManagement.monitoring.decreasing')}</p>
                                                <p className="text-2xl font-bold flex items-center gap-2">
                                                    {metrics.trendsDecreasing}
                                                    <TrendingDown className="h-5 w-5 text-green-500" />
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Conditional Views */}
            {monitoringView === 'reviews' && <ReviewSchedule />}
            {monitoringView === 'indicators' && <EarlyWarningIndicators />}
            {monitoringView === 'escalations' && <EscalationManagement />}
        </div>
    );
};

export default RiskMonitoring;