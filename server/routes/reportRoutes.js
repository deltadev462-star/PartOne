import express from 'express';
import {
    getSavedReports,
    getReportData,
    saveReport,
    runReport,
    deleteReport,
    toggleFavorite,
    exportReport
} from '../controllers/reportController.js';

const router = express.Router();

// Get all saved reports
router.get('/saved', getSavedReports);

// Save a new report
router.post('/save', saveReport);

// Get report data for specific report type
router.get('/:projectId/:reportType', getReportData);

// Run a saved report
router.post('/run/:reportId', runReport);

// Toggle favorite status
router.patch('/favorite/:reportId', toggleFavorite);

// Delete a report
router.delete('/:reportId', deleteReport);

// Export report
router.get('/export/:projectId/:reportType', exportReport);

export default router;