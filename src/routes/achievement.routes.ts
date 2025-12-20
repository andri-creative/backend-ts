// src\routes\achievement.routes.ts
import { Router } from "express";
import {
  getAllAchievement,
  getAchievementById,
} from "../controllers/achievement.controller";
// import { upload } from "../utils/gridfs";
import multer from "multer";
import multerUpload from "../middlewares/upload.middleware";

import {
  uploadPdfToWebp,
  updatePdfToWebp,
  deleteAchievement,
} from "../controllers/achievement/achievement.controller";

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

// router.put("/:id", upload.single("files"), updateAchiement);

// router.put("/:id", upload.single("files"), updateAchievementWithUpload);
// router.post("/", upload.single("files"), createAchievementWithUpload);

router.post("/upload", multerUpload.single("file"), uploadPdfToWebp);
router.put("/:id", upload.single("file"), updatePdfToWebp);
router.delete("/:id", deleteAchievement);
export default router;
