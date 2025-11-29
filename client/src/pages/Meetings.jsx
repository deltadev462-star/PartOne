import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import * as meetingService from '../services/meetingService';
import {
    Plus,
    Calendar,
    CalendarDays,
    Clock,
    MapPin,
    Link,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    Download,
    ChevronRight,
    ChevronDown,
    Video,
    Phone,
    Edit,
    Trash,
    Eye,
    Send,
    Check,
    X,
    RefreshCw,
    List,
    Grid3x3,
    MoreVertical,
    Bell,
    Archive,
    Copy,
    ExternalLink,
    Paperclip,
    MessageSquare,
    ClipboardList,
    UserCheck,
    Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import MeetingListView from '../components/meetings/MeetingListView';
import MeetingCalendarView from '../components/meetings/MeetingCalendarView';
import CreateMeetingModal from '../components/meetings/CreateMeetingModal';
import MeetingDetailModal from '../components/meetings/MeetingDetailModal';
import MoMEditor from '../components/meetings/MoMEditor';

const Meetings = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getToken, userId } = useAuth();
    const isDark = useSelector((state) => state.theme.theme === 'dark');
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);
    
    // State management
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || 'global');
    const [activeTab, setActiveTab] = useState('upcoming');
    const [viewMode, setViewMode] = useState('list'); // list, calendar, day, week, month
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
        
    // Meetings state
    const [meetings, setMeetings] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [pastMeetings, setPastMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMoMEditorOpen, setIsMoMEditorOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Filter state
    const [filters, setFilters] = useState({
        status: '',
        meetingType: '',
        ownerId: '',
        search: '',
        fromDate: '',
        toDate: ''
    });
    
    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        recurring: 0,
        withMoM: 0,
        averageDuration: 0,
        averageAttendance: 0
    });

    useEffect(() => {
        if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [projectId]);

    useEffect(() => {
        fetchMeetings();
        fetchUpcomingMeetings();
    }, [selectedProjectId, filters]);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const params = {
                ...filters,
                projectId: selectedProjectId !== 'global' ? selectedProjectId : undefined,
                page: 1,
                limit: 100
            };

            const response = await meetingService.getMeetings(params, token);
            const allMeetings = response.meetings || [];
            
            setMeetings(allMeetings);
            
            // Separate upcoming and past meetings
            const now = new Date();
            const upcoming = allMeetings.filter(m => 
                new Date(m.meetingDate) >= now && m.status !== 'CANCELLED'
            );
            const past = allMeetings.filter(m => 
                new Date(m.meetingDate) < now || m.status === 'COMPLETED'
            );
            
            setUpcomingMeetings(upcoming);
            setPastMeetings(past);
            
            // Calculate stats
            const calculatedStats = meetingService.getMeetingStats(allMeetings);
            setStats(calculatedStats);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            toast.error('Failed to fetch meetings');
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcomingMeetings = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const params = {
                userId: userId,
                days: 7
            };

            const upcoming = await meetingService.getUpcomingMeetings(params, token);
            // This is specifically for the user's upcoming meetings widget
        } catch (error) {
            console.error('Error fetching upcoming meetings:', error);
        }
    };

    const handleProjectChange = (newProjectId) => {
        setSelectedProjectId(newProjectId);
        if (newProjectId !== 'global') {
            navigate(`/meetings/${newProjectId}`);
        } else {
            navigate('/meetings');
        }
    };

    const handleCreateMeeting = async (meetingData) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const dataToSend = {
                ...meetingData,
                projectId: selectedProjectId !== 'global' ? selectedProjectId : null,
                ownerId: userId
            };

            await meetingService.createMeeting(dataToSend, token);
            toast.success('Meeting created successfully');
            setIsCreateModalOpen(false);
            fetchMeetings();
        } catch (error) {
            console.error('Error creating meeting:', error);
            toast.error('Failed to create meeting');
        }
    };

    const handleUpdateMeeting = async (meetingId, updateData) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await meetingService.updateMeeting(meetingId, updateData, token);
            toast.success('Meeting updated successfully');
            fetchMeetings();
        } catch (error) {
            console.error('Error updating meeting:', error);
            toast.error('Failed to update meeting');
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (!window.confirm('Are you sure you want to delete this meeting?')) return;
        
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await meetingService.deleteMeeting(meetingId, token);
            toast.success('Meeting deleted successfully');
            setSelectedMeeting(null);
            fetchMeetings();
        } catch (error) {
            console.error('Error deleting meeting:', error);
            toast.error('Failed to delete meeting');
        }
    };

    const handleUpdateStatus = async (meetingId, status) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await meetingService.updateMeetingStatus(meetingId, status, token);
            toast.success('Meeting status updated');
            fetchMeetings();
        } catch (error) {
            console.error('Error updating meeting status:', error);
            toast.error('Failed to update meeting status');
        }
    };

    const handleMarkAttendance = async (meetingId, participantId, attended) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await meetingService.markAttendance(meetingId, participantId, attended, token);
            toast.success('Attendance marked');
            fetchMeetings();
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error('Failed to mark attendance');
        }
    };

    const handleFinalizeMoM = async (meetingId) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await meetingService.finalizeMoM(meetingId, userId, token);
            toast.success('Minutes of Meeting finalized');
            fetchMeetings();
        } catch (error) {
            console.error('Error finalizing MoM:', error);
            toast.error('Failed to finalize MoM');
        }
    };

    const handleDistributeMoM = async (meetingId, emails) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await meetingService.distributeMoM(meetingId, emails, token);
            toast.success('MoM distributed successfully');
            fetchMeetings();
        } catch (error) {
            console.error('Error distributing MoM:', error);
            toast.error('Failed to distribute MoM');
        }
    };

    // Get current project
    const currentProject = projects.find(p => p.id === selectedProjectId);

    // Filter meetings based on active tab
    const getFilteredMeetings = () => {
        switch (activeTab) {
            case 'upcoming':
                return upcomingMeetings;
            case 'past':
                return pastMeetings;
            case 'recurring':
                return meetings.filter(m => m.meetingType === 'RECURRING');
            default:
                return meetings;
        }
    };

    const filteredMeetings = getFilteredMeetings();

    return (
        <div className={`min-h-screen p-3 md:p-6`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex-1 w-full">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                            {t('meetings.title', 'Meetings')}
                        </h1>
                        
                        {/* Project Selector */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('meetings.scope', 'Scope')}:
                            </p>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                className={`px-3 py-2 text-sm rounded-lg border font-medium w-full sm:w-auto
                                    ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}
                                    focus:outline-none cursor-pointer transition-colors`}
                            >
                                <option value="global">{t('meetings.globalMeetings', 'Global Meetings')}</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            {currentProject && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-1 rounded ${
                                        currentProject.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                        {currentProject.status}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                            className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            {viewMode === 'list' ? (
                                <>
                                    <CalendarDays className="h-4 w-4" />
                                    <span className="hidden sm:inline text-xs sm:text-sm">
                                        {t('meetings.calendarView', 'Calendar')}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <List className="h-4 w-4" />
                                    <span className="hidden sm:inline text-xs sm:text-sm">
                                        {t('meetings.listView', 'List')}
                                    </span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-initial"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">
                                {t('meetings.scheduleMeeting', 'Schedule Meeting')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className={`rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'} p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('meetings.total', 'Total Meetings')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </div>

                    <div className={`rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'} p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('meetings.scheduled', 'Scheduled')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.scheduled}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
                        </div>
                    </div>

                    <div className={`rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'} p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('meetings.completed', 'Completed')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.completed}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </div>

                    <div className={`rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'} p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('meetings.withMoM', 'With MoM')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold">{stats.withMoM}</p>
                            </div>
                            <FileText className="h-8 w-8 text-purple-500 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 mb-6">
                    <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
                        <input
                            placeholder={t('meetings.searchPlaceholder', 'Search meetings...')}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className={`w-full px-3 py-2 pl-10 text-sm border rounded-lg focus:outline-none 
                                ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                        />
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className={`w-full sm:w-[150px] px-3 py-2 text-sm border rounded-lg focus:outline-none 
                            ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                    >
                        <option value="">{t('meetings.allStatuses', 'All Statuses')}</option>
                        <option value="SCHEDULED">{t('meetings.status.scheduled', 'Scheduled')}</option>
                        <option value="IN_PROGRESS">{t('meetings.status.inProgress', 'In Progress')}</option>
                        <option value="COMPLETED">{t('meetings.status.completed', 'Completed')}</option>
                        <option value="CANCELLED">{t('meetings.status.cancelled', 'Cancelled')}</option>
                    </select>

                    <select
                        value={filters.meetingType}
                        onChange={(e) => setFilters({ ...filters, meetingType: e.target.value })}
                        className={`w-full sm:w-[150px] px-3 py-2 text-sm border rounded-lg focus:outline-none 
                            ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                    >
                        <option value="">{t('meetings.allTypes', 'All Types')}</option>
                        <option value="ONE_TIME">{t('meetings.type.oneTime', 'One Time')}</option>
                        <option value="RECURRING">{t('meetings.type.recurring', 'Recurring')}</option>
                    </select>

                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                        className={`w-full sm:w-[150px] px-3 py-2 text-sm border rounded-lg focus:outline-none 
                            ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                        placeholder={t('meetings.fromDate', 'From Date')}
                    />

                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                        className={`w-full sm:w-[150px] px-3 py-2 text-sm border rounded-lg focus:outline-none 
                            ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                        placeholder={t('meetings.toDate', 'To Date')}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-6 overflow-x-auto`}>
                    <nav className="-mb-px flex space-x-4 md:space-x-8">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'upcoming'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('meetings.upcoming', 'Upcoming')} ({upcomingMeetings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'past'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('meetings.past', 'Past')} ({pastMeetings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('recurring')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                                activeTab === 'recurring'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('meetings.recurring', 'Recurring')} ({meetings.filter(m => m.meetingType === 'RECURRING').length})
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'list' ? (
                                <MeetingListView
                                    meetings={filteredMeetings}
                                    onSelect={setSelectedMeeting}
                                    onUpdateStatus={handleUpdateStatus}
                                    onEdit={(meeting) => {
                                        setSelectedMeeting(meeting);
                                    }}
                                    onDelete={handleDeleteMeeting}
                                    onOpenMoM={(meeting) => {
                                        setSelectedMeeting(meeting);
                                        setIsMoMEditorOpen(true);
                                    }}
                                    isDark={isDark}
                                />
                            ) : (
                                <MeetingCalendarView
                                    meetings={filteredMeetings}
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                    onMeetingSelect={setSelectedMeeting}
                                    onCreateMeeting={(date) => {
                                        setSelectedDate(date);
                                        setIsCreateModalOpen(true);
                                    }}
                                    viewType={viewMode}
                                    isDark={isDark}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateMeetingModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateMeeting}
                    projectId={selectedProjectId !== 'global' ? selectedProjectId : null}
                    projects={projects}
                    isDark={isDark}
                    selectedDate={selectedDate}
                />
            )}

            {selectedMeeting && !isMoMEditorOpen && (
                <MeetingDetailModal
                    isOpen={!!selectedMeeting}
                    onClose={() => setSelectedMeeting(null)}
                    meeting={selectedMeeting}
                    onUpdate={(updateData) => {
                        handleUpdateMeeting(selectedMeeting.id, updateData);
                        setSelectedMeeting(null);
                    }}
                    onDelete={() => {
                        handleDeleteMeeting(selectedMeeting.id);
                    }}
                    onMarkAttendance={handleMarkAttendance}
                    onOpenMoM={() => setIsMoMEditorOpen(true)}
                    canEdit={meetingService.canEditMeeting(selectedMeeting, userId)}
                    isDark={isDark}
                />
            )}

            {selectedMeeting && isMoMEditorOpen && (
                <MoMEditor
                    isOpen={isMoMEditorOpen}
                    onClose={() => {
                        setIsMoMEditorOpen(false);
                        setSelectedMeeting(null);
                    }}
                    meeting={selectedMeeting}
                    onSave={async (momData) => {
                        const token = await getToken();
                        await meetingService.updateMoM(selectedMeeting.id, momData, token);
                        toast.success('Minutes of Meeting saved');
                        fetchMeetings();
                    }}
                    onFinalize={() => handleFinalizeMoM(selectedMeeting.id)}
                    onDistribute={handleDistributeMoM}
                    canFinalize={meetingService.canFinalizeMoM(selectedMeeting, userId)}
                    canDistribute={meetingService.canDistributeMoM(selectedMeeting)}
                    isDark={isDark}
                />
            )}
        </div>
    );
};

export default Meetings;