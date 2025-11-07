// src\routes\album.routes.ts
import { Router } from "express";
import {
  getAlbums,
  getAlbumById,
  deleteAlbum,
} from "../controllers/album.controller";
import { uploadAlbum } from "../controllers/album/album.controller";

const router = Router();

router.post("/", uploadAlbum);
router.get("/", getAlbums);
router.get("/:id", getAlbumById);
router.delete("/:id", deleteAlbum);

export default router;
