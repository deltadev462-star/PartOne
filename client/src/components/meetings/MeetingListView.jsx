import React from 'react';
import {
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
    MoreVertical,
    RefreshCw,
    ExternalLink,
    Paperclip,
    UserCheck,
    Mail
} from 'lucide-react';

const MeetingListView = ({ 
    meetings, 
    onSelect, 
    onUpdateStatus, 
    onEdit, 
    onDelete, 
    onOpenMoM,
    isDark 
}) => {
    const getStatusBadge = (status) => {
        const statusConfig = {
            SCHEDULED: {
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                icon: <Clock className="h-3 w-3" />,
                label: 'Scheduled'
            },
            IN_PROGRESS: {
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                icon: <AlertCircle className="h-3 w-3" />,
                label: 'In Progress'
            },
            COMPLETED: {
                color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                icon: <CheckCircle className="h-3 w-3" />,
                label: 'Completed'
            },
            CANCELLED: {
                color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                icon: <XCircle className="h-3 w-3" />,
                label: 'Cancelled'
            }
        };
        return statusConfig[status] || statusConfig.SCHEDULED;
    };

    const getMoMStatusBadge = (momStatus) => {
        const momConfig = {
            DRAFT: {
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
                label: 'Draft'
            },
            FINALIZED: {
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                label: 'Finalized'
            },
            DISTRIBUTED: {
                color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                label: 'Distributed'
            }
        };
        return momConfig[momStatus] || { color: '', label: 'No MoM' };
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAttendanceRate = (participants) => {
        if (!participants || participants.length === 0) return 0;
        const attended = participants.filter(p => p.attended).length;
        return Math.round((attended / participants.length) * 100);
    };

    if (!meetings || meetings.length === 0) {
        return (
            <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No meetings found</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Schedule your first meeting to get started
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {meetings.map((meeting) => {
                const statusBadge = getStatusBadge(meeting.status);
                const momBadge = getMoMStatusBadge(meeting.momStatus);
                const attendanceRate = getAttendanceRate(meeting.participants);

                return (
                    <div
                        key={meeting.id}
                        className={`rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer
                            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                            border`}
                        onClick={() => onSelect(meeting)}
                    >
                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold">{meeting.title}</h3>
                                        <span className="text-xs text-gray-500">#{meeting.meetingId}</span>
                                        {meeting.meetingType === 'RECURRING' && (
                                            <RefreshCw className="h-4 w-4 text-blue-500" />
                                        )}
                                    </div>
                                    {meeting.description && (
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                            {meeting.description}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${statusBadge.color}`}>
                                        {statusBadge.icon}
                                        {statusBadge.label}
                                    </div>
                                    
                                    <div className="relative group">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg
                                            ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                                            border opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                            transition-all z-10`}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(meeting);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                                                    hover:bg-gray-100 dark:hover:bg-gray-600`}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit Meeting
                                            </button>
                                            
                                            {meeting.status === 'SCHEDULED' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateStatus(meeting.id, 'IN_PROGRESS');
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                                                        hover:bg-gray-100 dark:hover:bg-gray-600`}
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                    Start Meeting
                                                </button>
                                            )}
                                            
                                            {meeting.status === 'IN_PROGRESS' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateStatus(meeting.id, 'COMPLETED');
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                                                        hover:bg-gray-100 dark:hover:bg-gray-600`}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    End Meeting
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenMoM(meeting);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                                                    hover:bg-gray-100 dark:hover:bg-gray-600`}
                                            >
                                                <FileText className="h-4 w-4" />
                                                Manage MoM
                                            </button>
                                            
                                            <hr className={`my-1 ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(meeting.id);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                                                    text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
                                            >
                                                <Trash className="h-4 w-4" />
                                                Delete Meeting
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{formatDate(meeting.meetingDate)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{formatTime(meeting.meetingDate)}</span>
                                    {meeting.duration && (
                                        <span className="text-gray-500">({meeting.duration} min)</span>
                                    )}
                                </div>
                                
                                {meeting.location && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{meeting.location}</span>
                                    </div>
                                )}
                                
                                {meeting.meetingLink && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Video className="h-4 w-4 text-gray-400" />
                                        <a
                                            href={meeting.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            Join Meeting
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    {/* Participants */}
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">
                                            {meeting.participants?.length || 0} participants
                                        </span>
                                        {meeting.status === 'COMPLETED' && attendanceRate > 0 && (
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                attendanceRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                attendanceRate >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {attendanceRate}% attended
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Attachments */}
                                    {meeting.attachments && meeting.attachments.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">
                                                {meeting.attachments.length} files
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Action Items */}
                                    {meeting._count?.actionTasks > 0 && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">
                                                {meeting._count.actionTasks} action items
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* MoM Status */}
                                {meeting.momStatus && (
                                    <div className={`px-2 py-1 rounded text-xs ${momBadge.color}`}>
                                        {momBadge.label}
                                    </div>
                                )}
                            </div>
                            
                            {/* Project Info */}
                            {meeting.project && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-xs text-gray-500">
                                        Project: {meeting.project.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MeetingListView;