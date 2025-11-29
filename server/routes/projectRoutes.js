import express from "express";
import {
    addMember,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    exportProjects,
    importProjects,
    downloadProjectTemplate
} from "../controllers/projectController.js";

const projectRouter = express.Router();

projectRouter.post("/", createProject);
projectRouter.put("/", updateProject);
projectRouter.post("/:projectId/addMember", addMember);
projectRouter.patch("/:projectId/archive", archiveProject);
projectRouter.patch("/:projectId/restore", restoreProject);

// Export/Import routes
projectRouter.get("/workspace/:workspaceId/export", exportProjects);
projectRouter.post("/workspace/:workspaceId/import", importProjects);
projectRouter.get("/template/download", downloadProjectTemplate);

export default projectRouter;
