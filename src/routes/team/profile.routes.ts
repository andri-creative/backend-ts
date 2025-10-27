import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware";
import {
  createProfile,
  getAll,
  getMyProfile,
  updateProfile,
  getById,
} from "../../controllers/team/profile/profile.controller";
import { upload } from "../../utils/gridfs";

const router = Router();

router.post("/", authenticateToken, upload.single("foto"), createProfile);
router.get("/me", authenticateToken, getMyProfile);
router.put("/:id", authenticateToken, upload.single("foto"), updateProfile);
router.get("/all-team", getAll);
router.get("/id-team/:id", getById);

export default router;
