import express from 'express';
import {
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
    getMeetingCalendar
} from '../controllers/meetingController.js';

const router = express.Router();

// Base meeting routes
router.get('/meetings', getMeetings);
router.get('/meetings/upcoming', getUpcomingMeetings);
router.get('/meetings/calendar', getMeetingCalendar);
router.get('/meetings/:id', getMeetingById);
router.post('/meetings', createMeeting);
router.put('/meetings/:id', updateMeeting);
router.delete('/meetings/:id', deleteMeeting);

// Meeting status routes
router.patch('/meetings/:id/status', updateMeetingStatus);

// MoM (Minutes of Meeting) routes
router.put('/meetings/:id/mom', updateMoM);
router.post('/meetings/:id/mom/finalize', finalizeMoM);
router.post('/meetings/:id/mom/distribute', distributeMoM);

// Attendance and sign-off routes
router.patch('/meetings/:id/attendance', markAttendance);
router.post('/meetings/:id/signoff', addSignoff);

// Action item conversion route
router.post('/meetings/:id/action-to-task', convertActionToTask);

export default router;