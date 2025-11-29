import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, AlertTriangle, Plus, Trash } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui';

const CreateRiskModal = ({ 
    isOpen, 
    onClose, 
    onCreate, 
    projectId, 
    isDark,
    riskCategories 
}) => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'TECHNICAL',
        likelihood: 'POSSIBLE',
        impact: 'MODERATE',
        severity: 'MODERATE',
        riskLevel: 'MEDIUM',
        owner: '',
        riskStatement: '',
        cause: '',
        effect: '',
        triggers: [],
        indicators: [],
        existingControls: '',
        proposedControls: '',
        tags: [],
        relatedRisks: [],
        estimatedCost: '',
        estimatedScheduleImpact: '',
        detectability: 'MEDIUM',
        velocity: 'MEDIUM'
    });
    
    const [newTrigger, setNewTrigger] = useState('');
    const [newIndicator, setNewIndicator] = useState('');
    const [newTag, setNewTag] = useState('');
    const [errors, setErrors] = useState({});
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = t('riskManagement.validation.titleRequired');
        }
        
        if (!formData.description.trim()) {
            newErrors.description = t('riskManagement.validation.descriptionRequired');
        }
        
        if (!formData.category) {
            newErrors.category = t('riskManagement.validation.categoryRequired');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const riskData = {
            ...formData,
            projectId,
            riskScore: calculateRiskScore(),
            status: 'IDENTIFIED',
            createdAt: new Date().toISOString(),
            riskId: generateRiskId()
        };
        
        onCreate(riskData);
    };
    
    const calculateRiskScore = () => {
        const likelihoodScores = {
            RARE: 1,
            UNLIKELY: 2,
            POSSIBLE: 3,
            LIKELY: 4,
            ALMOST_CERTAIN: 5
        };
        
        const impactScores = {
            INSIGNIFICANT: 1,
            MINOR: 2,
            MODERATE: 3,
            MAJOR: 4,
            CATASTROPHIC: 5
        };
        
        const likelihood = likelihoodScores[formData.likelihood] || 3;
        const impact = impactScores[formData.impact] || 3;
        
        return likelihood * impact * 4; // Scale to 0-100
    };
    
    const generateRiskId = () => {
        const prefix = 'RSK';
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}`;
    };
    
    const addTrigger = () => {
        if (newTrigger.trim()) {
            setFormData({
                ...formData,
                triggers: [...formData.triggers, newTrigger.trim()]
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
    
    const addIndicator = () => {
        if (newIndicator.trim()) {
            setFormData({
                ...formData,
                indicators: [...formData.indicators, newIndicator.trim()]
            });
            setNewIndicator('');
        }
    };
    
    const removeIndicator = (index) => {
        setFormData({
            ...formData,
            indicators: formData.indicators.filter((_, i) => i !== index)
        });
    };
    
    const addTag = () => {
        if (newTag.trim()) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()]
            });
            setNewTag('');
        }
    };
    
    const removeTag = (index) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((_, i) => i !== index)
        });
    };
    
    const updateRiskLevel = (likelihood, impact) => {
        const likelihoodIndex = ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN'].indexOf(likelihood);
        const impactIndex = ['INSIGNIFICANT', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'].indexOf(impact);
        
        const score = (likelihoodIndex + 1) * (impactIndex + 1);
        
        let riskLevel = 'LOW';
        if (score <= 4) riskLevel = 'LOW';
        else if (score <= 9) riskLevel = 'MEDIUM';
        else if (score <= 16) riskLevel = 'HIGH';
        else riskLevel = 'CRITICAL';
        
        setFormData(prev => ({
            ...prev,
            likelihood,
            impact,
            riskLevel
        }));
    };
    
    if (!isOpen) return null;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose} className="dark:bg-[#101010] bg-white dark:border-gray-900 border-gray-200 backdrop-blur-5xl">
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-[#101010] bg-white dark:border-gray-900 border-gray-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {t('riskManagement.createRisk.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('riskManagement.createRisk.description')}
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('riskManagement.createRisk.basicInfo')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.title')} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    } dark:bg-[#101010] dark:border-gray-900 border-gray-200  `}
                                    placeholder={t('riskManagement.createRisk.titlePlaceholder')}
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.category')} *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }  dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                >
                                    {Object.entries(riskCategories).map(([key, category]) => (
                                        <option key={key} value={key}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.description')} *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                } dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                rows={3}
                                placeholder={t('riskManagement.createRisk.descriptionPlaceholder')}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.owner')}
                            </label>
                            <input
                                type="text"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg   dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                placeholder={t('riskManagement.createRisk.ownerPlaceholder')}
                            />
                        </div>
                    </div>
                    
                    {/* Risk Assessment */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('riskManagement.createRisk.assessment')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.likelihood')} *
                                </label>
                                <select
                                    value={formData.likelihood}
                                    onChange={(e) => updateRiskLevel(e.target.value, formData.impact)}
                                    className={`w-full px-3 py-2 border rounded-lg   dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                >
                                    <option value="RARE">{t('riskManagement.likelihood.rare')}</option>
                                    <option value="UNLIKELY">{t('riskManagement.likelihood.unlikely')}</option>
                                    <option value="POSSIBLE">{t('riskManagement.likelihood.possible')}</option>
                                    <option value="LIKELY">{t('riskManagement.likelihood.likely')}</option>
                                    <option value="ALMOST_CERTAIN">{t('riskManagement.likelihood.almostCertain')}</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.impact')} *
                                </label>
                                <select
                                    value={formData.impact}
                                    onChange={(e) => updateRiskLevel(formData.likelihood, e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                >
                                    <option value="INSIGNIFICANT">{t('riskManagement.impact.insignificant')}</option>
                                    <option value="MINOR">{t('riskManagement.impact.minor')}</option>
                                    <option value="MODERATE">{t('riskManagement.impact.moderate')}</option>
                                    <option value="MAJOR">{t('riskManagement.impact.major')}</option>
                                    <option value="CATASTROPHIC">{t('riskManagement.impact.catastrophic')}</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.riskLevel')}
                                </label>
                                <div className={`px-3 py-2 border rounded-lg ${
                                    formData.riskLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                                    formData.riskLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                                    formData.riskLevel === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                                    'bg-green-500 text-white'
                                } text-center font-medium`}>
                                    {formData.riskLevel}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.detectability')}
                                </label>
                                <select
                                    value={formData.detectability}
                                    onChange={(e) => setFormData({ ...formData, detectability: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                >
                                    <option value="LOW">{t('riskManagement.createRisk.detectabilityLow')}</option>
                                    <option value="MEDIUM">{t('riskManagement.createRisk.detectabilityMedium')}</option>
                                    <option value="HIGH">{t('riskManagement.createRisk.detectabilityHigh')}</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('riskManagement.createRisk.velocity')}
                                </label>
                                <select
                                    value={formData.velocity}
                                    onChange={(e) => setFormData({ ...formData, velocity: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                >
                                    <option value="SLOW">{t('riskManagement.createRisk.velocitySlow')}</option>
                                    <option value="MEDIUM">{t('riskManagement.createRisk.velocityMedium')}</option>
                                    <option value="FAST">{t('riskManagement.createRisk.velocityFast')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Risk Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('riskManagement.createRisk.details')}</h3>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.cause')}
                            </label>
                            <textarea
                                value={formData.cause}
                                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                rows={2}
                                placeholder={t('riskManagement.createRisk.causePlaceholder')}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.effect')}
                            </label>
                            <textarea
                                value={formData.effect}
                                onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                rows={2}
                                placeholder={t('riskManagement.createRisk.effectPlaceholder')}
                            />
                        </div>
                        
                        {/* Triggers */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.triggers')}
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newTrigger}
                                    onChange={(e) => setNewTrigger(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrigger())}
                                    className={`flex-1 px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                    placeholder={t('riskManagement.createRisk.triggerPlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={addTrigger}
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.triggers.map((trigger, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                                    >
                                        {trigger}
                                        <button
                                            type="button"
                                            onClick={() => removeTrigger(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {/* Indicators */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.indicators')}
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newIndicator}
                                    onChange={(e) => setNewIndicator(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndicator())}
                                    className={`flex-1 px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                    placeholder={t('riskManagement.createRisk.indicatorPlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={addIndicator}
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.indicators.map((indicator, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                                    >
                                        {indicator}
                                        <button
                                            type="button"
                                            onClick={() => removeIndicator(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('riskManagement.createRisk.controls')}</h3>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.existingControls')}
                            </label>
                            <textarea
                                value={formData.existingControls}
                                onChange={(e) => setFormData({ ...formData, existingControls: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                rows={2}
                                placeholder={t('riskManagement.createRisk.existingControlsPlaceholder')}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('riskManagement.createRisk.proposedControls')}
                            </label>
                            <textarea
                                value={formData.proposedControls}
                                onChange={(e) => setFormData({ ...formData, proposedControls: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] dark:border-gray-900 border-gray-200 `}
                                rows={2}
                                placeholder={t('riskManagement.createRisk.proposedControlsPlaceholder')}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {t('riskManagement.createRisk.create')}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateRiskModal;