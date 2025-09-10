// src\routes\tools.routes.ts
import { Router } from "express";
import {
  createTool,
  deleteTool,
  getAllTools,
  getToolById,
  updateTool,
} from "../controllers/tools.controller";

const router = Router();

router.get("/", getAllTools);
router.get("/:id", getToolById);
router.post("/", createTool);
router.put("/:id", updateTool);
router.delete("/:id", deleteTool);

export default router;
