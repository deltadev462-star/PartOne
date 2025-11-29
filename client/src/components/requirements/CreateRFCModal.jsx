import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
    Input,
    Label,
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    ScrollArea
} from '@/components/ui';
import {
    Plus,
    X,
    AlertTriangle,
    DollarSign,
    Clock,
    Target,
    FileText,
    Info
} from 'lucide-react';
import { rfcService } from '../../services/requirementService';
import toast from 'react-hot-toast';

const CreateRFCModal = ({
    isOpen,
    onClose,
    requirements,
    projectId,
    isDark
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        projectId,
        requirementId: '',
        title: '',
        description: '',
        reason: '',
        impact: '',
        impactLevel: 'MEDIUM',
        risk: '',
        costEstimate: '',
        scheduleImpact: '',
        affectedTasks: [],
        affectedReleases: [],
        timeEstimate: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.requirementId || !formData.title || !formData.reason) {
            toast.error(t('requirements.rfc.requiredFields'));
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                costEstimate: formData.costEstimate ? parseFloat(formData.costEstimate) : null,
                timeEstimate: formData.timeEstimate ? parseInt(formData.timeEstimate) : null
            };
            
            await rfcService.createRFC(submitData);
            toast.success(t('requirements.rfc.createSuccess'));
            handleClose();
            // Trigger refresh
            window.location.reload();
        } catch (error) {
            console.error('Error creating RFC:', error);
            toast.error(t('requirements.rfc.createError'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            projectId,
            requirementId: '',
            title: '',
            description: '',
            reason: '',
            impact: '',
            impactLevel: 'MEDIUM',
            risk: '',
            costEstimate: '',
            scheduleImpact: '',
            affectedTasks: [],
            affectedReleases: [],
            timeEstimate: ''
        });
        setActiveTab('basic');
        onClose();
    };

    const impactLevels = [
        { value: 'LOW', label: t('requirements.rfc.low'), color: 'bg-gray-500' },
        { value: 'MEDIUM', label: t('requirements.rfc.medium'), color: 'bg-yellow-500' },
        { value: 'HIGH', label: t('requirements.rfc.high'), color: 'bg-orange-500' },
        { value: 'CRITICAL', label: t('requirements.rfc.critical'), color: 'bg-red-500' }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={`   max-h-[90vh] dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {t('requirements.rfc.createNew')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('requirements.rfc.createDescription')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        {/* <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">{t('requirements.basicInfo')}</TabsTrigger>
                            <TabsTrigger value="impact">{t('requirements.rfc.impactAnalysis')}</TabsTrigger>
                            <TabsTrigger value="estimate">{t('requirements.rfc.estimates')}</TabsTrigger>
                        </TabsList> */}

                        <ScrollArea className="h-[400px] mt-4">
                            <TabsContent value="basic" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('requirements.rfc.requirement')} <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.requirementId}
                                        onValueChange={(value) => handleSelectChange('requirementId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {formData.requirementId
                                                    ? (() => {
                                                        const selectedReq = requirements.find(req => req.id === formData.requirementId);
                                                        return selectedReq
                                                            ? `${selectedReq.requirementId} - ${selectedReq.title}`
                                                            : t('requirements.rfc.selectRequirement');
                                                    })()
                                                    : t('requirements.rfc.selectRequirement')}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {requirements.map(req => (
                                                <SelectItem key={req.id} value={req.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs">{req.requirementId}</span>
                                                        <span>{req.title}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        {t('requirements.title')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.titlePlaceholder')}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">{t('requirements.description')}</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.descriptionPlaceholder')}
                                        rows={3}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason">
                                        {t('requirements.rfc.reason')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.reasonPlaceholder')}
                                        rows={3}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="impact" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="impact">{t('requirements.rfc.impact')}</Label>
                                    <Textarea
                                        id="impact"
                                        name="impact"
                                        value={formData.impact}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.impactPlaceholder')}
                                        rows={3}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('requirements.rfc.impactLevel')}</Label>
                                    <Select
                                        value={formData.impactLevel}
                                        onValueChange={(value) => handleSelectChange('impactLevel', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {(() => {
                                                    const selectedLevel = impactLevels.find(level => level.value === formData.impactLevel);
                                                    return selectedLevel ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${selectedLevel.color}`} />
                                                            {selectedLevel.label}
                                                        </div>
                                                    ) : t('requirements.rfc.selectImpactLevel');
                                                })()}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {impactLevels.map(level => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${level.color}`} />
                                                        {level.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="risk">{t('requirements.rfc.risk')}</Label>
                                    <Textarea
                                        id="risk"
                                        name="risk"
                                        value={formData.risk}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.riskPlaceholder')}
                                        rows={3}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scheduleImpact">{t('requirements.rfc.scheduleImpact')}</Label>
                                    <Textarea
                                        id="scheduleImpact"
                                        name="scheduleImpact"
                                        value={formData.scheduleImpact}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.scheduleImpactPlaceholder')}
                                        rows={2}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="estimate" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="costEstimate">
                                        {t('requirements.rfc.costEstimate')} ($)
                                    </Label>
                                    <Input
                                        id="costEstimate"
                                        name="costEstimate"
                                        type="number"
                                        value={formData.costEstimate}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.costEstimatePlaceholder')}
                                        className={isDark ? 'bg-gray-700' : ''}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timeEstimate">
                                        {t('requirements.rfc.timeEstimate')} ({t('requirements.hours')})
                                    </Label>
                                    <Input
                                        id="timeEstimate"
                                        name="timeEstimate"
                                        type="number"
                                        value={formData.timeEstimate}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.rfc.timeEstimatePlaceholder')}
                                        className={isDark ? 'bg-gray-700' : ''}
                                        min="0"
                                    />
                                </div>

                                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                                    <div className="flex items-start gap-2">
                                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium mb-1">
                                                {t('requirements.rfc.estimateNote')}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {t('requirements.rfc.estimateNoteDesc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || !formData.requirementId || !formData.title || !formData.reason}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    {t('common.creating')}
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('requirements.rfc.createRFC')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateRFCModal;