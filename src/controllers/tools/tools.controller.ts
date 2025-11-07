import multer from "multer";
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

import {
  uploadToCloudinaryTools,
  renameCloudinaryFile,
} from "../../services/tools.cloudenary.service";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const createTool = [
  upload.single("file"), // upload 1 file
  async (req: Request, res: Response) => {
    try {
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title wajib diisi" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Gambar wajib diupload" });
      }

      const now = new Date();
      const baseName = `${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(
        2,
        "0"
      )}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}_${Math.floor(
        Math.random() * 100
      )}`;

      // Upload ke Cloudinary
      const result: any = await uploadToCloudinaryTools(
        req.file.buffer,
        baseName
      );

      // Rename biar ada resolusi di nama file
      const finalResult = await renameCloudinaryFile(
        result.public_id,
        result.width,
        result.height
      );

      // Simpan ke database
      const newTool = await prisma.tools.create({
        data: {
          title,
          image: `${baseName}.webp`,
          url: finalResult.secure_url,
        },
      });

      res.json(newTool);
    } catch (error: any) {
      console.error("Create tool error:", error);
      res.status(500).json({ error: error.message });
    }
  },
];
