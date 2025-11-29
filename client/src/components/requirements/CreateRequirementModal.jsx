import React, { useState, useEffect } from 'react';
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
    Switch,
    ScrollArea
} from '@/components/ui';
import {
    Plus,
    X,
    FileText,
    Target,
    User,
    Tag,
    Link,
    CheckSquare,
    Info
} from 'lucide-react';
import { requirementService } from '../../services/requirementService';
import toast from 'react-hot-toast';

const CreateRequirementModal = ({
    isOpen,
    onClose,
    onCreate,
    projectId,
    parentRequirement = null,
    isDark
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(false);
    const [availableRequirements, setAvailableRequirements] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'FUNCTIONAL',
        priority: 'MEDIUM',
        status: 'DRAFT',
        source: '',
        epic: '',
        parentId: parentRequirement?.id || null,
        estimatedEffort: '',
        acceptanceCriteria: [],
        tags: [],
        stakeholderIds: []
    });

    const [newCriteria, setNewCriteria] = useState('');
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (isOpen && projectId) {
            fetchAvailableRequirements();
        }
    }, [isOpen, projectId]);

    const fetchAvailableRequirements = async () => {
        try {
            const response = await requirementService.getProjectRequirements(projectId);
            setAvailableRequirements(response.requirements);
        } catch (error) {
            console.error('Error fetching requirements:', error);
        }
    };

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

    const addAcceptanceCriteria = () => {
        if (newCriteria.trim()) {
            setFormData(prev => ({
                ...prev,
                acceptanceCriteria: [...prev.acceptanceCriteria, newCriteria.trim()]
            }));
            setNewCriteria('');
        }
    };

    const removeAcceptanceCriteria = (index) => {
        setFormData(prev => ({
            ...prev,
            acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index)
        }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            toast.error(t('requirements.titleRequired'));
            return;
        }

        setLoading(true);
        try {
            await onCreate({
                ...formData,
                estimatedEffort: formData.estimatedEffort ? parseInt(formData.estimatedEffort) : null
            });
            handleClose();
        } catch (error) {
            console.error('Error creating requirement:', error);
            toast.error(t('requirements.createError'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            type: 'FUNCTIONAL',
            priority: 'MEDIUM',
            status: 'DRAFT',
            source: '',
            epic: '',
            parentId: null,
            estimatedEffort: '',
            acceptanceCriteria: [],
            tags: [],
            stakeholderIds: []
        });
        setNewCriteria('');
        setNewTag('');
        setActiveTab('basic');
        onClose();
    };

    const requirementTypes = [
        { value: 'FUNCTIONAL', label: t('requirements.type.functional'), icon: '⚙️' },
        { value: 'NON_FUNCTIONAL', label: t('requirements.type.nonFunctional'), icon: '📊' },
        { value: 'BUSINESS', label: t('requirements.type.business'), icon: '💼' },
        { value: 'TECHNICAL', label: t('requirements.type.technical'), icon: '🔧' }
    ];

    const priorities = [
        { value: 'LOW', label: t('requirements.priority.low'), color: 'bg-gray-500' },
        { value: 'MEDIUM', label: t('requirements.priority.medium'), color: 'bg-yellow-500' },
        { value: 'HIGH', label: t('requirements.priority.high'), color: 'bg-orange-500' },
        { value: 'CRITICAL', label: t('requirements.priority.critical'), color: 'bg-red-500' }
    ];

    const statuses = [
        { value: 'DRAFT', label: t('requirements.status.draft') },
        { value: 'REVIEW', label: t('requirements.status.review') },
        { value: 'APPROVED', label: t('requirements.status.approved') }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={`w-[95vw] sm:w-full sm:max-w-3xl max-h-[90vh] dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {parentRequirement 
                            ? t('requirements.createChildRequirement')
                            : t('requirements.createNewRequirement')
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {parentRequirement
                            ? t('requirements.createChildRequirementDesc', { parent: parentRequirement.title })
                            : t('requirements.createRequirementDesc')
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
                        <TabsList className="grid w-full grid-cols-3 mb-3 text-xs sm:text-sm">
                            <TabsTrigger value="basic">{t('requirements.basicInfo')}</TabsTrigger>
                            <TabsTrigger value="criteria">{t('requirements.acceptanceCriteria')}</TabsTrigger>
                            <TabsTrigger value="metadata">{t('requirements.metadata')}</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="h-[calc(65vh-120px)] sm:h-[400px] mt-3 px-1">
                            <TabsContent value="basic" className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        {t('requirements.title')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.titlePlaceholder')}
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
                                        placeholder={t('requirements.descriptionPlaceholder')}
                                        rows={4}
                                        className={isDark ? 'bg-gray-700' : ''}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('requirements.typeLabel')}</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => handleSelectChange('type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {requirementTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        <span className="flex items-center gap-2">
                                                            <span>{type.icon}</span>
                                                            <span>{type.label}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('requirements.priorityLabel')}</Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(value) => handleSelectChange('priority', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorities.map(priority => (
                                                    <SelectItem key={priority.value} value={priority.value}>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                                                            <span className="text-xs sm:text-sm">{priority.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('requirements.statusLabel')}</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => handleSelectChange('status', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map(status => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        <span className="text-xs sm:text-sm">{status.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="source">{t('requirements.source')}</Label>
                                        <Input
                                            id="source"
                                            name="source"
                                            value={formData.source}
                                            onChange={handleInputChange}
                                            placeholder={t('requirements.sourcePlaceholder')}
                                            className={isDark ? 'bg-gray-700' : ''}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="criteria" className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('requirements.acceptanceCriteria')}</Label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            value={newCriteria}
                                            onChange={(e) => setNewCriteria(e.target.value)}
                                            placeholder={t('requirements.addCriteriaPlaceholder')}
                                            className={`flex-1 ${isDark ? 'bg-gray-700' : ''}`}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addAcceptanceCriteria();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            onClick={addAcceptanceCriteria}
                                            disabled={!newCriteria.trim()}
                                            size="sm"
                                            className="px-3"
                                        >
                                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {formData.acceptanceCriteria.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.acceptanceCriteria.map((criteria, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-start gap-2 p-3 rounded-lg ${
                                                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                                                }`}
                                            >
                                                <CheckSquare className="h-4 w-4 mt-1 text-green-500" />
                                                <span className="flex-1 text-sm">{criteria}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeAcceptanceCriteria(index)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {formData.acceptanceCriteria.length === 0 && (
                                    <div className={`text-center py-8 rounded-lg ${
                                        isDark ? 'bg-gray-700' : 'bg-gray-50'
                                    }`}>
                                        <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">
                                            {t('requirements.noCriteria')}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="metadata" className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="epic">{t('requirements.epic')}</Label>
                                        <Input
                                            id="epic"
                                            name="epic"
                                            value={formData.epic}
                                            onChange={handleInputChange}
                                            placeholder={t('requirements.epicPlaceholder')}
                                            className={isDark ? 'bg-gray-700' : ''}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('requirements.parentRequirement')}</Label>
                                        <Select
                                            value={formData.parentId || ''}
                                            onValueChange={(value) => handleSelectChange('parentId', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('requirements.selectParent')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">{t('requirements.noParent')}</SelectItem>
                                                {availableRequirements
                                                    .filter(req => req.id !== formData.id)
                                                    .map(req => (
                                                        <SelectItem key={req.id} value={req.id}>
                                                            {req.requirementId} - {req.title}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="estimatedEffort">
                                        {t('requirements.estimatedEffort')} ({t('requirements.hours')})
                                    </Label>
                                    <Input
                                        id="estimatedEffort"
                                        name="estimatedEffort"
                                        type="number"
                                        value={formData.estimatedEffort}
                                        onChange={handleInputChange}
                                        placeholder={t('requirements.estimatedEffortPlaceholder')}
                                        className={isDark ? 'bg-gray-700' : ''}
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('requirements.tags')}</Label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder={t('requirements.addTagPlaceholder')}
                                            className={`flex-1 ${isDark ? 'bg-gray-700' : ''}`}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            onClick={addTag}
                                            disabled={!newTag.trim()}
                                            size="sm"
                                            className="px-3"
                                        >
                                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                    </div>

                                    {formData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="flex items-center gap-1"
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="ml-1 hover:text-red-500"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.title.trim()}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    {t('common.creating')}
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    {t('common.create')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateRequirementModal;