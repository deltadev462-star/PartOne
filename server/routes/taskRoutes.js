import express from "express";
import { 
    createTask, 
    deleteTask, 
    updateTask, 
    updateTaskStatus,
    getProjectTasks,
    getUserTasks,
    getWorkspaceTasks,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addTaskDependency,
    removeTaskDependency,
    getTaskDependencies
} from "../controllers/taskController.js";

const taskRouter = express.Router();

// Task CRUD operations
taskRouter.post("/", createTask);
taskRouter.put("/:id", updateTask);
taskRouter.patch("/:id/status", updateTaskStatus); // For drag and drop
taskRouter.post("/delete", deleteTask);

// Get tasks
taskRouter.get("/project/:projectId", getProjectTasks);
taskRouter.get("/my-tasks", getUserTasks);
taskRouter.get("/workspace/:workspaceId", getWorkspaceTasks);

// Subtask operations
taskRouter.post("/:taskId/subtasks", addSubtask);
taskRouter.put("/subtasks/:subtaskId", updateSubtask);
taskRouter.delete("/subtasks/:subtaskId", deleteSubtask);

// Task dependency operations
taskRouter.post("/:taskId/dependencies", addTaskDependency);
taskRouter.delete("/:taskId/dependencies/:dependencyId", removeTaskDependency);
taskRouter.get("/:taskId/dependencies", getTaskDependencies);

export default taskRouter;
