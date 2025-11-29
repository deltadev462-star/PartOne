import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    X, 
    Edit, 
    Save, 
    Trash, 
    AlertTriangle, 
    Calendar,
    User,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    Shield,
    Target,
    DollarSign,
    FileText,
    MessageSquare,
    Link,
    History,
    ChevronRight
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Badge,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Button
} from '@/components/ui';

const RiskDetailModal = ({ 
    isOpen, 
    onClose, 
    risk, 
    onUpdate, 
    onDelete, 
    isDark,
    riskCategories 
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [editData, setEditData] = useState(risk || {});
    const [newComment, setNewComment] = useState('');
    
    if (!isOpen || !risk) return null;
    
    const handleSave = () => {
        onUpdate(risk.id, editData);
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if (window.confirm(t('riskManagement.deleteConfirm'))) {
            onDelete(risk.id);
        }
    };
    
    const addComment = () => {
        if (newComment.trim()) {
            const comment = {
                id: Date.now(),
                text: newComment,
                author: 'Current User', // This should come from auth context
                timestamp: new Date().toISOString()
            };
            
            const updatedRisk = {
                ...risk,
                comments: [...(risk.comments || []), comment]
            };
            
            onUpdate(risk.id, updatedRisk);
            setNewComment('');
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
    
    const getStatusColor = (status) => {
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
    
    const getTrendIcon = (trend) => {
        if (trend === 'INCREASING') return <TrendingUp className="h-4 w-4 text-red-500" />;
        if (trend === 'DECREASING') return <TrendingDown className="h-4 w-4 text-green-500" />;
        return <Activity className="h-4 w-4 text-gray-500" />;
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span>{risk.riskId}</span>
                            <Badge className={getRiskLevelColor(risk.riskLevel) + ' text-white'}>
                                {risk.riskLevel}
                            </Badge>
                            <Badge className={getStatusColor(risk.status) + ' text-white'}>
                                {risk.status}
                            </Badge>
                            {getTrendIcon(risk.trend)}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-green-500"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.title || ''}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            />
                        ) : (
                            risk.title
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">{t('riskManagement.tabs.overview')}</TabsTrigger>
                        <TabsTrigger value="assessment">{t('riskManagement.tabs.assessment')}</TabsTrigger>
                        <TabsTrigger value="response">{t('riskManagement.tabs.response')}</TabsTrigger>
                        <TabsTrigger value="monitoring">{t('riskManagement.tabs.monitoring')}</TabsTrigger>
                        <TabsTrigger value="history">{t('riskManagement.tabs.history')}</TabsTrigger>
                    </TabsList>
                    
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('riskManagement.detail.description')}
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg ${
                                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                            }`}
                                            rows={3}
                                        />
                                    ) : (
                                        <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {risk.description}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('riskManagement.detail.category')}
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editData.category || ''}
                                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg ${
                                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                            }`}
                                        >
                                            {Object.entries(riskCategories).map(([key, category]) => (
                                                <option key={key} value={key}>{category.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {riskCategories[risk.category]?.name || risk.category}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('riskManagement.detail.owner')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.owner || ''}
                                            onChange={(e) => setEditData({ ...editData, owner: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg ${
                                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                            }`}
                                        />
                                    ) : (
                                        <p className={`mt-1 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <User className="h-4 w-4" />
                                            {risk.owner || 'Unassigned'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('riskManagement.detail.riskScore')}
                                    </label>
                                    <p className="mt-1">
                                        <span className="text-2xl font-bold">{risk.riskScore || 0}</span>
                                        <span className="text-sm text-gray-500"> / 100</span>
                                    </p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                        <div 
                                            className={`${getRiskLevelColor(risk.riskLevel)} h-2 rounded-full`}
                                            style={{ width: `${risk.riskScore || 0}%` }}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('riskManagement.detail.dates')}
                                    </label>
                                    <div className="space-y-1 mt-1">
                                        <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <Calendar className="h-3 w-3" />
                                            {t('riskManagement.detail.created')}: {new Date(risk.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <Clock className="h-3 w-3" />
                                            {t('riskManagement.detail.updated')}: {new Date(risk.updatedAt || risk.createdAt).toLocaleDateString()}
                                        </p>
                                        {risk.nextReviewDate && (
                                            <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                <Target className="h-3 w-3" />
                                                {t('riskManagement.detail.nextReview')}: {new Date(risk.nextReviewDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {risk.estimatedCost && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            {t('riskManagement.detail.estimatedCost')}
                                        </label>
                                        <p className={`mt-1 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <DollarSign className="h-4 w-4" />
                                            ${risk.estimatedCost.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Triggers and Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {risk.triggers && risk.triggers.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        {t('riskManagement.detail.triggers')}
                                    </label>
                                    <div className="space-y-1">
                                        {risk.triggers.map((trigger, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400" />
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {trigger}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {risk.indicators && risk.indicators.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        {t('riskManagement.detail.indicators')}
                                    </label>
                                    <div className="space-y-1">
                                        {risk.indicators.map((indicator, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <Activity className="h-4 w-4 mt-0.5 text-gray-400" />
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {indicator}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    
                    {/* Assessment Tab */}
                    <TabsContent value="assessment" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.likelihood')}
                                </label>
                                {isEditing ? (
                                    <select
                                        value={editData.likelihood || ''}
                                        onChange={(e) => setEditData({ ...editData, likelihood: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <option value="RARE">{t('riskManagement.likelihood.rare')}</option>
                                        <option value="UNLIKELY">{t('riskManagement.likelihood.unlikely')}</option>
                                        <option value="POSSIBLE">{t('riskManagement.likelihood.possible')}</option>
                                        <option value="LIKELY">{t('riskManagement.likelihood.likely')}</option>
                                        <option value="ALMOST_CERTAIN">{t('riskManagement.likelihood.almostCertain')}</option>
                                    </select>
                                ) : (
                                    <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {risk.likelihood}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.impact')}
                                </label>
                                {isEditing ? (
                                    <select
                                        value={editData.impact || editData.severity || ''}
                                        onChange={(e) => setEditData({ ...editData, impact: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <option value="INSIGNIFICANT">{t('riskManagement.impact.insignificant')}</option>
                                        <option value="MINOR">{t('riskManagement.impact.minor')}</option>
                                        <option value="MODERATE">{t('riskManagement.impact.moderate')}</option>
                                        <option value="MAJOR">{t('riskManagement.impact.major')}</option>
                                        <option value="CATASTROPHIC">{t('riskManagement.impact.catastrophic')}</option>
                                    </select>
                                ) : (
                                    <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {risk.impact || risk.severity}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.detectability')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.detectability || 'Not assessed'}
                                </p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.velocity')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.velocity || 'Not assessed'}
                                </p>
                            </div>
                        </div>
                        
                        {risk.cause && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.cause')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.cause}
                                </p>
                            </div>
                        )}
                        
                        {risk.effect && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.effect')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.effect}
                                </p>
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Response Tab */}
                    <TabsContent value="response" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.responseStrategy')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.responseStrategy || 'Not defined'}
                                </p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.responseOwner')}
                                </label>
                                <p className={`mt-1 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <User className="h-4 w-4" />
                                    {risk.responseOwner || 'Unassigned'}
                                </p>
                            </div>
                        </div>
                        
                        {risk.mitigationStrategy && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.mitigationStrategy')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.mitigationStrategy}
                                </p>
                            </div>
                        )}
                        
                        {risk.contingencyPlan && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.contingencyPlan')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.contingencyPlan}
                                </p>
                            </div>
                        )}
                        
                        {risk.existingControls && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.existingControls')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.existingControls}
                                </p>
                            </div>
                        )}
                        
                        {risk.proposedControls && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.proposedControls')}
                                </label>
                                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {risk.proposedControls}
                                </p>
                            </div>
                        )}
                        
                        {risk.actions && risk.actions.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-2 block">
                                    {t('riskManagement.detail.actions')}
                                </label>
                                <div className="space-y-2">
                                    {risk.actions.map((action, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                            <Shield className="h-4 w-4 mt-0.5 text-blue-500" />
                                            <div className="flex-1">
                                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {action.description || action}
                                                </p>
                                                {action.status && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        {action.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Monitoring Tab */}
                    <TabsContent value="monitoring" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.status')}
                                </label>
                                {isEditing ? (
                                    <select
                                        value={editData.status || ''}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <option value="IDENTIFIED">{t('riskManagement.status.identified')}</option>
                                        <option value="ANALYZING">{t('riskManagement.status.analyzing')}</option>
                                        <option value="ACTIVE">{t('riskManagement.status.active')}</option>
                                        <option value="MONITORING">{t('riskManagement.status.monitoring')}</option>
                                        <option value="MITIGATED">{t('riskManagement.status.mitigated')}</option>
                                        <option value="CLOSED">{t('riskManagement.status.closed')}</option>
                                    </select>
                                ) : (
                                    <Badge className={getStatusColor(risk.status) + ' text-white mt-1'}>
                                        {risk.status}
                                    </Badge>
                                )}
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.trend')}
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    {getTrendIcon(risk.trend)}
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                        {risk.trend || 'Stable'}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('riskManagement.detail.nextReview')}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editData.nextReviewDate || ''}
                                        onChange={(e) => setEditData({ ...editData, nextReviewDate: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        }`}
                                    />
                                ) : (
                                    <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {risk.nextReviewDate ? new Date(risk.nextReviewDate).toLocaleDateString() : 'Not scheduled'}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {risk.escalated && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-900 dark:text-red-100">
                                            {t('riskManagement.detail.escalated')}
                                        </p>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                            {t('riskManagement.detail.escalatedTo')}: {risk.escalatedTo || 'Management'}
                                        </p>
                                        {risk.escalationDate && (
                                            <p className="text-sm text-red-700 dark:text-red-300">
                                                {t('riskManagement.detail.escalationDate')}: {new Date(risk.escalationDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Comments Section */}
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-2 block">
                                {t('riskManagement.detail.comments')}
                            </label>
                            <div className="space-y-2 mb-3">
                                {risk.comments && risk.comments.length > 0 ? (
                                    risk.comments.map((comment, idx) => (
                                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-medium text-sm">{comment.author}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(comment.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {comment.text}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('riskManagement.detail.noComments')}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                                    className={`flex-1 px-3 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                    placeholder={t('riskManagement.detail.addComment')}
                                />
                                <Button onClick={addComment} size="sm">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                    
                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                        <div className="space-y-3">
                            {risk.history && risk.history.length > 0 ? (
                                risk.history.map((entry, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 border dark:border-gray-700 rounded-lg">
                                        <History className="h-4 w-4 mt-0.5 text-gray-400" />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {entry.action}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                by {entry.user}
                                            </p>
                                            {entry.changes && (
                                                <div className="mt-2 text-xs">
                                                    {Object.entries(entry.changes).map(([field, value]) => (
                                                        <p key={field}>
                                                            <span className="font-medium">{field}:</span> {value.from} → {value.to}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.detail.noHistory')}
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default RiskDetailModal;