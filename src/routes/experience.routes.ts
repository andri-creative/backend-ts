// src\routes\experience.routes.ts
import { Router } from "express";
import {
  getAllExperience,
  getExperienceById,
  createExperience,
  updateExperience,
  deleteExperience,
  getFile,
} from "../controllers/experience.controller";
import { upload } from "../utils/gridfs";

const router = Router();

// Upload logo -> multer memory storage
router.post("/experience", upload.single("companyLogo"), createExperience);

router.get("/experience", getAllExperience);
router.get("/experience/:id", getExperienceById);

// endpoint untuk file GridFS
router.get("/file/:filename", getFile);

// Update
router.put("/experience/:id", upload.single("companyLogo"), updateExperience);

// Delete
router.delete("/experience/:id", deleteExperience);

export default router;
