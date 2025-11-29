const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new risk
const createRisk = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      likelihood,
      impact,
      severity,
      riskLevel,
      riskScore,
      owner,
      status,
      riskStatement,
      cause,
      effect,
      triggers,
      indicators,
      existingControls,
      proposedControls,
      detectability,
      velocity,
      estimatedCost,
      estimatedScheduleImpact,
      tags,
      relatedRisks
    } = req.body;

    const risk = await prisma.risk.create({
      data: {
        projectId,
        riskId: generateRiskId(),
        title,
        description,
        category,
        likelihood,
        impact: impact || severity,
        riskLevel,
        riskScore: riskScore || calculateRiskScore(likelihood, impact || severity),
        owner,
        status: status || 'IDENTIFIED',
        riskStatement,
        cause,
        effect,
        triggers: triggers || [],
        indicators: indicators || [],
        existingControls,
        proposedControls,
        detectability,
        velocity,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        estimatedScheduleImpact,
        tags: tags || [],
        relatedRisks: relatedRisks || [],
        createdBy: req.user.userId
      },
      include: {
        project: true,
        comments: true,
        history: true,
        linkedRequirements: true,
        linkedTasks: true
      }
    });

    res.status(201).json({ risk });
  } catch (error) {
    console.error('Error creating risk:', error);
    res.status(500).json({ error: 'Failed to create risk', details: error.message });
  }
};

// Get all risks for a project
const getProjectRisks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      category,
      status,
      severity,
      likelihood,
      riskLevel,
      owner,
      search
    } = req.query;

    // Build filter conditions
    const where = {
      projectId,
      ...(category && { category }),
      ...(status && { status }),
      ...(severity && { severity }),
      ...(likelihood && { likelihood }),
      ...(riskLevel && { riskLevel }),
      ...(owner && { owner }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { riskId: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const risks = await prisma.risk.findMany({
      where,
      include: {
        project: true,
        comments: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        },
        linkedRequirements: true,
        linkedTasks: true,
        responsePlans: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ risks });
  } catch (error) {
    console.error('Error fetching project risks:', error);
    res.status(500).json({ error: 'Failed to fetch risks', details: error.message });
  }
};

// Get single risk
const getRisk = async (req, res) => {
  try {
    const { riskId } = req.params;

    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      include: {
        project: true,
        comments: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        },
        history: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        },
        linkedRequirements: true,
        linkedTasks: true,
        responsePlans: {
          include: {
            actions: true
          }
        }
      }
    });

    if (!risk) {
      return res.status(404).json({ error: 'Risk not found' });
    }

    res.json({ risk });
  } catch (error) {
    console.error('Error fetching risk:', error);
    res.status(500).json({ error: 'Failed to fetch risk', details: error.message });
  }
};

// Update risk
const updateRisk = async (req, res) => {
  try {
    const { riskId } = req.params;
    const updateData = { ...req.body };

    // Track history
    const oldRisk = await prisma.risk.findUnique({
      where: { id: riskId }
    });

    if (!oldRisk) {
      return res.status(404).json({ error: 'Risk not found' });
    }

    // Calculate new risk score if likelihood or impact changed
    if (updateData.likelihood || updateData.impact) {
      updateData.riskScore = calculateRiskScore(
        updateData.likelihood || oldRisk.likelihood,
        updateData.impact || oldRisk.impact
      );
    }

    const risk = await prisma.risk.update({
      where: { id: riskId },
      data: {
        ...updateData,
        updatedBy: req.user.userId
      },
      include: {
        project: true,
        comments: true,
        linkedRequirements: true,
        linkedTasks: true
      }
    });

    // Create history entry
    await createHistoryEntry(riskId, req.user.userId, 'UPDATE', {
      oldValues: oldRisk,
      newValues: risk
    });

    res.json({ risk });
  } catch (error) {
    console.error('Error updating risk:', error);
    res.status(500).json({ error: 'Failed to update risk', details: error.message });
  }
};

