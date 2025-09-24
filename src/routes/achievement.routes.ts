// src\routes\achievement.routes.ts
import { Router } from "express";
import {
  getAllAchievement,
  getAchievementById,
  createAchiement,
  updateAchiement,
  deleteAchiement,
} from "../controllers/achievement.controller";
import { upload } from "../utils/gridfs";

const router = Router();

router.get("/", getAllAchievement);
router.get("/:id", getAchievementById);

router.post("/", upload.single("src"), createAchiement);

router.put("/:id", upload.single("src"), updateAchiement);

router.delete("/:id", deleteAchiement);

export default router;
