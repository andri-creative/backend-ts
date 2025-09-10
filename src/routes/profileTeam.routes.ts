// src\routes\profileTeam.routes.ts
import { Router } from "express";
import {
  createProfile,
  getMyProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/profileTeam.controller";
import { authMiddlewareTeam } from "../middlewares/authMiddlewareTeam";

const router = Router();

router.post("/profile", authMiddlewareTeam, createProfile); // CREATE
router.get("/profile", authMiddlewareTeam, getMyProfile); // GET profil saya
router.put("/profile", authMiddlewareTeam, updateProfile); // UPDATE profil saya
router.delete("/profile", authMiddlewareTeam, deleteProfile); // DELETE profil saya

export default router;