// Delete risk
const deleteRisk = async (req, res) => {
  try {
    const { riskId } = req.params;

    await prisma.risk.delete({
      where: { id: riskId }
    });

    res.json({ message: 'Risk deleted successfully' });
  } catch (error) {
    console.error('Error deleting risk:', error);
    res.status(500).json({ error: 'Failed to delete risk', details: error.message });
  }
};

// Add comment to risk
const addComment = async (req, res) => {
  try {
    const { riskId } = req.params;
    const { content } = req.body;

    const comment = await prisma.riskComment.create({
      data: {
        riskId,
        content,
        userId: req.user.userId
      },
      include: {
        user: true
      }
    });

    res.json({ comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
};

// Update risk status
const updateRiskStatus = async (req, res) => {
  try {
    const { riskId } = req.params;
    const { status } = req.body;

    const risk = await prisma.risk.update({
      where: { id: riskId },
      data: {
        status,
        updatedBy: req.user.userId
      },
      include: {
        project: true
      }
    });

    // Create history entry
    await createHistoryEntry(riskId, req.user.userId, 'STATUS_CHANGE', {
      newStatus: status
    });

    res.json({ risk });
  } catch (error) {
    console.error('Error updating risk status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
};

// Get risk matrix data
const getRiskMatrix = async (req, res) => {
  try {
    const { projectId } = req.params;

    const risks = await prisma.risk.findMany({
      where: { projectId },
      select: {
        id: true,
        riskId: true,
        title: true,
        category: true,
        likelihood: true,
        impact: true,
        riskLevel: true,
        riskScore: true,
        status: true,
        trend: true
      }
    });

    // Group risks by likelihood and impact
    const matrix = {};
    risks.forEach(risk => {
      const key = `${risk.likelihood}-${risk.impact}`;
      if (!matrix[key]) {
        matrix[key] = [];
      }
      matrix[key].push(risk);
    });

    res.json({ matrix, risks });
  } catch (error) {
    console.error('Error fetching risk matrix:', error);
    res.status(500).json({ error: 'Failed to fetch matrix data', details: error.message });
  }
};

// Perform risk assessment
const assessRisk = async (req, res) => {
  try {
    const { riskId } = req.params;
    const {
      likelihood,
      impact,
      detectability,
      velocity,
      interconnectedness,
      controlEffectiveness
    } = req.body;

    const riskScore = calculateComprehensiveScore({
      likelihood,
      impact,
      detectability,
      velocity,
      interconnectedness,
      controlEffectiveness
    });

    const risk = await prisma.risk.update({
      where: { id: riskId },
      data: {
        likelihood,
        impact,
        detectability,
        velocity,
        interconnectedness,
        controlEffectiveness,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        lastAssessmentDate: new Date(),
        assessedBy: req.user.userId
      },
      include: {
        project: true
      }
    });

    // Create history entry
    await createHistoryEntry(riskId, req.user.userId, 'ASSESSMENT', {
      riskScore,
      assessmentData: req.body
    });

    res.json({ risk });
  } catch (error) {
    console.error('Error assessing risk:', error);
    res.status(500).json({ error: 'Failed to assess risk', details: error.message });
  }
};

// Create or update response plan
const upsertResponsePlan = async (req, res) => {
  try {
    const { riskId } = req.params;
    const {
      responseStrategy,
      mitigationStrategy,
      contingencyPlan,
      fallbackPlan,
      responseOwner,
      responseDeadline,
      responseCost,
      responseEffectiveness,
      acceptanceCriteria,
      triggers,
      actions
    } = req.body;

    // Check if response plan exists
    const existingPlan = await prisma.riskResponsePlan.findUnique({
      where: { riskId }
    });

    const planData = {
      responseStrategy,
      mitigationStrategy,
      contingencyPlan,
      fallbackPlan,
      responseOwner,
      responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
      responseCost: responseCost ? parseFloat(responseCost) : null,
      responseEffectiveness: responseEffectiveness || 50,
      acceptanceCriteria,
      triggers: triggers || [],
      updatedBy: req.user.userId
    };

    let responsePlan;
    if (existingPlan) {
      responsePlan = await prisma.riskResponsePlan.update({
        where: { id: existingPlan.id },
        data: planData,
        include: {
          actions: true
        }
      });
    } else {
      responsePlan = await prisma.riskResponsePlan.create({
        data: {
          ...planData,
          riskId,
          createdBy: req.user.userId
        },
        include: {
          actions: true
        }
      });
    }

    // Handle actions
    if (actions && actions.length > 0) {
      // Delete existing actions
      await prisma.riskResponseAction.deleteMany({
        where: { responsePlanId: responsePlan.id }
      });

      // Create new actions
      await prisma.riskResponseAction.createMany({
        data: actions.map(action => ({
          responsePlanId: responsePlan.id,
          description: action.description,
          status: action.status || 'PENDING',
          assignedTo: action.assignedTo,
          dueDate: action.dueDate ? new Date(action.dueDate) : null
        }))
      });
    }

    // Calculate residual risk
    const risk = await prisma.risk.findUnique({
      where: { id: riskId }
    });

    const residualRisk = risk.riskScore * (1 - (responseEffectiveness || 50) / 100);
    
    await prisma.risk.update({
      where: { id: riskId },
      data: {
        residualRisk,
        responseImplemented: true
      }
    });

    res.json({ responsePlan });
  } catch (error) {
    console.error('Error managing response plan:', error);
    res.status(500).json({ error: 'Failed to manage response plan', details: error.message });
  }
};

// Add risk indicator
const addIndicator = async (req, res) => {
  try {
    const { riskId } = req.params;
    const { name, threshold, currentValue, active } = req.body;

    const indicator = await prisma.riskIndicator.create({
      data: {
        riskId,
        name,
        threshold,
        currentValue,
        active: active !== false,
        triggered: currentValue > threshold
      }
    });

    res.json({ indicator });
  } catch (error) {
    console.error('Error adding indicator:', error);
    res.status(500).json({ error: 'Failed to add indicator', details: error.message });
  }
};

// Update risk indicator
const updateIndicator = async (req, res) => {
  try {
    const { riskId, indicatorId } = req.params;
    const { currentValue, active } = req.body;

    const indicator = await prisma.riskIndicator.update({
      where: { id: indicatorId },
      data: {
        currentValue,
        active,
        triggered: currentValue > indicator.threshold,
        lastUpdated: new Date()
      }
    });

    // If indicator is triggered, update risk status
    if (indicator.triggered) {
      await prisma.risk.update({
        where: { id: riskId },
        data: {
          status: 'MONITORING',
          trend: 'INCREASING'
        }
      });
    }

    res.json({ indicator });
  } catch (error) {
    console.error('Error updating indicator:', error);
    res.status(500).json({ error: 'Failed to update indicator', details: error.message });
  }
};

// Escalate risk
const escalateRisk = async (req, res) => {
  try {
    const { riskId } = req.params;
    const { escalatedTo, escalationNotes, priority } = req.body;

    const risk = await prisma.risk.update({
      where: { id: riskId },
      data: {
        escalated: true,
        escalatedTo,
        escalationDate: new Date(),
        escalationNotes,
        escalationPriority: priority || 'HIGH',
        escalationStatus: 'PENDING'
      }
    });

    // Create history entry
    await createHistoryEntry(riskId, req.user.userId, 'ESCALATION', {
      escalatedTo,
      escalationNotes
    });

    // Send notifications (implement notification service)
    // await sendEscalationNotification(risk);

    res.json({ risk });
  } catch (error) {
    console.error('Error escalating risk:', error);
    res.status(500).json({ error: 'Failed to escalate risk', details: error.message });
  }
};

// Get risk history
const getRiskHistory = async (req, res) => {
  try {
    const { riskId } = req.params;

    const history = await prisma.riskHistory.findMany({
      where: { riskId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ history });
  } catch (error) {
    console.error('Error fetching risk history:', error);
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
};

// Get risk analytics
const getRiskAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(endDate) };
    }

    const risks = await prisma.risk.findMany({
      where: {
        projectId,
        ...dateFilter
      }
    });

    // Calculate analytics
    const analytics = {
      totalRisks: risks.length,
      byStatus: {},
      byCategory: {},
      byRiskLevel: {},
      averageRiskScore: 0,
      mitigationRate: 0,
      trends: {
        increasing: 0,
        decreasing: 0,
        stable: 0
      }
    };

    let totalScore = 0;
    risks.forEach(risk => {
      // Status distribution
      analytics.byStatus[risk.status] = (analytics.byStatus[risk.status] || 0) + 1;
      
      // Category distribution
      analytics.byCategory[risk.category] = (analytics.byCategory[risk.category] || 0) + 1;
      
      // Risk level distribution
      analytics.byRiskLevel[risk.riskLevel] = (analytics.byRiskLevel[risk.riskLevel] || 0) + 1;
      
      // Trends
      if (risk.trend) {
        analytics.trends[risk.trend.toLowerCase()]++;
      }
      
      // Score calculation
      if (risk.riskScore) {
        totalScore += risk.riskScore;
      }
    });

    analytics.averageRiskScore = risks.length > 0 ? Math.round(totalScore / risks.length) : 0;
    analytics.mitigationRate = risks.length > 0 
      ? Math.round((analytics.byStatus.MITIGATED || 0) / risks.length * 100)
      : 0;

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching risk analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
};

// Link risk to requirement
const linkToRequirement = async (req, res) => {
  try {
    const { riskId } = req.params;
    const { requirementId } = req.body;

    await prisma.riskRequirementLink.create({
      data: {
        riskId,
        requirementId
      }
    });

    res.json({ message: 'Risk linked to requirement successfully' });
  } catch (error) {
    console.error('Error linking risk to requirement:', error);
    res.status(500).json({ error: 'Failed to link risk', details: error.message });
  }
};

// Link risk to task
const linkToTask = async (req, res) => {
  try {
    const { riskId } = req.params;
    const { taskId } = req.body;

    await prisma.riskTaskLink.create({
      data: {
        riskId,
        taskId
      }
    });

    res.json({ message: 'Risk linked to task successfully' });
  } catch (error) {
    console.error('Error linking risk to task:', error);
    res.status(500).json({ error: 'Failed to link risk', details: error.message });
  }
};

// Helper functions
function generateRiskId() {
  const prefix = 'RSK';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}-${random}`;
}

function calculateRiskScore(likelihood, impact) {
  const likelihoodScores = {
    RARE: 1,
    UNLIKELY: 2,
    POSSIBLE: 3,
    LIKELY: 4,
    ALMOST_CERTAIN: 5
  };
  
  const impactScores = {
    INSIGNIFICANT: 1,
    MINOR: 2,
    MODERATE: 3,
    MAJOR: 4,
    CATASTROPHIC: 5
  };
  
  const l = likelihoodScores[likelihood] || 3;
  const i = impactScores[impact] || 3;
  
  return l * i * 4; // Scale to 0-100
}

function calculateComprehensiveScore(params) {
  const weights = {
    likelihood: 0.25,
    impact: 0.25,
    detectability: 0.15,
    velocity: 0.15,
    interconnectedness: 0.10,
    controlEffectiveness: 0.10
  };
  
  let score = 0;
  Object.keys(weights).forEach(key => {
    const value = params[key] || 3; // Default to medium
    score += value * weights[key];
  });
  
  return Math.round(score * 20); // Scale to 0-100
}

function getRiskLevel(score) {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

async function createHistoryEntry(riskId, userId, action, details) {
  try {
    await prisma.riskHistory.create({
      data: {
        riskId,
        userId,
        action,
        details: JSON.stringify(details)
      }
    });
  } catch (error) {
    console.error('Error creating history entry:', error);
  }
}

module.exports = {
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
};