// src\routes\userTeam.routes.ts
import { Router } from "express";
import {
  getUserTeams,
  getUserTeam,
  createUserTeam,
  updateUserTeam,
  deleteUserTeam,
  registerUserTeam,
  loginUserTeam,
  logoutUserTeam,
  getUserTeamWithEducation,
  getUserTeamFull,
  getAllUserTeamsFull,
} from "../controllers/userTeam.controller";

const router = Router();
import { authMiddlewareTeam } from "../middlewares/authMiddlewareTeam";

router.post("/register", registerUserTeam);
router.post("/login", loginUserTeam);
router.post("/logout", authMiddlewareTeam, logoutUserTeam);

router.get("/:id/with-education", getUserTeamWithEducation);
router.get("/:id/full", getUserTeamFull);
router.get("/all", getAllUserTeamsFull);

router.get("/", getUserTeams);
router.get("/:id", getUserTeam);
router.post("/", createUserTeam);
router.put("/:id", updateUserTeam);
router.delete("/:id", deleteUserTeam);

export default router;
