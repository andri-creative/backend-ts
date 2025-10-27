// src\routes\achievement.routes.ts
import { Router } from "express";
import {
  getAllAchievement,
  getAchievementById,
  createAchievement,
  updateAchiement,
  deleteAchiement,
} from "../controllers/achievement.controller";
import { upload } from "../utils/gridfs";

const router = Router();

router.get("/", getAllAchievement);
router.get("/:id", getAchievementById);

router.post("/", upload.single("files"), createAchievement);

router.put("/:id", upload.single("files"), updateAchiement);

router.delete("/:id", deleteAchiement);

export default router;
