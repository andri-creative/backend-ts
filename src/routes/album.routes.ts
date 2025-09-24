// src\routes\album.routes.ts
import { Router } from "express";
import {
  uploadAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
} from "../controllers/album.controller";
const router = Router();

router.post("/", uploadAlbum);
router.get("/", getAlbums);
router.get("/:id", getAlbumById);
router.delete("/:id", deleteAlbum);

export default router;
