import api from '../configs/api';

// Meeting CRUD operations
export const getMeetings = async (params = {}, token) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/api/meetings${queryString ? `?${queryString}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching meetings:', error);
        throw error;
    }
};

export const getMeetingById = async (id, token) => {
    try {
        const response = await api.get(`/api/meetings/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching meeting:', error);
        throw error;
    }
};

export const createMeeting = async (meetingData, token) => {
    try {
        const response = await api.post('/api/meetings', meetingData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating meeting:', error);
        throw error;
    }
};

export const updateMeeting = async (id, meetingData, token) => {
    try {
        const response = await api.put(`/api/meetings/${id}`, meetingData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating meeting:', error);
        throw error;
    }
};

export const deleteMeeting = async (id, token) => {
    try {
        const response = await api.delete(`/api/meetings/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting meeting:', error);
        throw error;
    }
};

// Meeting status operations
export const updateMeetingStatus = async (id, status, token) => {
    try {
        const response = await api.patch(`/api/meetings/${id}/status`, { status }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating meeting status:', error);
        throw error;
    }
};

// MoM (Minutes of Meeting) operations
export const updateMoM = async (id, momData, token) => {
    try {
        const response = await api.put(`/api/meetings/${id}/mom`, momData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating MoM:', error);
        throw error;
    }
};

export const finalizeMoM = async (id, userId, token) => {
    try {
        const response = await api.post(`/api/meetings/${id}/mom/finalize`, { userId }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error finalizing MoM:', error);
        throw error;
    }
};

export const distributeMoM = async (id, emails, token) => {
    try {
        const response = await api.post(`/api/meetings/${id}/mom/distribute`, { emails }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error distributing MoM:', error);
        throw error;
    }
};

// Attendance and sign-off operations
export const markAttendance = async (id, participantId, attended, token) => {
    try {
        const response = await api.patch(`/api/meetings/${id}/attendance`, {
            participantId,
            attended
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error marking attendance:', error);
        throw error;
    }
};

export const addSignoff = async (id, signoffData, token) => {
    try {
        const response = await api.post(`/api/meetings/${id}/signoff`, signoffData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error adding sign-off:', error);
        throw error;
    }
};

// Action item conversion
export const convertActionToTask = async (id, taskData, token) => {
    try {
        const response = await api.post(`/api/meetings/${id}/action-to-task`, taskData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error converting action to task:', error);
        throw error;
    }
};

// Utility functions
export const getUpcomingMeetings = async (params = {}, token) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/api/meetings/upcoming${queryString ? `?${queryString}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching upcoming meetings:', error);
        throw error;
    }
};

export const getMeetingCalendar = async (params = {}, token) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/api/meetings/calendar${queryString ? `?${queryString}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
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
export const searchMeetings = async (searchText, filters = {}, token) => {
    try {
        const params = {
            search: searchText,
            ...filters
        };
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/api/meetings?${queryString}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error searching meetings:', error);
        throw error;
    }
};

// Batch operations
export const bulkUpdateMeetingStatus = async (meetingIds, status, token) => {
    try {
        const promises = meetingIds.map(id => updateMeetingStatus(id, status, token));
        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        console.error('Error bulk updating meeting status:', error);
        throw error;
    }
};

export const bulkMarkAttendance = async (meetingId, attendanceData, token) => {
    try {
        const promises = attendanceData.map(data =>
            markAttendance(meetingId, data.participantId, data.attended, token)
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