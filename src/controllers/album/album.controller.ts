import { Request, Response } from "express";
import prisma from "../../utils/prisma";

import {
  uploadToCloudinaryAlbum,
  renameCloudinaryFile,
} from "../../services/album.cludenary.service";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadAlbum = [
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      if (
        !req.files ||
        !(req.files instanceof Array) ||
        req.files.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Minimal 1 gambar harus diupload" });
      }

      const now = new Date();

      const uploads = await Promise.all(
        req.files.map(async (file: Express.Multer.File, index: number) => {
          const originalName = file.originalname.split(".")[0];
          const baseName = `${now.getSeconds()}-${now.getMinutes()}-${now.getHours()}-${now.getDate()}-${
            now.getMonth() + 1
          }-${now.getFullYear()}-${index}`;

          // Upload ke Cloudinary (otomatis WebP)
          const result: any = await uploadToCloudinaryAlbum(
            file.buffer,
            baseName
          );

          // Rename biar ada ukuran
          const finalResult = await renameCloudinaryFile(
            result.public_id,
            result.width,
            result.height
          );

          // Simpan ke DB
          return prisma.myAlbum.create({
            data: {
              title: `${originalName}.${finalResult.width}x${finalResult.height}`,
              url: finalResult.secure_url,
              width: finalResult.width,
              height: finalResult.height,
              publicId: finalResult.public_id,
            },
          });
        })
      );

      res.json({ success: true, count: uploads.length, data: uploads });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  },
];
