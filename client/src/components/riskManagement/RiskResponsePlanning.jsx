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
    Target,
    Shield,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Users,
    Calendar,
    FileText,
    Settings,
    TrendingUp,
    TrendingDown,
    Activity,
    Lightbulb,
    ChevronRight,
    Plus,
    Edit,
    Trash,
    Save,
    X
} from 'lucide-react';

const RiskResponsePlanning = ({ risks, onUpdateRisk, isDark }) => {
    const { t } = useTranslation();
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [editingResponse, setEditingResponse] = useState(null);
    const [showResponseForm, setShowResponseForm] = useState(false);
    
    // Response strategies
    const responseStrategies = {
        AVOID: {
            name: t('riskManagement.response.avoid'),
            description: t('riskManagement.response.avoidDesc'),
            icon: <X className="h-5 w-5" />,
            color: 'bg-red-500'
        },
        MITIGATE: {
            name: t('riskManagement.response.mitigate'),
            description: t('riskManagement.response.mitigateDesc'),
            icon: <Shield className="h-5 w-5" />,
            color: 'bg-orange-500'
        },
        TRANSFER: {
            name: t('riskManagement.response.transfer'),
            description: t('riskManagement.response.transferDesc'),
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'bg-blue-500'
        },
        ACCEPT: {
            name: t('riskManagement.response.accept'),
            description: t('riskManagement.response.acceptDesc'),
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'bg-green-500'
        },
        EXPLOIT: {
            name: t('riskManagement.response.exploit'),
            description: t('riskManagement.response.exploitDesc'),
            icon: <Lightbulb className="h-5 w-5" />,
            color: 'bg-purple-500'
        },
        SHARE: {
            name: t('riskManagement.response.share'),
            description: t('riskManagement.response.shareDesc'),
            icon: <Users className="h-5 w-5" />,
            color: 'bg-indigo-500'
        },
        ENHANCE: {
            name: t('riskManagement.response.enhance'),
            description: t('riskManagement.response.enhanceDesc'),
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'bg-teal-500'
        }
    };
    
    // Response status
    const responseStatus = {
        planned: risks.filter(r => r.responseStrategy && !r.responseImplemented),
        implemented: risks.filter(r => r.responseImplemented),
        needsPlanning: risks.filter(r => !r.responseStrategy),
        overdue: risks.filter(r => {
            if (!r.responseDeadline) return false;
            return new Date(r.responseDeadline) < new Date() && !r.responseImplemented;
        })
    };
    
    // Calculate residual risk
    const calculateResidualRisk = (risk) => {
        if (!risk.riskScore || !risk.responseEffectiveness) return risk.riskScore || 0;
        return Math.round(risk.riskScore * (1 - risk.responseEffectiveness / 100));
    };
    
    // Response Form Component
    const ResponseForm = ({ risk, onSave, onCancel }) => {
        const [formData, setFormData] = useState({
            responseStrategy: risk.responseStrategy || '',
            mitigationStrategy: risk.mitigationStrategy || '',
            contingencyPlan: risk.contingencyPlan || '',
            fallbackPlan: risk.fallbackPlan || '',
            responseOwner: risk.responseOwner || '',
            responseDeadline: risk.responseDeadline || '',
            responseCost: risk.responseCost || '',
            responseEffectiveness: risk.responseEffectiveness || 50,
            acceptanceCriteria: risk.acceptanceCriteria || '',
            triggers: risk.triggers || [],
            actions: risk.actions || []
        });
        
        const [newAction, setNewAction] = useState('');
        const [newTrigger, setNewTrigger] = useState('');
        
        const addAction = () => {
            if (newAction.trim()) {
                setFormData({
                    ...formData,
                    actions: [...formData.actions, { id: Date.now(), description: newAction, status: 'PENDING' }]
                });
                setNewAction('');
            }
        };
        
        const removeAction = (id) => {
            setFormData({
                ...formData,
                actions: formData.actions.filter(a => a.id !== id)
            });
        };
        
        const addTrigger = () => {
            if (newTrigger.trim()) {
                setFormData({
                    ...formData,
                    triggers: [...formData.triggers, newTrigger]
                });
                setNewTrigger('');
            }
        };
        
        const removeTrigger = (index) => {
            setFormData({
                ...formData,
                triggers: formData.triggers.filter((_, i) => i !== index)
            });
        };
        
        return (
            <Card className="border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t('riskManagement.response.planResponse')}: {risk.riskId}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Response Strategy */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.response.strategy')}
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(responseStrategies).map(([key, strategy]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFormData({ ...formData, responseStrategy: key })}
                                        className={`p-3 rounded-lg border-2 transition-colors ${
                                            formData.responseStrategy === key
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 justify-center">
                                            {strategy.icon}
                                            <span className="text-sm">{strategy.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Mitigation Strategy */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.response.mitigationStrategy')}
                            </label>
                            <textarea
                                value={formData.mitigationStrategy}
                                onChange={(e) => setFormData({ ...formData, mitigationStrategy: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                                rows={3}
                                placeholder={t('riskManagement.response.mitigationStrategyPlaceholder')}
                            />
                        </div>
                        
                        {/* Contingency Plan */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.response.contingencyPlan')}
                            </label>
                            <textarea
                                value={formData.contingencyPlan}
                                onChange={(e) => setFormData({ ...formData, contingencyPlan: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                                rows={3}
                                placeholder={t('riskManagement.response.contingencyPlanPlaceholder')}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Response Owner */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('riskManagement.response.owner')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.responseOwner}
                                    onChange={(e) => setFormData({ ...formData, responseOwner: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                    placeholder={t('riskManagement.response.ownerPlaceholder')}
                                />
                            </div>
                            
                            {/* Response Deadline */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('riskManagement.response.deadline')}
                                </label>
                                <input
                                    type="date"
                                    value={formData.responseDeadline}
                                    onChange={(e) => setFormData({ ...formData, responseDeadline: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>
                            
                            {/* Response Cost */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('riskManagement.response.cost')}
                                </label>
                                <input
                                    type="number"
                                    value={formData.responseCost}
                                    onChange={(e) => setFormData({ ...formData, responseCost: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                />
                            </div>
                            
                            {/* Response Effectiveness */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('riskManagement.response.effectiveness')}: {formData.responseEffectiveness}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.responseEffectiveness}
                                    onChange={(e) => setFormData({ ...formData, responseEffectiveness: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        
                        {/* Response Actions */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.response.actions')}
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newAction}
                                    onChange={(e) => setNewAction(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addAction()}
                                    className={`flex-1 px-3 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                    placeholder={t('riskManagement.response.actionPlaceholder')}
                                />
                                <Button onClick={addAction} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.actions.map(action => (
                                    <div key={action.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                        <span className="flex-1 text-sm">{action.description}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {action.status}
                                        </Badge>
                                        <button
                                            onClick={() => removeAction(action.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Triggers */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.response.triggers')}
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newTrigger}
                                    onChange={(e) => setNewTrigger(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addTrigger()}
                                    className={`flex-1 px-3 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                    placeholder={t('riskManagement.response.triggerPlaceholder')}
                                />
                                <Button onClick={addTrigger} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.triggers.map((trigger, index) => (
                                    <Badge key={index} variant="outline" className="pr-1">
                                        {trigger}
                                        <button
                                            onClick={() => removeTrigger(index)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onCancel}>
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={() => onSave(risk.id, formData)}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {t('common.save')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    return (
        <div className="space-y-6">
            {/* Response Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.response.needsPlanning')}
                                </p>
                                <p className="text-2xl font-bold">{responseStatus.needsPlanning.length}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.response.planned')}
                                </p>
                                <p className="text-2xl font-bold">{responseStatus.planned.length}</p>
                            </div>
                            <Target className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.response.implemented')}
                                </p>
                                <p className="text-2xl font-bold">{responseStatus.implemented.length}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.response.overdue')}
                                </p>
                                <p className="text-2xl font-bold">{responseStatus.overdue.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Response Strategies Overview */}
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>{t('riskManagement.response.strategies')}</CardTitle>
                    <CardDescription>
                        {t('riskManagement.response.strategiesDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(responseStrategies).map(([key, strategy]) => (
                            <div
                                key={key}
                                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${strategy.color} text-white`}>
                                        {strategy.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{strategy.name}</h3>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {strategy.description}
                                        </p>
                                        <p className="text-xs mt-2 font-medium">
                                            {risks.filter(r => r.responseStrategy === key).length} {t('riskManagement.risks')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            {/* Risk Response List */}
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t('riskManagement.response.planningList')}</CardTitle>
                        <Button
                            onClick={() => setShowResponseForm(!showResponseForm)}
                            variant="outline"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('riskManagement.response.newPlan')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {risks.map(risk => (
                            <div
                                key={risk.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedRisk?.id === risk.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => setSelectedRisk(risk)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-medium">{risk.riskId}</p>
                                            <Badge variant="outline">{risk.category}</Badge>
                                            {risk.responseStrategy && (
                                                <Badge 
                                                    className={`${responseStrategies[risk.responseStrategy]?.color || 'bg-gray-500'} text-white`}
                                                >
                                                    {responseStrategies[risk.responseStrategy]?.name || risk.responseStrategy}
                                                </Badge>
                                            )}
                                            {risk.responseImplemented && (
                                                <Badge className="bg-green-500 text-white">
                                                    {t('riskManagement.response.implemented')}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {risk.title}
                                        </p>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.originalRisk')}</p>
                                                <p className="font-medium">{risk.riskScore || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.residualRisk')}</p>
                                                <p className="font-medium">{calculateResidualRisk(risk)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.response.owner')}</p>
                                                <p className="font-medium text-sm">{risk.responseOwner || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.response.deadline')}</p>
                                                <p className="font-medium text-sm">
                                                    {risk.responseDeadline ? new Date(risk.responseDeadline).toLocaleDateString() : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.response.cost')}</p>
                                                <p className="font-medium">${risk.responseCost || 0}</p>
                                            </div>
                                        </div>
                                        
                                        {risk.mitigationStrategy && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                                <p className="text-xs font-medium mb-1">{t('riskManagement.response.mitigation')}</p>
                                                <p className="text-sm">{risk.mitigationStrategy}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingResponse(risk);
                                            }}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            {/* Response Form */}
            {editingResponse && (
                <ResponseForm
                    risk={editingResponse}
                    onSave={(id, data) => {
                        onUpdateRisk(id, data);
                        setEditingResponse(null);
                    }}
                    onCancel={() => setEditingResponse(null)}
                />
            )}
        </div>
    );
};

export default RiskResponsePlanning;