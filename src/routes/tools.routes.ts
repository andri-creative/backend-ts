// src\routes\tools.routes.ts
import { Router } from "express";
import {
  // createTool,
  deleteTool,
  getAllTools,
  getToolById,
  updateTool,
  upload,
} from "../controllers/tools.controller";

import { createTool } from "../controllers/tools/tools.controller";
const router = Router();

router.get("/", getAllTools);
router.get("/:id", getToolById);
router.post("/", createTool);
router.put("/:id", upload.single("files"), updateTool);
router.delete("/:id", deleteTool);

export default router;
