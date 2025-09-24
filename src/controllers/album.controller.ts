// src\controllers\album.controller.ts
import { Request, Response } from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary";
import prisma from "../utils/prisma";

// pakai memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// helper upload ke cloudinary
function uploadToCloudinary(fileBuffer: Buffer, publicId: string) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "my_album",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

// ✅ CREATE / UPLOAD
export const uploadAlbum = [
  upload.array("files", 10), // bisa upload 1–10 file
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

          // upload ke cloudinary
          const result: any = await uploadToCloudinary(file.buffer, baseName);

          // rename file biar ada widthxheight di nama
          const publicIdWithSize = `${baseName}.${result.width}x${result.height}`;
          const finalResult = await cloudinary.uploader.rename(
            result.public_id,
            `my_album/${publicIdWithSize}`
          );

          // simpan ke DB
          return prisma.myAlbum.create({
            data: {
              title: `${originalName}.${finalResult.width}x${finalResult.height}`,
              url: finalResult.secure_url,
              width: finalResult.width,
              height: finalResult.height,
              publicId: finalResult.public_id, // <--- penting untuk delete nanti
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

// ✅ GET semua album
export const getAlbums = async (req: Request, res: Response) => {
  try {
    const albums = await prisma.myAlbum.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(albums);
  } catch (err: any) {
    console.error("Get albums error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET album by ID
export const getAlbumById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const album = await prisma.myAlbum.findUnique({ where: { id } });

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, data: album });
  } catch (err: any) {
    console.error("Get album by ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE album
export const deleteAlbum = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const album = await prisma.myAlbum.findUnique({ where: { id } });
    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    // hapus di cloudinary pakai publicId
    await cloudinary.uploader.destroy(album.publicId);

    // hapus di DB
    await prisma.myAlbum.delete({ where: { id } });

    res.json({ success: true, message: "Album deleted successfully" });
  } catch (err: any) {
    console.error("Delete album error:", err);
    res.status(500).json({ error: err.message });
  }
};
