// src\routes\achievement.routes.ts
import { Router } from "express";
import {
  getAllAchievement,
  getAchievementById,
  // createAchievement,
  updateAchiement,
  deleteAchiement,
} from "../controllers/achievement.controller";
// import { upload } from "../utils/gridfs";
import multer from "multer";

// import { createAchievement } from "../controllers/achievement/achievement.controller";
import { createAchievementWithUpload } from "../controllers/achievement/text";

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // UBAH JADI 10MB (biar aman)
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format tidak didukung"));
    }
  },
});

const router = Router();

router.get("/", getAllAchievement);
router.get("/:id", getAchievementById);

// router.post("/", upload.single("files"), createAchievement);

router.put("/:id", upload.single("files"), updateAchiement);

router.delete("/:id", deleteAchiement);

router.post(
  "/",
  upload.single("file"),
  createAchievementWithUpload
);

export default router;
