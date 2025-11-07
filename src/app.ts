// src\app.ts
import express from "express";
import toolsRoutes from "./routes/tools.routes";
import teamToolsRoutes from "./routes/teamTools.routes";
import experienceRoutes from "./routes/experience.routes";
import achievementRoutes from "./routes/achievement.routes";
import albumRoutes from "./routes/album.routes";
import rantingRouter from "./routes/ranting/ranting.routes";
import authRouter from "./routes/team/auth.routes";
import profileTeam from "./routes/team/profile.routes";
import risetPassRouter from "./routes/team/forgot.password.routes";

// Roles
import RolesRouter from "./routes/roles/roles.routes";

// Team
import userTeamRoutes from "./routes/team/user.team.routes";
// Project
import projectRouter from "./routes/project/project.routes";

import fileRoutes from "./routes/files.routes";

import contactRouter from "./routes/contact.routes";
import dashboardRouter from "./routes/dashboard.routes";
import { initGridFS } from "./utils/gridfs";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  await initGridFS();
})();

// await initGridFS();

app.use("/api/files", fileRoutes);
app.use("/api/user-teams", userTeamRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api", teamToolsRoutes);
app.use("/api", experienceRoutes);
app.use("/api/achievement", achievementRoutes);
app.use("/api/album", albumRoutes);
app.use("/api/ranting", rantingRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileTeam);
app.use("/api/auth", risetPassRouter);
app.use("/api/roles", RolesRouter);
app.use("/api/project", projectRouter);
app.use("/api/contact", contactRouter);

app.use("/api", dashboardRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hello, World! 🚀",
    data: {
      app: "Express + TypeScript + Prisma",
      version: "1.0.0",
    },
  });
});

export default app;
