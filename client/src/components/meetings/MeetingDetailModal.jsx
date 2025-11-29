import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    Link,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Video,
    Phone,
    Edit,
    Trash,
    Eye,
    Send,
    Check,
    RefreshCw,
    ExternalLink,
    Paperclip,
    MessageSquare,
    ClipboardList,
    UserCheck,
    Mail,
    Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as meetingService from '../../services/meetingService';

const MeetingDetailModal = ({
    isOpen,
    onClose,
    meeting,
    onUpdate,
    onDelete,
    onMarkAttendance,
    onOpenMoM,
    canEdit,
    isDark
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('details');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    if (!isOpen || !meeting) return null;

    const handleEdit = () => {
        setEditData({
            title: meeting.title,
            description: meeting.description,
            agenda: meeting.agenda,
            location: meeting.location,
            meetingLink: meeting.meetingLink,
            meetingDate: meeting.meetingDate,
            endDate: meeting.endDate,
            duration: meeting.duration
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            await onUpdate(editData);
            setIsEditing(false);
            toast.success(t('meetings.notifications.updateSuccess'));
        } catch (error) {
            toast.error(t('meetings.notifications.updateError'));
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleAttendanceToggle = async (participantId, currentStatus) => {
        await onMarkAttendance(meeting.id, participantId, !currentStatus);
    };

    const getStatusBadge = () => {
        const statusConfig = {
            SCHEDULED: {
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                icon: <Clock className="h-4 w-4" />,
                label: t('meetings.status.scheduled')
            },
            IN_PROGRESS: {
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                icon: <AlertCircle className="h-4 w-4" />,
                label: t('meetings.status.inProgress')
            },
            COMPLETED: {
                color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                icon: <CheckCircle className="h-4 w-4" />,
                label: t('meetings.status.completed')
            },
            CANCELLED: {
                color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                icon: <XCircle className="h-4 w-4" />,
                label: t('meetings.status.cancelled')
            }
        };
        return statusConfig[meeting.status] || statusConfig.SCHEDULED;
    };

    const statusBadge = getStatusBadge();

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAttendanceStats = () => {
        if (!meeting.participants || meeting.participants.length === 0) {
            return { total: 0, attended: 0, percentage: 0 };
        }
        const attended = meeting.participants.filter(p => p.attended).length;
        const percentage = Math.round((attended / meeting.participants.length) * 100);
        return { total: meeting.participants.length, attended, percentage };
    };

    const attendanceStats = getAttendanceStats();

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
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.title}
                                        onChange={(e) => setEditData({...editData, title: e.target.value})}
                                        className={`text-lg font-semibold w-full px-2 py-1 border rounded
                                            ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    />
                                ) : (
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        {meeting.title}
                                        <span className="text-xs text-gray-500">#{meeting.meetingId}</span>
                                        {meeting.meetingType === 'RECURRING' && (
                                            <RefreshCw className="h-4 w-4 text-blue-500" />
                                        )}
                                    </h3>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${statusBadge.color}`}>
                                        {statusBadge.icon}
                                        {statusBadge.label}
                                    </div>
                                    {meeting.project && (
                                        <span className="text-xs text-gray-500">
                                            Project: {meeting.project.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {canEdit && !isEditing && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={onDelete}
                                            className="p-2 text-red-400 hover:text-red-500 focus:outline-none"
                                        >
                                            <Trash className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="p-2 text-green-400 hover:text-green-500 focus:outline-none"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                                {!isEditing && (
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <nav className="flex space-x-8 px-6">
                            {['details', 'participants', 'attachments', 'mom'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-3 px-1 border-b-2 font-medium text-sm capitalize
                                        ${activeTab === tab
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {tab === 'details' ? t('meetings.detail.details') :
                                     tab === 'participants' ? t('meetings.detail.participants') :
                                     tab === 'attachments' ? t('meetings.detail.attachments') :
                                     tab === 'mom' ? t('meetings.mom.title') : tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                        {activeTab === 'details' && (
                            <div className="space-y-4">
                                {/* Description and Agenda */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">{t('meetings.mom.description')}</h4>
                                    {isEditing ? (
                                        <textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                                            rows="3"
                                            className={`w-full px-3 py-2 border rounded-lg
                                                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                        />
                                    ) : (
                                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {meeting.description || t('meetings.mom.noDescriptionProvided')}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">{t('meetings.mom.agenda')}</h4>
                                    {isEditing ? (
                                        <textarea
                                            value={editData.agenda}
                                            onChange={(e) => setEditData({...editData, agenda: e.target.value})}
                                            rows="4"
                                            className={`w-full px-3 py-2 border rounded-lg
                                                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                        />
                                    ) : (
                                        <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {meeting.agenda || t('meetings.mom.noAgendaSpecified')}
                                        </p>
                                    )}
                                </div>

                                {/* Schedule Information */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">{t('meetings.mom.schedule')}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{formatDateTime(meeting.meetingDate)}</span>
                                        </div>
                                        {meeting.endDate && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">{t('meetings.mom.ends')}: {formatDateTime(meeting.endDate)}</span>
                                            </div>
                                        )}
                                        {meeting.duration && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">{t('meetings.mom.duration')}: {t('meetings.mom.minutes', { duration: meeting.duration })}</span>
                                            </div>
                                        )}
                                        {meeting.recurrencePattern && (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">
                                                    {meetingService.getRecurrenceText(meeting.recurrencePattern)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">{t('meetings.form.location')}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {meeting.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editData.location}
                                                        onChange={(e) => setEditData({...editData, location: e.target.value})}
                                                        className={`flex-1 px-2 py-1 border rounded text-sm
                                                            ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                    />
                                                ) : (
                                                    <span className="text-sm">{meeting.location}</span>
                                                )}
                                            </div>
                                        )}
                                        {meeting.meetingLink && (
                                            <div className="flex items-center gap-2">
                                                <Video className="h-4 w-4 text-gray-400" />
                                                {isEditing ? (
                                                    <input
                                                        type="url"
                                                        value={editData.meetingLink}
                                                        onChange={(e) => setEditData({...editData, meetingLink: e.target.value})}
                                                        className={`flex-1 px-2 py-1 border rounded text-sm
                                                            ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                    />
                                                ) : (
                                                    <a
                                                        href={meeting.meetingLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                                                    >
                                                        {t('meetings.mom.joinMeeting')}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Owner Information */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">{t('meetings.mom.organizer')}</h4>
                                    <div className="flex items-center gap-3">
                                        {meeting.owner?.image ? (
                                            <img
                                                src={meeting.owner.image}
                                                alt={meeting.owner.name}
                                                className="h-8 w-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                                {meeting.owner?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{meeting.owner?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{meeting.owner?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'participants' && (
                            <div>
                                {/* Attendance Summary */}
                                {meeting.status === 'COMPLETED' && (
                                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold mb-1">{t('meetings.detail.attendanceSummary')}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {t('meetings.mom.participantsAttended', { attended: attendanceStats.attended, total: attendanceStats.total })}
                                                </p>
                                            </div>
                                            <div className={`text-2xl font-bold ${
                                                attendanceStats.percentage >= 80 ? 'text-green-600' :
                                                attendanceStats.percentage >= 50 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                                {attendanceStats.percentage}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Participants List */}
                                <div className="space-y-2">
                                    {meeting.participants?.length > 0 ? (
                                        meeting.participants.map((participant) => (
                                            <div
                                                key={participant.id}
                                                className={`p-3 border rounded-lg ${
                                                    isDark ? 'border-gray-700' : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {participant.user?.image || participant.stakeholder?.image ? (
                                                            <img
                                                                src={participant.user?.image || participant.stakeholder?.image}
                                                                alt={participant.user?.name || participant.stakeholder?.name || participant.name}
                                                                className="h-8 w-8 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
                                                                {(participant.user?.name || participant.stakeholder?.name || participant.name || '?').charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium">
                                                                {participant.user?.name || participant.stakeholder?.name || participant.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {participant.user?.email || participant.stakeholder?.email || participant.email}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            participant.role === 'ORGANIZER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            participant.role === 'PRESENTER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            participant.role === 'OPTIONAL' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' :
                                                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}>
                                                            {participant.role}
                                                        </span>
                                                    </div>
                                                    
                                                    {meeting.status === 'COMPLETED' && (
                                                        <button
                                                            onClick={() => handleAttendanceToggle(participant.id, participant.attended)}
                                                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors
                                                                ${participant.attended 
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                                } hover:opacity-80`}
                                                        >
                                                            {participant.attended ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    {t('meetings.detail.attended')}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-4 w-4" />
                                                                    {t('meetings.detail.absent')}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-8 text-gray-500">{t('meetings.detail.noParticipants')}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'attachments' && (
                            <div>
                                {meeting.attachments?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {meeting.attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className={`p-3 border rounded-lg flex items-center justify-between
                                                    ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Paperclip className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium">{attachment.fileName}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {attachment.type} • Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={attachment.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Paperclip className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-500">{t('meetings.detail.noAttachments')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mom' && (
                            <div>
                                {meeting.momStatus && meeting.momStatus !== 'DRAFT' ? (
                                    <div className="space-y-4">
                                        {/* MoM Status */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <h4 className="text-sm font-semibold mb-1">{t('meetings.mom.minutesStatus')}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {meeting.momFinalizedAt && `Finalized on ${new Date(meeting.momFinalizedAt).toLocaleDateString()}`}
                                                    {meeting.momDistributedAt && ` • Distributed on ${new Date(meeting.momDistributedAt).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded text-sm ${
                                                meeting.momStatus === 'DISTRIBUTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                meeting.momStatus === 'FINALIZED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                                {meeting.momStatus}
                                            </span>
                                        </div>

                                        {/* MoM Content */}
                                        {meeting.momContent && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Meeting Minutes</h4>
                                                <div className={`p-4 border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: meeting.momContent }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Discussion Points */}
                                        {meeting.discussionPoints?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Discussion Points</h4>
                                                <ul className="space-y-1">
                                                    {meeting.discussionPoints.map((point, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                                            <span className="text-sm">{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Decisions */}
                                        {meeting.decisions?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Decisions Made</h4>
                                                <ul className="space-y-1">
                                                    {meeting.decisions.map((decision, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                            <span className="text-sm">{decision}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Action Items */}
                                        {meeting.actionItems?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Action Items</h4>
                                                <ul className="space-y-1">
                                                    {meeting.actionItems.map((item, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <ClipboardList className="h-4 w-4 text-blue-500 mt-0.5" />
                                                            <span className="text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-500 mb-4">{t('meetings.mom.noMoM')}</p>
                                        <button
                                            onClick={onOpenMoM}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {t('meetings.mom.createMoM')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between`}>
                        <button
                            onClick={onOpenMoM}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            {meeting.momStatus ? t('meetings.mom.viewEditMoM') : t('meetings.mom.createMoM')}
                        </button>
                        
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

export default MeetingDetailModal;