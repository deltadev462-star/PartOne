import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Save,
    Send,
    Plus,
    Trash,
    FileText,
    MessageSquare,
    CheckCircle,
    ClipboardList,
    AlertTriangle,
    Lock,
    Mail,
    Users,
    ChevronDown,
    ChevronRight,
    Edit3,
    RefreshCw,
    Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MoMEditor = ({
    isOpen,
    onClose,
    meeting,
    onSave,
    onFinalize,
    onDistribute,
    canFinalize,
    canDistribute,
    isDark
}) => {
    const { t } = useTranslation();
    
    const [momData, setMomData] = useState({
        momContent: '',
        discussionPoints: [],
        decisions: [],
        actionItems: [],
        concerns: '',
        notes: ''
    });

    const [newDiscussionPoint, setNewDiscussionPoint] = useState('');
    const [newDecision, setNewDecision] = useState('');
    const [newActionItem, setNewActionItem] = useState({
        description: '',
        assignee: '',
        dueDate: ''
    });
    const [distributionEmails, setDistributionEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [isDistributing, setIsDistributing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        content: true,
        discussion: true,
        decisions: true,
        actions: true,
        concerns: true
    });

    useEffect(() => {
        if (meeting && isOpen) {
            setMomData({
                momContent: meeting.momContent || '',
                discussionPoints: Array.isArray(meeting.discussionPoints) ? meeting.discussionPoints : [],
                decisions: Array.isArray(meeting.decisions) ? meeting.decisions : [],
                actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems : [],
                concerns: meeting.concerns || '',
                notes: meeting.notes || ''
            });
            setDistributionEmails(Array.isArray(meeting.distributionList) ? meeting.distributionList : []);
        }
    }, [meeting, isOpen]);

    if (!isOpen || !meeting) return null;

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleAddDiscussionPoint = () => {
        if (newDiscussionPoint.trim()) {
            setMomData(prev => ({
                ...prev,
                discussionPoints: [...prev.discussionPoints, newDiscussionPoint]
            }));
            setNewDiscussionPoint('');
        }
    };

    const handleRemoveDiscussionPoint = (index) => {
        setMomData(prev => ({
            ...prev,
            discussionPoints: prev.discussionPoints.filter((_, i) => i !== index)
        }));
    };

    const handleAddDecision = () => {
        if (newDecision.trim()) {
            setMomData(prev => ({
                ...prev,
                decisions: [...prev.decisions, newDecision]
            }));
            setNewDecision('');
        }
    };

    const handleRemoveDecision = (index) => {
        setMomData(prev => ({
            ...prev,
            decisions: prev.decisions.filter((_, i) => i !== index)
        }));
    };

    const handleAddActionItem = () => {
        if (newActionItem.description.trim()) {
            setMomData(prev => ({
                ...prev,
                actionItems: [...prev.actionItems, { ...newActionItem, id: Date.now() }]
            }));
            setNewActionItem({ description: '', assignee: '', dueDate: '' });
        }
    };

    const handleRemoveActionItem = (index) => {
        setMomData(prev => ({
            ...prev,
            actionItems: prev.actionItems.filter((_, i) => i !== index)
        }));
    };

    const handleAddEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newEmail && emailRegex.test(newEmail)) {
            if (!distributionEmails.includes(newEmail)) {
                setDistributionEmails(prev => [...prev, newEmail]);
                setNewEmail('');
            } else {
                toast.error(t('meetings.errors.emailExists'));
            }
        } else {
            toast.error(t('meetings.errors.invalidEmail'));
        }
    };

    const handleRemoveEmail = (email) => {
        setDistributionEmails(prev => prev.filter(e => e !== email));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                ...momData,
                momStatus: 'DRAFT'
            });
            toast.success(t('meetings.mom.saveDraft'));
        } catch (error) {
            toast.error(t('meetings.notifications.momError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalize = async () => {
        if (!canFinalize) {
            toast.error(t('validation.required'));
            return;
        }

        if (!momData.momContent && momData.discussionPoints.length === 0 &&
            momData.decisions.length === 0 && momData.actionItems.length === 0) {
            toast.error(t('validation.required'));
            return;
        }

        try {
            await onSave({
                ...momData,
                momStatus: 'FINALIZED'
            });
            await onFinalize();
            toast.success(t('meetings.notifications.momFinalized'));
        } catch (error) {
            toast.error(t('meetings.notifications.momError'));
        }
    };

    const handleDistribute = async () => {
        if (!canDistribute) {
            toast.error(t('validation.required'));
            return;
        }

        if (distributionEmails.length === 0) {
            toast.error(t('validation.required'));
            return;
        }

        setIsDistributing(true);
        try {
            await onDistribute(meeting.id, distributionEmails);
            toast.success(t('meetings.notifications.momDistributed', { count: distributionEmails.length }));
            onClose();
        } catch (error) {
            toast.error(t('meetings.notifications.momError'));
        } finally {
            setIsDistributing(false);
        }
    };

    const getMoMStatusBadge = () => {
        const statusConfig = {
            DRAFT: {
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                icon: <Edit3 className="h-4 w-4" />,
                label: t('meetings.mom.status.draft')
            },
            FINALIZED: {
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                icon: <Lock className="h-4 w-4" />,
                label: t('meetings.mom.status.finalized')
            },
            DISTRIBUTED: {
                color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                icon: <Send className="h-4 w-4" />,
                label: t('meetings.mom.status.distributed')
            }
        };
        return statusConfig[meeting.momStatus] || statusConfig.DRAFT;
    };

    const momStatus = getMoMStatusBadge();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
                </div>

                <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full
                    ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    
                    {/* Header */}
                    <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {t('meetings.mom.minutesOfMeeting')} - {meeting.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(meeting.meetingDate).toLocaleDateString()} • #{meeting.meetingId}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${momStatus.color}`}>
                                    {momStatus.icon}
                                    {momStatus.label}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                        {/* Meeting Summary Content */}
                        <div className="mb-6">
                            <div
                                onClick={() => toggleSection('content')}
                                className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                            >
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('meetings.mom.meetingSummary')}
                                </h4>
                                {expandedSections.content ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                            
                            {expandedSections.content && (
                                <textarea
                                    value={momData.momContent}
                                    onChange={(e) => setMomData({ ...momData, momContent: e.target.value })}
                                    rows="6"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    placeholder={t('meetings.mom.writeSummary')}
                                    disabled={meeting.momStatus === 'DISTRIBUTED'}
                                />
                            )}
                        </div>

                        {/* Discussion Points */}
                        <div className="mb-6">
                            <div
                                onClick={() => toggleSection('discussion')}
                                className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                            >
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    {t('meetings.mom.discussionPoints')} ({momData.discussionPoints.length})
                                </h4>
                                {expandedSections.discussion ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                            
                            {expandedSections.discussion && (
                                <>
                                    {meeting.momStatus !== 'DISTRIBUTED' && (
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newDiscussionPoint}
                                                onChange={(e) => setNewDiscussionPoint(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDiscussionPoint())}
                                                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                placeholder={t('meetings.mom.addDiscussionPoint')}
                                            />
                                            <button
                                                onClick={handleAddDiscussionPoint}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                            >
                                                <Plus className="h-4 w-4" />
                                                {t('meetings.form.add')}
                                            </button>
                                        </div>
                                    )}
                                    
                                    <ul className="space-y-2">
                                        {momData.discussionPoints.map((point, index) => (
                                            <li key={index} className={`flex items-start gap-2 p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                                <span className="flex-1 text-sm">{point}</span>
                                                {meeting.momStatus !== 'DISTRIBUTED' && (
                                                    <button
                                                        onClick={() => handleRemoveDiscussionPoint(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>

                        {/* Decisions */}
                        <div className="mb-6">
                            <div
                                onClick={() => toggleSection('decisions')}
                                className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                            >
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t('meetings.mom.decisions')} ({momData.decisions.length})
                                </h4>
                                {expandedSections.decisions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                            
                            {expandedSections.decisions && (
                                <>
                                    {meeting.momStatus !== 'DISTRIBUTED' && (
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newDecision}
                                                onChange={(e) => setNewDecision(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDecision())}
                                                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                placeholder={t('meetings.mom.addDecision')}
                                            />
                                            <button
                                                onClick={handleAddDecision}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                            >
                                                <Plus className="h-4 w-4" />
                                                {t('meetings.form.add')}
                                            </button>
                                        </div>
                                    )}
                                    
                                    <ul className="space-y-2">
                                        {momData.decisions.map((decision, index) => (
                                            <li key={index} className={`flex items-start gap-2 p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span className="flex-1 text-sm">{decision}</span>
                                                {meeting.momStatus !== 'DISTRIBUTED' && (
                                                    <button
                                                        onClick={() => handleRemoveDecision(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>

                        {/* Action Items */}
                        <div className="mb-6">
                            <div
                                onClick={() => toggleSection('actions')}
                                className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                            >
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    {t('meetings.mom.actionItems')} ({momData.actionItems.length})
                                </h4>
                                {expandedSections.actions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                            
                            {expandedSections.actions && (
                                <>
                                    {meeting.momStatus !== 'DISTRIBUTED' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newActionItem.description}
                                                onChange={(e) => setNewActionItem({ ...newActionItem, description: e.target.value })}
                                                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                placeholder={t('meetings.mom.actionItemDescription')}
                                            />
                                            <input
                                                type="text"
                                                value={newActionItem.assignee}
                                                onChange={(e) => setNewActionItem({ ...newActionItem, assignee: e.target.value })}
                                                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                placeholder={t('meetings.mom.assigneePlaceholder')}
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={newActionItem.dueDate}
                                                    onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                                                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                        ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                />
                                                <button
                                                    onClick={handleAddActionItem}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <ul className="space-y-2">
                                        {momData.actionItems.map((item, index) => (
                                            <li key={item.id || index} className={`flex items-start gap-2 p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{item.description || item}</p>
                                                    {item.assignee && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {t('meetings.mom.assignee')}: {item.assignee}
                                                            {item.dueDate && ` • ${t('meetings.mom.dueDate')}: ${new Date(item.dueDate).toLocaleDateString()}`}
                                                        </p>
                                                    )}
                                                </div>
                                                {meeting.momStatus !== 'DISTRIBUTED' && (
                                                    <button
                                                        onClick={() => handleRemoveActionItem(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>

                        {/* Concerns & Notes */}
                        <div className="mb-6">
                            <div
                                onClick={() => toggleSection('concerns')}
                                className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                            >
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    {t('meetings.mom.concernsAndNotes')}
                                </h4>
                                {expandedSections.concerns ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                            
                            {expandedSections.concerns && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('meetings.mom.concerns')}</label>
                                        <textarea
                                            value={momData.concerns}
                                            onChange={(e) => setMomData({ ...momData, concerns: e.target.value })}
                                            rows="3"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            placeholder={t('meetings.mom.concernsPlaceholder')}
                                            disabled={meeting.momStatus === 'DISTRIBUTED'}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('meetings.mom.additionalNotes')}</label>
                                        <textarea
                                            value={momData.notes}
                                            onChange={(e) => setMomData({ ...momData, notes: e.target.value })}
                                            rows="3"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            placeholder={t('meetings.mom.additionalNotesPlaceholder')}
                                            disabled={meeting.momStatus === 'DISTRIBUTED'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Distribution List */}
                        {meeting.momStatus !== 'DRAFT' && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {t('meetings.mom.distributionList')}
                                </h4>
                                
                                {meeting.momStatus !== 'DISTRIBUTED' && (
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            placeholder={t('meetings.mom.addEmailForDistribution')}
                                        />
                                        <button
                                            onClick={handleAddEmail}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {t('meetings.form.add')}
                                        </button>
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap gap-2">
                                    {distributionEmails.map(email => (
                                        <span
                                            key={email}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
                                                ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {email}
                                            {meeting.momStatus !== 'DISTRIBUTED' && (
                                                <button
                                                    onClick={() => handleRemoveEmail(email)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between`}>
                        <div className="flex gap-2">
                            {meeting.momStatus !== 'DISTRIBUTED' && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                {t('meetings.mom.saving')}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                {t('meetings.mom.saveDraft')}
                                            </>
                                        )}
                                    </button>
                                    
                                    {meeting.momStatus === 'DRAFT' && canFinalize && (
                                        <button
                                            onClick={handleFinalize}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <Lock className="h-4 w-4" />
                                            {t('meetings.mom.finalize')}
                                        </button>
                                    )}
                                    
                                    {meeting.momStatus === 'FINALIZED' && canDistribute && (
                                        <button
                                            onClick={handleDistribute}
                                            disabled={isDistributing || distributionEmails.length === 0}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isDistributing ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    {t('meetings.mom.distributing')}
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    {t('meetings.mom.distribute')}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {t('meetings.mom.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoMEditor;