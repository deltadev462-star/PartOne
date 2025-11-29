import express from "express";
import {
    createStakeholder,
    getProjectStakeholders,
    getWorkspaceStakeholders,
    updateStakeholder,
    deleteStakeholder,
    createStakeholderHistory,
    getStakeholderHistory,
    getStakeholderMatrix,
    createMeeting,
    getProjectMeetings
} from "../controllers/stakeholderController.js";

const stakeholderRouter = express.Router();

// Stakeholders CRUD
stakeholderRouter.post("/", createStakeholder);
stakeholderRouter.get("/project/:projectId", getProjectStakeholders);
stakeholderRouter.get("/workspace/:workspaceId", getWorkspaceStakeholders);
stakeholderRouter.put("/:stakeholderId", updateStakeholder);
stakeholderRouter.delete("/:stakeholderId", deleteStakeholder);

// Stakeholder History
stakeholderRouter.post("/:stakeholderId/history", createStakeholderHistory);
stakeholderRouter.get("/:stakeholderId/history", getStakeholderHistory);

// Engagement Matrix
stakeholderRouter.get("/workspace/:workspaceId/matrix", getStakeholderMatrix);

// Meetings
stakeholderRouter.post("/meetings", createMeeting);
stakeholderRouter.get("/meetings/project/:projectId", getProjectMeetings);

export default stakeholderRouter;