import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui';
import {
    AlertTriangle,
    Edit,
    Trash,
    Eye,
    MoreHorizontal,
    ChevronUp,
    ChevronDown,
    Filter,
    Grid,
    List,
    Download,
    Upload,
    Search,
    Calendar,
    User,
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Shield,
    Activity,
    Target,
    Clock,
    FileText
} from 'lucide-react';

const RiskRegister = ({ 
    risks, 
    viewMode, 
    onSelect, 
    onUpdate, 
    onDelete, 
    isDark, 
    loading, 
    riskCategories 
}) => {
    const { t } = useTranslation();
    const [sortField, setSortField] = useState('riskScore');
    const [sortDirection, setSortDirection] = useState('desc');
    const [expandedRows, setExpandedRows] = useState([]);
    const [selectedRisks, setSelectedRisks] = useState([]);

    // Sort risks
    const sortedRisks = [...risks].sort((a, b) => {
        if (sortField === 'riskScore') {
            return sortDirection === 'asc' 
                ? (a.riskScore || 0) - (b.riskScore || 0)
                : (b.riskScore || 0) - (a.riskScore || 0);
        }
        if (sortField === 'likelihood' || sortField === 'impact') {
            const levels = { RARE: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, ALMOST_CERTAIN: 5 };
            const aVal = levels[a[sortField]] || 0;
            const bVal = levels[b[sortField]] || 0;
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (sortField === 'createdAt' || sortField === 'nextReviewDate') {
            const aDate = new Date(a[sortField] || 0);
            const bDate = new Date(b[sortField] || 0);
            return sortDirection === 'asc' 
                ? aDate.getTime() - bDate.getTime()
                : bDate.getTime() - aDate.getTime();
        }
        return 0;
    });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleRowExpansion = (riskId) => {
        setExpandedRows(prev =>
            prev.includes(riskId)
                ? prev.filter(id => id !== riskId)
                : [...prev, riskId]
        );
    };

    const toggleRiskSelection = (riskId) => {
        setSelectedRisks(prev =>
            prev.includes(riskId)
                ? prev.filter(id => id !== riskId)
                : [...prev, riskId]
        );
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

    const getCategoryIcon = (category) => {
        const icons = {
            TECHNICAL: <Activity className="h-4 w-4" />,
            SCHEDULE: <Clock className="h-4 w-4" />,
            BUDGET: <DollarSign className="h-4 w-4" />,
            RESOURCE: <User className="h-4 w-4" />,
            QUALITY: <Shield className="h-4 w-4" />,
            EXTERNAL: <AlertTriangle className="h-4 w-4" />,
            COMPLIANCE: <FileText className="h-4 w-4" />,
            OPERATIONAL: <Target className="h-4 w-4" />
        };
        return icons[category] || <AlertCircle className="h-4 w-4" />;
    };

    const getTrendIcon = (trend) => {
        if (trend === 'INCREASING') return <TrendingUp className="h-4 w-4 text-red-500" />;
        if (trend === 'DECREASING') return <TrendingDown className="h-4 w-4 text-green-500" />;
        return <Activity className="h-4 w-4 text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (risks.length === 0) {
        return (
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">{t('riskManagement.noRisks')}</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('riskManagement.noRisksDescription')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (viewMode === 'board') {
        // Board view by risk level
        const risksByLevel = {
            CRITICAL: risks.filter(r => r.riskLevel === 'CRITICAL'),
            HIGH: risks.filter(r => r.riskLevel === 'HIGH'),
            MEDIUM: risks.filter(r => r.riskLevel === 'MEDIUM'),
            LOW: risks.filter(r => r.riskLevel === 'LOW')
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(risksByLevel).map(([level, levelRisks]) => (
                    <div key={level} className="space-y-3">
                        <div className={`flex items-center justify-between p-3 rounded-lg ${
                            level === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/20' :
                            level === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/20' :
                            level === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                            'bg-green-100 dark:bg-green-900/20'
                        }`}>
                            <h3 className="font-semibold">{t(`riskManagement.riskLevel.${level.toLowerCase()}`)}</h3>
                            <Badge className={getRiskLevelColor(level) + ' text-white'}>
                                {levelRisks.length}
                            </Badge>
                        </div>
                        
                        <div className="space-y-2">
                            {levelRisks.map(risk => (
                                <Card
                                    key={risk.id}
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                                    onClick={() => onSelect(risk)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-2">
                                                {getCategoryIcon(risk.category)}
                                                <div>
                                                    <p className="font-medium text-sm">{risk.riskId}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {risk.title}
                                                    </p>
                                                </div>
                                            </div>
                                            {getTrendIcon(risk.trend)}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-3">
                                            <Badge className={getStatusBadgeColor(risk.status) + ' text-white text-xs'}>
                                                {risk.status}
                                            </Badge>
                                            {risk.owner && (
                                                <span className={`text-xs flex items-center gap-1 ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                    <User className="h-3 w-3" />
                                                    {risk.owner}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {risk.riskScore && (
                                            <div className="mt-3 pt-3 border-t dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Risk Score</span>
                                                    <span className="font-bold text-lg">{risk.riskScore}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                                    <div 
                                                        className={`${getRiskLevelColor(risk.riskLevel)} h-2 rounded-full`}
                                                        style={{ width: `${risk.riskScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // List/Table view
    return (
        <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
                <CardTitle>{t('riskManagement.riskRegister')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedRisks.length === risks.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRisks(risks.map(r => r.id));
                                            } else {
                                                setSelectedRisks([]);
                                            }
                                        }}
                                        className="rounded border-gray-300 dark:border-gray-600"
                                    />
                                </TableHead>
                                <TableHead>{t('riskManagement.riskId')}</TableHead>
                                <TableHead>{t('riskManagement.title')}</TableHead>
                                <TableHead>{t('riskManagement.category')}</TableHead>
                                <TableHead 
                                    className="cursor-pointer"
                                    onClick={() => handleSort('riskLevel')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('riskManagement.riskLevel')}
                                        {sortField === 'riskLevel' && (
                                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer"
                                    onClick={() => handleSort('riskScore')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('riskManagement.score')}
                                        {sortField === 'riskScore' && (
                                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead>{t('riskManagement.status')}</TableHead>
                                <TableHead>{t('riskManagement.owner')}</TableHead>
                                <TableHead 
                                    className="cursor-pointer"
                                    onClick={() => handleSort('nextReviewDate')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('riskManagement.nextReview')}
                                        {sortField === 'nextReviewDate' && (
                                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead>{t('riskManagement.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRisks.map(risk => (
                                <React.Fragment key={risk.id}>
                                    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedRisks.includes(risk.id)}
                                                onChange={() => toggleRiskSelection(risk.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </TableCell>
                                        <TableCell 
                                            className="font-medium"
                                            onClick={() => toggleRowExpansion(risk.id)}
                                        >
                                            {risk.riskId}
                                        </TableCell>
                                        <TableCell onClick={() => toggleRowExpansion(risk.id)}>
                                            <div className="max-w-xs">
                                                <p className="truncate">{risk.title}</p>
                                                <p className={`text-xs mt-1 truncate ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                    {risk.description}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getCategoryIcon(risk.category)}
                                                <span>{riskCategories[risk.category]?.name || risk.category}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRiskLevelColor(risk.riskLevel) + ' text-white'}>
                                                {risk.riskLevel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{risk.riskScore || 0}</span>
                                                {getTrendIcon(risk.trend)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusBadgeColor(risk.status) + ' text-white'}>
                                                {risk.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {risk.owner && (
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {risk.owner}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {risk.nextReviewDate && (
                                                <span className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(risk.nextReviewDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect(risk);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdate(risk.id, risk);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(risk.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {expandedRows.includes(risk.id) && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="bg-gray-50 dark:bg-gray-800">
                                                <div className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">{t('riskManagement.impact')}</h4>
                                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {risk.impactDescription || t('common.noDescription')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">{t('riskManagement.mitigation')}</h4>
                                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {risk.mitigationStrategy || t('common.noDescription')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">{t('riskManagement.contingency')}</h4>
                                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {risk.contingencyPlan || t('common.noDescription')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {risk.triggers && risk.triggers.length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold mb-2">{t('riskManagement.triggers')}</h4>
                                                            <ul className="list-disc list-inside space-y-1">
                                                                {risk.triggers.map((trigger, idx) => (
                                                                    <li key={idx} className={`text-sm ${
                                                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                                                    }`}>
                                                                        {trigger}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {risk.indicators && risk.indicators.length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold mb-2">{t('riskManagement.indicators')}</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {risk.indicators.map((indicator, idx) => (
                                                                    <Badge key={idx} variant="outline">
                                                                        {indicator}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RiskRegister;