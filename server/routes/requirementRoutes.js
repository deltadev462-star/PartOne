import express from "express";
import {
    createRequirement,
    getProjectRequirements,
    getRequirement,
    updateRequirement,
    deleteRequirement,
    addRequirementComment,
    linkRequirementToTask,
    getTraceabilityMatrix,
    baselineRequirement,
    linkRequirementToTestCase,
    updateTestCaseStatus,
    getRequirementsHierarchy,
    exportRequirements,
    importRequirements,
    downloadRequirementTemplate
} from "../controllers/requirementController.js";

const requirementRouter = express.Router();

// Requirements CRUD
requirementRouter.post("/", createRequirement);
requirementRouter.get("/project/:projectId", getProjectRequirements);
requirementRouter.get("/project/:projectId/hierarchy", getRequirementsHierarchy);
requirementRouter.get("/:requirementId", getRequirement);
requirementRouter.put("/:requirementId", updateRequirement);
requirementRouter.delete("/:requirementId", deleteRequirement);

// Baseline
requirementRouter.post("/:requirementId/baseline", baselineRequirement);

// Comments
requirementRouter.post("/:requirementId/comment", addRequirementComment);

// Traceability
requirementRouter.post("/:requirementId/link-task", linkRequirementToTask);
requirementRouter.post("/:requirementId/link-test-case", linkRequirementToTestCase);
requirementRouter.put("/:requirementId/test-case/:testCaseId", updateTestCaseStatus);
requirementRouter.get("/project/:projectId/traceability-matrix", getTraceabilityMatrix);

// Export/Import routes
requirementRouter.get("/project/:projectId/export", exportRequirements);
requirementRouter.post("/project/:projectId/import", importRequirements);
requirementRouter.get("/template/download", downloadRequirementTemplate);

export default requirementRouter;