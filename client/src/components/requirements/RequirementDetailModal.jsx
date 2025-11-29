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
    X,
    Edit,
    Save,
    FileText,
    User,
    Calendar,
    Tag,
    Link,
    TestTube,
    MessageSquare,
    History,
    Paperclip,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { requirementService } from '../../services/requirementService';
import toast from 'react-hot-toast';

const RequirementDetailModal = ({
    isOpen,
    onClose,
    requirement,
    onUpdate,
    onDelete,
    isDark
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [editData, setEditData] = useState({
        title: requirement?.title || '',
        description: requirement?.description || '',
        type: requirement?.type || 'FUNCTIONAL',
        priority: requirement?.priority || 'MEDIUM',
        status: requirement?.status || 'DRAFT',
        acceptanceCriteria: requirement?.acceptanceCriteria || []
    });

    if (!requirement) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await onUpdate(requirement.id, editData);
            setIsEditing(false);
            toast.success(t('requirements.updateSuccess'));
        } catch (error) {
            toast.error(t('requirements.updateError'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        
        setLoading(true);
        try {
            await requirementService.addComment(requirement.id, comment);
            setComment('');
            toast.success(t('requirements.commentAdded'));
            // Refresh requirement data
            onUpdate(requirement.id, requirement);
        } catch (error) {
            toast.error(t('requirements.commentError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm(t('requirements.deleteConfirm'))) {
            onDelete(requirement.id);
            onClose();
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            DRAFT: 'bg-gray-500',
            REVIEW: 'bg-blue-500',
            APPROVED: 'bg-green-500',
            IMPLEMENTED: 'bg-purple-500',
            VERIFIED: 'bg-teal-500',
            CLOSED: 'bg-gray-700'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            LOW: 'bg-gray-500',
            MEDIUM: 'bg-yellow-500',
            HIGH: 'bg-orange-500',
            CRITICAL: 'bg-red-500'
        };
        return colors[priority] || 'bg-gray-500';
    };

    const getTypeColor = (type) => {
        const colors = {
            FUNCTIONAL: 'bg-blue-500',
            NON_FUNCTIONAL: 'bg-purple-500',
            BUSINESS: 'bg-green-500',
            TECHNICAL: 'bg-orange-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`max-w-4xl   sm:w-full sm:max-w-3xl max-h-[90vh] dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 `}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className={`h-5 w-5 ${isDark ? 'text-gray-400' : ''}`} />
                            <span className={`font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {requirement.requirementId}
                            </span>
                            {isEditing ? (
                                <Input
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className={`font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                />
                            ) : (
                                <span className="font-semibold">{requirement.title}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={loading}
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        {t('common.save')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {t('requirements.edit')}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge className={getTypeColor(requirement.type) + ' text-white'}>
                            {t(`requirements.type.${requirement.type.toLowerCase()}`)}
                        </Badge>
                        <Badge className={getStatusColor(requirement.status) + ' text-white'}>
                            {t(`requirements.status.${requirement.status.toLowerCase()}`)}
                        </Badge>
                        <Badge className={getPriorityColor(requirement.priority) + ' text-white'}>
                            {t(`requirements.priority.${requirement.priority.toLowerCase()}`)}
                        </Badge>
                        {requirement.isBaseline && (
                            <Badge className="bg-purple-500 text-white">
                                {t('requirements.baseline')} v{requirement.baselineVersion}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList>
                        <TabsTrigger value="details">{t('requirements.details.tabs.details')}</TabsTrigger>
                        <TabsTrigger value="comments">{t('requirements.details.tabs.comments')}</TabsTrigger>
                        <TabsTrigger value="history">{t('requirements.details.tabs.history')}</TabsTrigger>
                        <TabsTrigger value="traceability">{t('requirements.details.tabs.traceability')}</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[500px] mt-4">
                        <TabsContent value="details" className="space-y-4">
                            {isEditing ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>{t('requirements.description')}</Label>
                                        <Textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            rows={4}
                                            className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('requirements.typeLabel')}</Label>
                                            <Select
                                                value={editData.type}
                                                onValueChange={(value) => setEditData({ ...editData, type: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FUNCTIONAL">{t('requirements.type.functional')}</SelectItem>
                                                    <SelectItem value="NON_FUNCTIONAL">{t('requirements.type.nonFunctional')}</SelectItem>
                                                    <SelectItem value="BUSINESS">{t('requirements.type.business')}</SelectItem>
                                                    <SelectItem value="TECHNICAL">{t('requirements.type.technical')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t('requirements.statusLabel')}</Label>
                                            <Select
                                                value={editData.status}
                                                onValueChange={(value) => setEditData({ ...editData, status: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">{t('requirements.status.draft')}</SelectItem>
                                                    <SelectItem value="REVIEW">{t('requirements.status.review')}</SelectItem>
                                                    <SelectItem value="APPROVED">{t('requirements.status.approved')}</SelectItem>
                                                    <SelectItem value="IMPLEMENTED">{t('requirements.status.implemented')}</SelectItem>
                                                    <SelectItem value="VERIFIED">{t('requirements.status.verified')}</SelectItem>
                                                    <SelectItem value="CLOSED">{t('requirements.status.closed')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t('requirements.priorityLabel')}</Label>
                                            <Select
                                                value={editData.priority}
                                                onValueChange={(value) => setEditData({ ...editData, priority: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">{t('requirements.priority.low')}</SelectItem>
                                                    <SelectItem value="MEDIUM">{t('requirements.priority.medium')}</SelectItem>
                                                    <SelectItem value="HIGH">{t('requirements.priority.high')}</SelectItem>
                                                    <SelectItem value="CRITICAL">{t('requirements.priority.critical')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <h4 className="font-medium mb-2">{t('requirements.description')}</h4>
                                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                            {requirement.description || t('requirements.details.noDescription')}
                                        </p>
                                    </div>

                                    {requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">{t('requirements.acceptanceCriteria')}</h4>
                                            <div className="space-y-2">
                                                {requirement.acceptanceCriteria.map((criteria, index) => (
                                                    <div key={index} className="flex items-start gap-2">
                                                        <CheckCircle className="h-4 w-4 mt-1 text-green-500" />
                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                            {criteria}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                                <span className="text-sm font-medium">{t('requirements.owner')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={requirement.owner?.image || '/default-avatar.png'}
                                                    alt={requirement.owner?.name}
                                                    className="h-6 w-6 rounded-full"
                                                />
                                                <span>{requirement.owner?.name}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                                <span className="text-sm font-medium">{t('requirements.details.created')}</span>
                                            </div>
                                            <span>{new Date(requirement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="comments" className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('requirements.details.comments.placeholder')}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <Button onClick={handleAddComment} disabled={!comment.trim() || loading}>
                                    {t('requirements.details.comments.post')}
                                </Button>
                            </div>

                            {requirement.comments && requirement.comments.length > 0 ? (
                                <div className="space-y-3">
                                    {requirement.comments.map((comment) => (
                                        <div key={comment.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={comment.user?.image || '/default-avatar.png'}
                                                        alt={comment.user?.name}
                                                        className="h-6 w-6 rounded-full"
                                                    />
                                                    <span className="font-medium">{comment.user?.name}</span>
                                                </div>
                                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                {comment.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <MessageSquare className={`h-12 w-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('requirements.details.comments.noComments')}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-3">
                            {requirement.history && requirement.history.length > 0 ? (
                                requirement.history.map((entry) => (
                                    <div key={entry.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <History className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                                <span className="font-medium">{entry.action}</span>
                                            </div>
                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span>{entry.user?.name}</span>
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>• Version {entry.version}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('requirements.details.history.noHistory')}</p>
                            )}
                        </TabsContent>

                        <TabsContent value="traceability" className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Link className="h-4 w-4" />
                                    {t('requirements.details.traceability.linkedTasks')}
                                </h4>
                                {requirement.taskLinks && requirement.taskLinks.length > 0 ? (
                                    <div className="space-y-2">
                                        {requirement.taskLinks.map((link) => (
                                            <div key={link.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{link.task?.title}</p>
                                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {t('requirements.details.traceability.assignedTo')}: {link.task?.assignee?.name}
                                                        </p>
                                                    </div>
                                                    <Badge>{link.task?.status}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('requirements.details.traceability.noTasksLinked')}</p>
                                )}
                            </div>

                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <TestTube className="h-4 w-4" />
                                    {t('requirements.testCases')}
                                </h4>
                                {requirement.testCases && requirement.testCases.length > 0 ? (
                                    <div className="space-y-2">
                                        {requirement.testCases.map((testCase) => (
                                            <div key={testCase.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{testCase.testCaseName}</p>
                                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ID: {testCase.testCaseId}</p>
                                                    </div>
                                                    <Badge className={testCase.status === 'PASSED' ? 'bg-green-500' : 'bg-gray-500'}>
                                                        {testCase.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('requirements.noTestCases')}</p>
                                )}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                {!isEditing && (
                    <DialogFooter>
                        <Button variant="destructive" onClick={handleDelete}>
                            {t('common.delete')}
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            {t('common.close')}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RequirementDetailModal;