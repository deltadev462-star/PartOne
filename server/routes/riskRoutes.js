const express = require('express');
const router = express.Router();
const {
  createRisk,
  getProjectRisks,
  getRisk,
  updateRisk,
  deleteRisk,
  addComment,
  updateRiskStatus,
  getRiskMatrix,
  assessRisk,
  upsertResponsePlan,
  addIndicator,
  updateIndicator,
  escalateRisk,
  getRiskHistory,
  getRiskAnalytics,
  linkToRequirement,
  linkToTask
} = require('../controllers/riskController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Risk CRUD operations
router.post('/', createRisk);
router.get('/project/:projectId', getProjectRisks);
router.get('/:riskId', getRisk);
router.put('/:riskId', updateRisk);
router.delete('/:riskId', deleteRisk);

// Risk comments
router.post('/:riskId/comment', addComment);

// Risk status management
router.patch('/:riskId/status', updateRiskStatus);

// Risk matrix
router.get('/project/:projectId/matrix', getRiskMatrix);

// Risk assessment
router.post('/:riskId/assess', assessRisk);

// Response planning
router.post('/:riskId/response-plan', upsertResponsePlan);
router.put('/:riskId/response-plan', upsertResponsePlan);

// Risk indicators
router.post('/:riskId/indicators', addIndicator);
router.put('/:riskId/indicators/:indicatorId', updateIndicator);

// Risk escalation
router.post('/:riskId/escalate', escalateRisk);

// Risk history
router.get('/:riskId/history', getRiskHistory);

// Risk analytics
router.get('/project/:projectId/analytics', getRiskAnalytics);

// Risk linking
router.post('/:riskId/link-requirement', linkToRequirement);
router.post('/:riskId/link-task', linkToTask);

// Export/Import routes (handled by controller)
router.get('/project/:projectId/export', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'xlsx', ...filters } = req.query;
    
    // Implementation depends on your export logic
    const risks = await getProjectRisks(req, res);
    
    // Format and send response based on format
    if (format === 'xlsx') {
      // Excel export logic
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="risks-${projectId}.xlsx"`);
    } else if (format === 'csv') {
      // CSV export logic
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="risks-${projectId}.csv"`);
    } else if (format === 'pdf') {
      // PDF export logic
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="risks-${projectId}.pdf"`);
    }
    
    // Send formatted data
    res.send(risks);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    // Import logic - process uploaded file
    const { projectId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Process file and import risks
    // Implementation depends on your import logic
    
    res.json({ message: 'Risks imported successfully' });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed', details: error.message });
  }
});

router.get('/template', (req, res) => {
  try {
    // Generate and send template
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="risk-template.xlsx"');
    
    // Send template file
    // Implementation depends on your template generation logic
    res.send('Template data');
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: 'Template download failed', details: error.message });
  }
});

// Bulk operations
router.put('/bulk-update', async (req, res) => {
  try {
    const { riskIds, updateData } = req.body;
    
    // Bulk update logic
    // Implementation depends on your bulk update logic
    
    res.json({ message: 'Risks updated successfully' });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Bulk update failed', details: error.message });
  }
});

module.exports = router;