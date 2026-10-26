import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { startElectionJobs } from "./jobs/electionCloser.js";

// Route imports
import authRoutes from "./modules/auth/routes.js";
import eventRoutes from "./modules/events/routes.js";
import scheduleRoutes from "./modules/schedule/routes.js";
import electionRoutes from "./modules/elections/routes.js";
import designRoutes from "./modules/designs/routes.js";
import commentRoutes from "./modules/comments/routes.js";
import contactRoutes from "./modules/contacts/routes.js";
import taskRoutes from "./modules/tasks/routes.js";
import budgetRoutes from "./modules/budget/routes.js";
import notificationRoutes from "./modules/notifications/routes.js";
import agendaRoutes from "./modules/agenda/routes.js";
import lostFoundRoutes from "./modules/lost-found/routes.js";
import memberRoutes from "./modules/members/routes.js";
import alertRoutes from "./modules/alerts/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Event Management API is running"
  });
});

// Mount all API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/agenda", agendaRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/alerts", alertRoutes);

// Start background jobs
startElectionJobs();

export default app;
