import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import pricingRouter from "./routes/pricingRoutes.js";
import requirementRouter from "./routes/requirementRoutes.js";
import stakeholderRouter from "./routes/stakeholderRoutes.js";
import rfcRouter from "./routes/rfcRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import riskRouter from "./routes/riskRoutes.js";
import meetingRouter from "./routes/meetingRoutes.js";
import { protect } from './middlewares/authMiddleware.js';
import { clerkMiddleware } from '@clerk/express';
import { inngest, functions } from './inngest/index.js';
import { serve } from "inngest/express";
import { handleStripeWebhook } from './controllers/pricingController.js';

const app = express();

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/pricing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is live!'));

// Webhooks
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/tasks", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/requirements", protect, requirementRouter);
app.use("/api/stakeholders", protect, stakeholderRouter);
app.use("/api/rfcs", protect, rfcRouter);
app.use("/api/risks", protect, riskRouter);
app.use("/api/reports", protect, reportRouter);
app.use("/api", protect, meetingRouter); // Meeting routes directly on /api

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {});