import { Router } from "express";
import {
  createRanting,
  getRantingStats,
  getAllRantings,
  getStats,
  deleteRanting,
} from "../../controllers/ranting.controller";

const rantingRouter = Router();

// rantingRouter.get("/stats", getRantingStats);
rantingRouter.post("/", createRanting);
rantingRouter.get("/", getAllRantings);
rantingRouter.delete("/:id", deleteRanting);
rantingRouter.get("/stats", getStats);

export default rantingRouter;
