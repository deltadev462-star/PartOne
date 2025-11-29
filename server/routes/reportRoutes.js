import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
    getSavedReports,
    getReportData,
    saveReport,
    runReport,
    deleteReport,
    toggleFavorite,
    exportReport,
    getReportStatistics,
    duplicateReport
} from '../controllers/reportController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Get all saved reports
router.get('/saved', getSavedReports);

// Save a new report
router.post('/save', saveReport);

// Get report statistics for a project
router.get('/:projectId/statistics', getReportStatistics);

// Get report data for specific report type
router.get('/:projectId/:reportType', getReportData);

// Run a saved report
router.post('/run/:reportId', runReport);

// Toggle favorite status
router.patch('/favorite/:reportId', toggleFavorite);

// Duplicate a report
router.post('/duplicate/:reportId', duplicateReport);

// Delete a report
router.delete('/:reportId', deleteReport);

// Export report
router.get('/export/:projectId/:reportType', exportReport);

export default router;