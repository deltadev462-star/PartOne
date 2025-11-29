import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Progress,
    Badge
} from '@/components/ui';
import {
    AlertTriangle,
    Shield,
    Activity,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    BarChart3,
    PieChart,
    Target,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    Eye,
    DollarSign,
    Gauge,
    List,
    Settings,
    Bell,
    FileText
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const RiskOverview = ({ risks, stats, projectId, isDark, riskCategories }) => {
    const { t } = useTranslation();

    const [expandedSections, setExpandedSections] = useState({
        framework: true,
        register: true,
        identification: true,
        assessment: true,
        response: true,
        monitoring: true,
        reporting: true,
        integration: true,
        security: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Calculate additional metrics
    const calculateMetrics = () => {
        const highImpactRisks = risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
        const recentRisks = risks.filter(r => {
            const created = new Date(r.createdAt);
            const daysSince = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
            return daysSince <= 7;
        });

        const upcomingReviews = risks.filter(r => {
            if (!r.nextReviewDate) return false;
            const reviewDate = new Date(r.nextReviewDate);
            const daysUntil = Math.floor((reviewDate - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 7 && daysUntil >= 0;
        });

        return {
            highImpactCount: highImpactRisks.length,
            recentCount: recentRisks.length,
            upcomingReviewsCount: upcomingReviews.length,
            avgResponseTime: calculateAverageResponseTime()
        };
    };

    const calculateAverageResponseTime = () => {
        const respondedRisks = risks.filter(r => r.responseDate);
        if (respondedRisks.length === 0) return 0;
        
        const totalDays = respondedRisks.reduce((sum, risk) => {
            const created = new Date(risk.createdAt);
            const responded = new Date(risk.responseDate);
            return sum + Math.ceil((responded - created) / (1000 * 60 * 60 * 24));
        }, 0);
        
        return Math.round(totalDays / respondedRisks.length);
    };

    const metrics = calculateMetrics();

    // Prepare chart data
    const categoryChartData = Object.entries(stats.byCategory || {}).map(([category, count]) => ({
        name: riskCategories[category]?.name || category,
        value: count,
        color: getColorForCategory(category)
    }));

    const statusChartData = Object.entries(stats.byStatus || {}).map(([status, count]) => ({
        name: t(`riskManagement.status.${status.toLowerCase()}`),
        value: count,
        color: getStatusColor(status)
    }));

    const riskLevelData = Object.entries(stats.byRiskLevel || {}).map(([level, count]) => ({
        name: t(`riskManagement.riskLevel.${level.toLowerCase()}`),
        value: count,
        color: getRiskLevelColor(level)
    }));

    // Risk trend data (mock data for demonstration)
    const riskTrendData = [
        { month: 'Jan', identified: 5, mitigated: 3, active: 8 },
        { month: 'Feb', identified: 7, mitigated: 4, active: 11 },
        { month: 'Mar', identified: 6, mitigated: 6, active: 11 },
        { month: 'Apr', identified: 8, mitigated: 5, active: 14 },
        { month: 'May', identified: 4, mitigated: 7, active: 11 },
        { month: 'Jun', identified: 6, mitigated: 8, active: 9 }
    ];

    function getColorForCategory(category) {
        const colors = {
            TECHNICAL: '#3B82F6',
            SCHEDULE: '#8B5CF6',
            BUDGET: '#10B981',
            RESOURCE: '#F59E0B',
            QUALITY: '#FB923C',
            EXTERNAL: '#EF4444',
            COMPLIANCE: '#EC4899',
            OPERATIONAL: '#6366F1'
        };
        return colors[category] || '#6B7280';
    }

    function getStatusColor(status) {
        const colors = {
            IDENTIFIED: '#6B7280',
            ANALYZING: '#3B82F6',
            ACTIVE: '#EF4444',
            MONITORING: '#FB923C',
            MITIGATED: '#10B981',
            CLOSED: '#374151'
        };
        return colors[status] || '#6B7280';
    }

    function getRiskLevelColor(level) {
        const colors = {
            LOW: '#10B981',
            MEDIUM: '#F59E0B',
            HIGH: '#FB923C',
            CRITICAL: '#EF4444'
        };
        return colors[level] || '#6B7280';
    }

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                className="text-xs font-medium"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // Module capabilities data
    const moduleCapabilities = {
        framework: {
            title: t('riskManagement.capabilities.framework.title'),
            description: t('riskManagement.capabilities.framework.description'),
            icon: <Settings className="h-5 w-5" />,
            color: "bg-blue-500",
            features: [
                t('riskManagement.capabilities.framework.feature1'),
                t('riskManagement.capabilities.framework.feature2'),
                t('riskManagement.capabilities.framework.feature3'),
                t('riskManagement.capabilities.framework.feature4')
            ]
        },
        register: {
            title: t('riskManagement.capabilities.register.title'),
            description: t('riskManagement.capabilities.register.description'),
            icon: <FileText className="h-5 w-5" />,
            color: "bg-purple-500",
            features: [
                t('riskManagement.capabilities.register.feature1'),
                t('riskManagement.capabilities.register.feature2'),
                t('riskManagement.capabilities.register.feature3'),
                t('riskManagement.capabilities.register.feature4'),
                t('riskManagement.capabilities.register.feature5')
            ]
        },
        identification: {
            title: t('riskManagement.capabilities.identification.title'),
            description: t('riskManagement.capabilities.identification.description'),
            icon: <Eye className="h-5 w-5" />,
            color: "bg-green-500",
            features: [
                t('riskManagement.capabilities.identification.feature1'),
                t('riskManagement.capabilities.identification.feature2'),
                t('riskManagement.capabilities.identification.feature3'),
                t('riskManagement.capabilities.identification.feature4')
            ]
        },
        assessment: {
            title: t('riskManagement.capabilities.assessment.title'),
            description: t('riskManagement.capabilities.assessment.description'),
            icon: <Gauge className="h-5 w-5" />,
            color: "bg-yellow-500",
            features: [
                t('riskManagement.capabilities.assessment.feature1'),
                t('riskManagement.capabilities.assessment.feature2'),
                t('riskManagement.capabilities.assessment.feature3'),
                t('riskManagement.capabilities.assessment.feature4')
            ]
        },
        response: {
            title: t('riskManagement.capabilities.response.title'),
            description: t('riskManagement.capabilities.response.description'),
            icon: <Target className="h-5 w-5" />,
            color: "bg-indigo-500",
            features: [
                t('riskManagement.capabilities.response.feature1'),
                t('riskManagement.capabilities.response.feature2'),
                t('riskManagement.capabilities.response.feature3'),
                t('riskManagement.capabilities.response.feature4')
            ]
        },
        monitoring: {
            title: t('riskManagement.capabilities.monitoring.title'),
            description: t('riskManagement.capabilities.monitoring.description'),
            icon: <Activity className="h-5 w-5" />,
            color: "bg-orange-500",
            features: [
                t('riskManagement.capabilities.monitoring.feature1'),
                t('riskManagement.capabilities.monitoring.feature2'),
                t('riskManagement.capabilities.monitoring.feature3'),
                t('riskManagement.capabilities.monitoring.feature4')
            ]
        },
        reporting: {
            title: t('riskManagement.capabilities.reporting.title'),
            description: t('riskManagement.capabilities.reporting.description'),
            icon: <BarChart3 className="h-5 w-5" />,
            color: "bg-teal-500",
            features: [
                t('riskManagement.capabilities.reporting.feature1'),
                t('riskManagement.capabilities.reporting.feature2'),
                t('riskManagement.capabilities.reporting.feature3'),
                t('riskManagement.capabilities.reporting.feature4')
            ]
        },
        integration: {
            title: t('riskManagement.capabilities.integration.title'),
            description: t('riskManagement.capabilities.integration.description'),
            icon: <Shield className="h-5 w-5" />,
            color: "bg-pink-500",
            features: [
                t('riskManagement.capabilities.integration.feature1'),
                t('riskManagement.capabilities.integration.feature2'),
                t('riskManagement.capabilities.integration.feature3'),
                t('riskManagement.capabilities.integration.feature4'),
                t('riskManagement.capabilities.integration.feature5'),
                t('riskManagement.capabilities.integration.feature6')
            ]
        },
        security: {
            title: t('riskManagement.capabilities.security.title'),
            description: t('riskManagement.capabilities.security.description'),
            icon: <Shield className="h-5 w-5" />,
            color: "bg-gray-600",
            features: [
                t('riskManagement.capabilities.security.feature1'),
                t('riskManagement.capabilities.security.feature2'),
                t('riskManagement.capabilities.security.feature3'),
                t('riskManagement.capabilities.security.feature4')
            ]
        }
    };

    return (
        <div className="space-y-6">
            {/* Module Capabilities Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-red-500" />
                    {t('riskManagement.moduleCapabilities.title')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(moduleCapabilities).map(([key, module]) => (
                        <Card
                            key={key}
                            className={`hover:shadow-lg transition-shadow cursor-pointer dark:bg-[#101010] dark:border-gray-700 border-gray-200`}
                            onClick={() => toggleSection(key)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${module.color} text-white flex-shrink-0`}>
                                            {module.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                                {module.title}
                                                <ChevronRight className={`h-4 w-4 transition-transform ${
                                                    expandedSections[key] ? 'rotate-90' : ''
                                                }`} />
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {module.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            {expandedSections[key] && (
                                <CardContent>
                                    <ul className="space-y-2">
                                        {module.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:mb-4">
                            <div className="mb-2 sm:mb-0">
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.mitigation')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {stats.total > 0 
                                        ? Math.round((stats.mitigatedRisks / stats.total) * 100)
                                        : 0}%
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                            </div>
                        </div>
                        <Progress 
                            value={stats.total > 0 
                                ? (stats.mitigatedRisks / stats.total) * 100
                                : 0}
                            className="h-2"
                        />
                    </CardContent>
                </Card>

                <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="mb-2 sm:mb-0">
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                    {t('riskManagement.avgResponseTime')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {metrics.avgResponseTime}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.days')}
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="mb-2 sm:mb-0">
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                    {t('riskManagement.avgRiskScore')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {stats.averageRiskScore}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.outOf100')}
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <Gauge className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="mb-2 sm:mb-0">
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                    {t('riskManagement.highImpact')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {metrics.highImpactCount}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.risks')}
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Category Distribution */}
                <Card className="dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>{t('riskManagement.categoryDistribution')}</CardTitle>
                        <CardDescription>
                            {t('riskManagement.categoryDistributionDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <RePieChart>
                                <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {categoryChartData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Risk Level Distribution */}
                <Card className="dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>{t('riskManagement.riskLevelDistribution')}</CardTitle>
                        <CardDescription>
                            {t('riskManagement.riskLevelDistributionDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={riskLevelData} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value">
                                    {riskLevelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Risk Trend */}
                <Card className="dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>{t('riskManagement.riskTrend')}</CardTitle>
                        <CardDescription>
                            {t('riskManagement.riskTrendDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={riskTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="identified" stackId="a" fill="#6B7280" />
                                <Bar dataKey="mitigated" stackId="a" fill="#10B981" />
                                <Bar dataKey="active" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className={`dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white ${metrics.recentCount > 0 ? 'border-orange-500' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                            <span>{t('riskManagement.recentRisks')}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        {metrics.recentCount === 0 ? (
                            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {t('riskManagement.noRecentRisks')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {risks.filter(r => {
                                    const created = new Date(r.createdAt);
                                    const daysSince = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
                                    return daysSince <= 7;
                                }).slice(0, 5).map((risk) => (
                                    <div key={risk.id} className="flex items-start gap-2">
                                        <Badge className={`${getRiskLevelColor(risk.riskLevel)} text-white`}>
                                            {risk.riskLevel}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{risk.riskId}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {risk.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {metrics.recentCount > 5 && (
                                    <p className="text-sm text-blue-600 cursor-pointer">
                                        {t('riskManagement.viewAll', { count: metrics.recentCount })}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white ${metrics.upcomingReviewsCount > 0 ? 'border-blue-500' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                            <span>{t('riskManagement.upcomingReviews')}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        {metrics.upcomingReviewsCount === 0 ? (
                            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {t('riskManagement.noUpcomingReviews')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {risks.filter(r => {
                                    if (!r.nextReviewDate) return false;
                                    const reviewDate = new Date(r.nextReviewDate);
                                    const daysUntil = Math.floor((reviewDate - new Date()) / (1000 * 60 * 60 * 24));
                                    return daysUntil <= 7 && daysUntil >= 0;
                                }).slice(0, 5).map((risk) => (
                                    <div key={risk.id} className="flex items-start gap-2">
                                        <Badge className="bg-blue-500 text-white">
                                            {new Date(risk.nextReviewDate).toLocaleDateString()}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{risk.riskId}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {risk.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {metrics.upcomingReviewsCount > 5 && (
                                    <p className="text-sm text-blue-600 cursor-pointer">
                                        {t('riskManagement.viewAll', { count: metrics.upcomingReviewsCount })}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RiskOverview;