// src\routes\tools.routes.ts
import { Router } from "express";
import {
  createTool,
  deleteTool,
  getAllTools,
  getToolById,
  updateTool,
  upload,
} from "../controllers/tools.controller";

const router = Router();

router.get("/", getAllTools);
router.get("/:id", getToolById);
router.post("/", upload.single("files"), createTool);
router.put("/:id", upload.single("files"), updateTool);
router.delete("/:id", deleteTool);

export default router;
