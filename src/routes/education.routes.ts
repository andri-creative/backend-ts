// src\routes\education.routes.ts

import { Router } from "express";
import { authMiddlewareTeam } from "../middlewares/authMiddlewareTeam";
import {
  createEducation,
  getMyEducations,
  getEducationById,
  updateEducation,
  deleteEducation,
} from "../controllers/education.controller";

const router = Router();

router.post("/education", authMiddlewareTeam, createEducation); // CREATE
router.get("/education", authMiddlewareTeam, getMyEducations); // READ all
router.get("/education/:id", authMiddlewareTeam, getEducationById); // READ one
router.put("/education/:id", authMiddlewareTeam, updateEducation); // UPDATE
router.delete("/education/:id", authMiddlewareTeam, deleteEducation); // DELETE

export default router;
