import api from '../configs/api';

// Meeting CRUD operations
export const getMeetings = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/meetings${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching meetings:', error);
        throw error;
    }
};

export const getMeetingById = async (id) => {
    try {
        const response = await api.get(`/meetings/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching meeting:', error);
        throw error;
    }
};

export const createMeeting = async (meetingData) => {
    try {
        const response = await api.post('/meetings', meetingData);
        return response.data;
    } catch (error) {
        console.error('Error creating meeting:', error);
        throw error;
    }
};

export const updateMeeting = async (id, meetingData) => {
    try {
        const response = await api.put(`/meetings/${id}`, meetingData);
        return response.data;
    } catch (error) {
        console.error('Error updating meeting:', error);
        throw error;
    }
};

export const deleteMeeting = async (id) => {
    try {
        const response = await api.delete(`/meetings/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting meeting:', error);
        throw error;
    }
};

// Meeting status operations
export const updateMeetingStatus = async (id, status) => {
    try {
        const response = await api.patch(`/meetings/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating meeting status:', error);
        throw error;
    }
};

// MoM (Minutes of Meeting) operations
export const updateMoM = async (id, momData) => {
    try {
        const response = await api.put(`/meetings/${id}/mom`, momData);
        return response.data;
    } catch (error) {
        console.error('Error updating MoM:', error);
        throw error;
    }
};

export const finalizeMoM = async (id, userId) => {
    try {
        const response = await api.post(`/meetings/${id}/mom/finalize`, { userId });
        return response.data;
    } catch (error) {
        console.error('Error finalizing MoM:', error);
        throw error;
    }
};

export const distributeMoM = async (id, emails) => {
    try {
        const response = await api.post(`/meetings/${id}/mom/distribute`, { emails });
        return response.data;
    } catch (error) {
        console.error('Error distributing MoM:', error);
        throw error;
    }
};

// Attendance and sign-off operations
export const markAttendance = async (id, participantId, attended) => {
    try {
        const response = await api.patch(`/meetings/${id}/attendance`, { 
            participantId, 
            attended 
        });
        return response.data;
    } catch (error) {
        console.error('Error marking attendance:', error);
        throw error;
    }
};

export const addSignoff = async (id, signoffData) => {
    try {
        const response = await api.post(`/meetings/${id}/signoff`, signoffData);
        return response.data;
    } catch (error) {
        console.error('Error adding sign-off:', error);
        throw error;
    }
};

// Action item conversion
export const convertActionToTask = async (id, taskData) => {
    try {
        const response = await api.post(`/meetings/${id}/action-to-task`, taskData);
        return response.data;
    } catch (error) {
        console.error('Error converting action to task:', error);
        throw error;
    }
};

// Utility functions
export const getUpcomingMeetings = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/meetings/upcoming${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching upcoming meetings:', error);
        throw error;
    }
};

export const getMeetingCalendar = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/meetings/calendar${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        throw error;
    }
};

// Helper functions for meeting management
export const formatMeetingDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getMeetingStatusColor = (status) => {
    switch (status) {
        case 'SCHEDULED':
            return 'blue';
        case 'IN_PROGRESS':
            return 'orange';
        case 'COMPLETED':
            return 'green';
        case 'CANCELLED':
            return 'red';
        default:
            return 'gray';
    }
};

export const getRecurrenceText = (pattern) => {
    switch (pattern) {
        case 'DAILY':
            return 'Daily';
        case 'WEEKLY':
            return 'Weekly';
        case 'BIWEEKLY':
            return 'Bi-weekly';
        case 'MONTHLY':
            return 'Monthly';
        case 'QUARTERLY':
            return 'Quarterly';
        default:
            return '';
    }
};

export const getMeetingTypeIcon = (type) => {
    switch (type) {
        case 'ONE_TIME':
            return 'calendar';
        case 'RECURRING':
            return 'repeat';
        default:
            return 'calendar';
    }
};

export const canEditMeeting = (meeting, userId) => {
    return meeting.ownerId === userId || meeting.status === 'SCHEDULED';
};

export const canFinalizeMoM = (meeting, userId) => {
    return (meeting.ownerId === userId || meeting.participants?.some(p => p.userId === userId && p.role === 'ORGANIZER')) 
        && meeting.status === 'COMPLETED' 
        && meeting.momStatus === 'DRAFT';
};

export const canDistributeMoM = (meeting) => {
    return meeting.momStatus === 'FINALIZED';
};

// Export meeting data
export const exportMeetingData = (meeting) => {
    const exportData = {
        meeting: {
            id: meeting.meetingId,
            title: meeting.title,
            date: meeting.meetingDate,
            location: meeting.location,
            meetingLink: meeting.meetingLink,
            status: meeting.status
        },
        agenda: meeting.agenda,
        participants: meeting.participants?.map(p => ({
            name: p.user?.name || p.stakeholder?.name || p.name,
            email: p.user?.email || p.stakeholder?.email || p.email,
            attended: p.attended,
            role: p.role
        })),
        mom: {
            content: meeting.momContent,
            discussionPoints: meeting.discussionPoints,
            decisions: meeting.decisions,
            actionItems: meeting.actionItems,
            concerns: meeting.concerns,
            notes: meeting.notes
        },
        attachments: meeting.attachments?.map(a => ({
            name: a.fileName,
            url: a.fileUrl,
            type: a.type
        }))
    };

    return exportData;
};

// Search meetings
export const searchMeetings = async (searchText, filters = {}) => {
    try {
        const params = {
            search: searchText,
            ...filters
        };
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/meetings?${queryString}`);
        return response.data;
    } catch (error) {
        console.error('Error searching meetings:', error);
        throw error;
    }
};

// Batch operations
export const bulkUpdateMeetingStatus = async (meetingIds, status) => {
    try {
        const promises = meetingIds.map(id => updateMeetingStatus(id, status));
        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        console.error('Error bulk updating meeting status:', error);
        throw error;
    }
};

export const bulkMarkAttendance = async (meetingId, attendanceData) => {
    try {
        const promises = attendanceData.map(data => 
            markAttendance(meetingId, data.participantId, data.attended)
        );
        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        console.error('Error bulk marking attendance:', error);
        throw error;
    }
};

// Meeting analytics
export const getMeetingStats = (meetings) => {
    const stats = {
        total: meetings.length,
        scheduled: meetings.filter(m => m.status === 'SCHEDULED').length,
        completed: meetings.filter(m => m.status === 'COMPLETED').length,
        cancelled: meetings.filter(m => m.status === 'CANCELLED').length,
        recurring: meetings.filter(m => m.meetingType === 'RECURRING').length,
        withMoM: meetings.filter(m => m.momStatus === 'FINALIZED' || m.momStatus === 'DISTRIBUTED').length,
        averageDuration: meetings.reduce((sum, m) => sum + (m.duration || 0), 0) / meetings.length || 0,
        averageAttendance: meetings.reduce((sum, m) => {
            const total = m.participants?.length || 0;
            const attended = m.participants?.filter(p => p.attended).length || 0;
            return sum + (total > 0 ? (attended / total) * 100 : 0);
        }, 0) / meetings.length || 0
    };
    
    return stats;
};

export default {
    getMeetings,
    getMeetingById,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingStatus,
    updateMoM,
    finalizeMoM,
    distributeMoM,
    markAttendance,
    addSignoff,
    convertActionToTask,
    getUpcomingMeetings,
    getMeetingCalendar,
    formatMeetingDate,
    getMeetingStatusColor,
    getRecurrenceText,
    getMeetingTypeIcon,
    canEditMeeting,
    canFinalizeMoM,
    canDistributeMoM,
    exportMeetingData,
    searchMeetings,
    bulkUpdateMeetingStatus,
    bulkMarkAttendance,
    getMeetingStats
};