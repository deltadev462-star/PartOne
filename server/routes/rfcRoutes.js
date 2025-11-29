import express from "express";
import { 
    createRFC, 
    getProjectRFCs, 
    getRFC, 
    updateRFC, 
    updateRFCStatus,
    deleteRFC,
    addRFCComment,
    getRFCImpactAnalysis
} from "../controllers/rfcController.js";

const rfcRouter = express.Router();

// RFC CRUD
rfcRouter.post("/", createRFC);
rfcRouter.get("/project/:projectId", getProjectRFCs);
rfcRouter.get("/:rfcId", getRFC);
rfcRouter.put("/:rfcId", updateRFC);
rfcRouter.patch("/:rfcId/status", updateRFCStatus);
rfcRouter.delete("/:rfcId", deleteRFC);

// Comments
rfcRouter.post("/:rfcId/comment", addRFCComment);

// Impact Analysis
rfcRouter.get("/:rfcId/impact-analysis", getRFCImpactAnalysis);

export default rfcRouter;