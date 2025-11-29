import express from "express";
import { 
    getUserWorkspaces, 
    getWorkspaceById, 
    getWorkspaceProjects 
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.get("/:workspaceId", getWorkspaceById);
workspaceRouter.get("/:workspaceId/projects", getWorkspaceProjects);

export default workspaceRouter;
