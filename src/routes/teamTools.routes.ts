// src\routes\teamTools.routes.ts
import { Router } from "express";
import { authMiddlewareTeam } from "../middlewares/authMiddlewareTeam";
import {
  addToolToTeam,
  getMyTools,
  removeToolFromTeam,
} from "../controllers/teamTools.controller";

const router = Router();

router.post("/team/tools", authMiddlewareTeam, addToolToTeam); // Tambah tool ke profil
router.get("/team/tools", authMiddlewareTeam, getMyTools); // Lihat semua tools
router.delete("/team/tools/:id", authMiddlewareTeam, removeToolFromTeam); // Hapus tool

export default router;
