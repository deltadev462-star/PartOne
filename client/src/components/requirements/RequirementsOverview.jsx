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
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    Target,
    TrendingUp,
    Users,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    Filter,
    Database,
    GitBranch,
    MessageSquare,
    Paperclip,
    RefreshCcw,
    Shield,
    Settings,
    Link,
    Archive,
    ChevronRight,
    List,
    Eye,
    Hash,
    Edit3,
    FolderOpen,
    Network
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const RequirementsOverview = ({ requirements, rfcs, stats, projectId, isDark }) => {
    const { t } = useTranslation();

    // Calculate additional metrics
    const averageCompletionTime = () => {
        const completed = requirements.filter(r => r.status === 'VERIFIED' || r.status === 'CLOSED');
        if (completed.length === 0) return 0;
        
        const totalDays = completed.reduce((sum, req) => {
            const created = new Date(req.createdAt);
            const updated = new Date(req.updatedAt);
            return sum + Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
        }, 0);
        
        return Math.round(totalDays / completed.length);
    };

    // Prepare chart data
    const statusChartData = Object.entries(stats.byStatus).map(([status, count]) => ({
        name: t(`requirements.status.${status.toLowerCase()}`),
        value: count,
        color: getStatusColor(status)
    }));

    const typeChartData = Object.entries(stats.byType).map(([type, count]) => ({
        name: t(`requirements.type.${type.toLowerCase()}`),
        value: count
    }));

    const priorityChartData = Object.entries(stats.byPriority).map(([priority, count]) => ({
        name: t(`requirements.priority.${priority.toLowerCase()}`),
        value: count,
        color: getPriorityColor(priority)
    }));

    const riskRequirements = requirements.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL');
    const blockedRequirements = requirements.filter(r => r.rfcs?.some(rfc => rfc.status === 'UNDER_REVIEW'));
    const overdue = requirements.filter(r => {
        if (!r.estimatedDeliveryDate) return false;
        return new Date(r.estimatedDeliveryDate) < new Date() && r.status !== 'CLOSED';
    });

    function getStatusColor(status) {
        const colors = {
            DRAFT: '#6B7280',
            REVIEW: '#3B82F6',
            APPROVED: '#10B981',
            IMPLEMENTED: '#8B5CF6',
            VERIFIED: '#14B8A6',
            CLOSED: '#374151'
        };
        return colors[status] || '#6B7280';
    }

    function getPriorityColor(priority) {
        const colors = {
            LOW: '#6B7280',
            MEDIUM: '#F59E0B',
            HIGH: '#FB923C',
            CRITICAL: '#EF4444'
        };
        return colors[priority] || '#6B7280';
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

    const [expandedSections, setExpandedSections] = useState({
        mainModule: true,
        landingPage: true,
        listFeatures: true,
        register: true,
        rfc: true,
        discussions: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Module capabilities data
    const moduleCapabilities = {
        mainModule: {
            title: t('requirements.moduleCapabilities.mainModule.title'),
            description: t('requirements.moduleCapabilities.mainModule.description'),
            icon: <Database className="h-5 w-5" />,
            color: "bg-blue-500",
            features: [
                t('requirements.moduleCapabilities.mainModule.feature1'),
                t('requirements.moduleCapabilities.mainModule.feature2'),
                t('requirements.moduleCapabilities.mainModule.feature3'),
                t('requirements.moduleCapabilities.mainModule.feature4')
            ]
        },
        landingPage: {
            title: t('requirements.moduleCapabilities.landingPage.title'),
            description: t('requirements.moduleCapabilities.landingPage.description'),
            icon: <Eye className="h-5 w-5" />,
            color: "bg-purple-500",
            features: [
                t('requirements.moduleCapabilities.landingPage.feature1'),
                t('requirements.moduleCapabilities.landingPage.feature2'),
                t('requirements.moduleCapabilities.landingPage.feature3'),
                t('requirements.moduleCapabilities.landingPage.feature4')
            ]
        },
        listFeatures: {
            title: t('requirements.moduleCapabilities.listFeatures.title'),
            description: t('requirements.moduleCapabilities.listFeatures.description'),
            icon: <List className="h-5 w-5" />,
            color: "bg-green-500",
            features: [
                t('requirements.moduleCapabilities.listFeatures.feature1'),
                t('requirements.moduleCapabilities.listFeatures.feature2'),
                t('requirements.moduleCapabilities.listFeatures.feature3'),
                t('requirements.moduleCapabilities.listFeatures.feature4')
            ]
        },
        filters: {
            title: t('requirements.moduleCapabilities.filters.title'),
            description: t('requirements.moduleCapabilities.filters.description'),
            icon: <Filter className="h-5 w-5" />,
            color: "bg-yellow-500",
            features: [
                t('requirements.moduleCapabilities.filters.feature1'),
                t('requirements.moduleCapabilities.filters.feature2'),
                t('requirements.moduleCapabilities.filters.feature3'),
                t('requirements.moduleCapabilities.filters.feature4')
            ]
        },
        register: {
            title: t('requirements.moduleCapabilities.register.title'),
            description: t('requirements.moduleCapabilities.register.description'),
            icon: <FolderOpen className="h-5 w-5" />,
            color: "bg-indigo-500",
            features: [
                t('requirements.moduleCapabilities.register.feature1'),
                t('requirements.moduleCapabilities.register.feature2'),
                t('requirements.moduleCapabilities.register.feature3'),
                t('requirements.moduleCapabilities.register.feature4'),
                t('requirements.moduleCapabilities.register.feature5')
            ]
        },
        traceability: {
            title: t('requirements.moduleCapabilities.traceability.title'),
            description: t('requirements.moduleCapabilities.traceability.description'),
            icon: <Network className="h-5 w-5" />,
            color: "bg-teal-500",
            features: [
                t('requirements.moduleCapabilities.traceability.feature1'),
                t('requirements.moduleCapabilities.traceability.feature2'),
                t('requirements.moduleCapabilities.traceability.feature3'),
                t('requirements.moduleCapabilities.traceability.feature4')
            ]
        },
        versioning: {
            title: t('requirements.moduleCapabilities.versioning.title'),
            description: t('requirements.moduleCapabilities.versioning.description'),
            icon: <Archive className="h-5 w-5" />,
            color: "bg-gray-600",
            features: [
                t('requirements.moduleCapabilities.versioning.feature1'),
                t('requirements.moduleCapabilities.versioning.feature2'),
                t('requirements.moduleCapabilities.versioning.feature3'),
                t('requirements.moduleCapabilities.versioning.feature4')
            ]
        },
        rfc: {
            title: t('requirements.moduleCapabilities.rfc.title'),
            description: t('requirements.moduleCapabilities.rfc.description'),
            icon: <RefreshCcw className="h-5 w-5" />,
            color: "bg-orange-500",
            features: [
                t('requirements.moduleCapabilities.rfc.feature1'),
                t('requirements.moduleCapabilities.rfc.feature2'),
                t('requirements.moduleCapabilities.rfc.feature3'),
                t('requirements.moduleCapabilities.rfc.feature4')
            ]
        },
        discussions: {
            title: t('requirements.moduleCapabilities.discussions.title'),
            description: t('requirements.moduleCapabilities.discussions.description'),
            icon: <MessageSquare className="h-5 w-5" />,
            color: "bg-pink-500",
            features: [
                t('requirements.moduleCapabilities.discussions.feature1'),
                t('requirements.moduleCapabilities.discussions.feature2'),
                t('requirements.moduleCapabilities.discussions.feature3'),
                t('requirements.moduleCapabilities.discussions.feature4')
            ]
        }
    };

    return (
        <div className="space-y-6">
            {/* Module Capabilities Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-500" />
                    {t('requirements.moduleCapabilities.title')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(moduleCapabilities).map(([key, module]) => (
                        <Card
                            key={key}
                            className={`hover:shadow-lg transition-shadow cursor-pointer dark:bg-[#101010] dark:border-gray-700 border-gray-200 `}
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

            {/* Feature Highlights */}
            <Card className={`dark:border-blue-950 border-2`}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {t('requirements.moduleCapabilities.keyFeatures')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-start gap-3">
                            <Hash className="h-5 w-5 text-blue-500 mt-1" />
                            <div>
                                <p className="font-medium">{t('requirements.moduleCapabilities.uniqueIds')}</p>
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.moduleCapabilities.uniqueIdsDesc')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <GitBranch className="h-5 w-5 text-green-500 mt-1" />
                            <div>
                                <p className="font-medium">{t('requirements.moduleCapabilities.fullTraceability')}</p>
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.moduleCapabilities.fullTraceabilityDesc')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Edit3 className="h-5 w-5 text-purple-500 mt-1" />
                            <div>
                                <p className="font-medium">{t('requirements.moduleCapabilities.changeManagement')}</p>
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.moduleCapabilities.changeManagementDesc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:mb-4">
                            <div className="mb-2 sm:mb-0">
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.completionRate')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {stats.total > 0 
                                        ? Math.round(((stats.byStatus.VERIFIED || 0) + (stats.byStatus.CLOSED || 0)) / stats.total * 100)
                                        : 0}%
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                            </div>
                        </div>
                        <Progress 
                            value={stats.total > 0 
                                ? ((stats.byStatus.VERIFIED || 0) + (stats.byStatus.CLOSED || 0)) / stats.total * 100
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
                                    {t('requirements.avgCompletionTime')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {averageCompletionTime()}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.days')}
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
                                    {t('requirements.activeRFCs')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {rfcs.filter(rfc => 
                                        ['PROPOSED', 'UNDER_REVIEW'].includes(rfc.status)
                                    ).length}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.changeRequests')}
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="mb-2 sm:mb-0">
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                    {t('requirements.riskItems')}
                                </p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {riskRequirements.length}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('requirements.highCritical')}
                                </p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Status Distribution */}
                <Card  className="dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>{t('requirements.statusDistribution')}</CardTitle>
                        <CardDescription>
                            {t('requirements.statusDistributionDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <RePieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {statusChartData.map((item, index) => (
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

                {/* Type Distribution */}
                <Card className="dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>{t('requirements.typeDistribution')}</CardTitle>
                        <CardDescription>
                            {t('requirements.typeDistributionDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={typeChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Priority Distribution */}
                <Card className="dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>{t('requirements.priorityDistribution')}</CardTitle>
                        <CardDescription>
                            {t('requirements.priorityDistributionDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={priorityChartData} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value">
                                    {priorityChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className={`dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white ${blockedRequirements.length > 0 ? 'border-orange-500' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                            <span>{t('requirements.blockedItems')}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        {blockedRequirements.length === 0 ? (
                            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {t('requirements.noBlockedItems')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {blockedRequirements.slice(0, 5).map((req) => (
                                    <div key={req.id} className="flex items-start gap-2">
                                        <Badge className="bg-orange-500 text-white">
                                            {t('requirements.blocked')}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{req.requirementId}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {req.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {blockedRequirements.length > 5 && (
                                    <p className="text-sm text-blue-600 cursor-pointer">
                                        {t('requirements.viewAll', { count: blockedRequirements.length })}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white  ${overdue.length > 0 ? 'border-red-500' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            <span>{t('requirements.overdueItems')}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        {overdue.length === 0 ? (
                            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {t('requirements.noOverdueItems')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {overdue.slice(0, 5).map((req) => (
                                    <div key={req.id} className="flex items-start gap-2">
                                        <Badge className="bg-red-500 text-white">
                                            {t('requirements.overdue')}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{req.requirementId}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {req.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {overdue.length > 5 && (
                                    <p className="text-sm text-blue-600 cursor-pointer">
                                        {t('requirements.viewAll', { count: overdue.length })}
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

export default RequirementsOverview;