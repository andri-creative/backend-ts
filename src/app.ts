// src\app.ts
import express from "express";
import userTeamRoutes from "./routes/userTeam.routes";
import profileTeamRoutes from "./routes/profileTeam.routes";
import toolsRoutes from "./routes/tools.routes";
import educationRoutes from "./routes/education.routes";
import teamToolsRoutes from "./routes/teamTools.routes";
import experienceRoutes from "./routes/experience.routes";
import achievementRoutes from "./routes/achievement.routes";
import albumRoutes from "./routes/album.routes";

import { initGridFS } from "./utils/gridfs";
import cors from "cors";

const app = express();
app.use(cors());

app.use(express.json());

(async () => {
  await initGridFS();
})();

app.use("/api/user-teams", userTeamRoutes);
app.use("/api/profile-teams", profileTeamRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api", educationRoutes);
app.use("/api", teamToolsRoutes);
app.use("/api", experienceRoutes);
app.use("/api/achievement", achievementRoutes);
app.use("/api/album", albumRoutes);

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
