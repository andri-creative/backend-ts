// src\controllers\tools.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import multer from "multer";
import cloudinary from "../utils/cloudinary";

// pakai memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper Cloudenary
function UploadToolsCloudinary(fileBuffer: Buffer, originalName: string) {
  return new Promise<any>((resolve, reject) => {
    const now = new Date();
    const fileName = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}_${originalName}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "Tools",
        resource_type: "image",
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ ...result, fileName });
      }
    );

    stream.end(fileBuffer);
  });
}

export const getAllTools = async (req: Request, res: Response) => {
  try {
    const tools = await getAllToolsData();
    res.json(tools);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil semua tools" });
  }
};

// Retuen data
export const getAllToolsData = async () => {
  return await prisma.tools.findMany();
};

export const getToolById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tool = await prisma.tools.findUnique({
      where: { id },
    });
    if (!tool) {
      return res.status(404).json({ error: "Tool tidak ditemukan" });
    }
    res.json(tool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil tool" });
  }
};

export const createTool = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File gambar wajib diupload" });
    }

    const uploadResult = await UploadToolsCloudinary(
      file.buffer,
      file.originalname
    );

    const tool = await prisma.tools.create({
      data: {
        title,
        image: uploadResult.fileName,
        url: uploadResult.secure_url,
      },
    });

    res.status(201).json({ message: "Tool berhasil dibuat", tool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal membuat tool" });
  }
};

export const updateTool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // cari data lama
    const existingTool = await prisma.tools.findUnique({ where: { id } });
    if (!existingTool) {
      return res.status(404).json({ error: "Tool tidak ditemukan" });
    }

    let newImage = existingTool.image;
    let newUrl = existingTool.url;

    // kalau ada file baru diupload
    if (req.file) {
      // hapus gambar lama dari Cloudinary
      if (existingTool.image) {
        await cloudinary.uploader.destroy(
          `Tools/${existingTool.image.replace(/\.[^/.]+$/, "")}`
        );
      }

      // upload gambar baru
      const result = await UploadToolsCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      newImage = result.fileName;
      newUrl = result.secure_url;
    }

    const tool = await prisma.tools.update({
      where: { id },
      data: {
        title: req.body.title || existingTool.title,
        image: newImage,
        url: newUrl,
      },
    });

    res.status(200).json({ message: "Tool berhasil diupdate", tool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengupdate tool" });
  }
};

export const deleteTool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // cari data dulu
    const existingTool = await prisma.tools.findUnique({ where: { id } });
    if (!existingTool) {
      return res.status(404).json({ error: "Tool tidak ditemukan" });
    }

    // hapus dari Cloudinary kalau ada image
    if (existingTool.image) {
      try {
        const result = await cloudinary.uploader.destroy(
          `Tools/${existingTool.image.replace(/\.[^/.]+$/, "")}`
        );

        if (result.result === "not found") {
          console.warn("Image tidak ditemukan di Cloudinary, lanjut hapus DB");
        }
      } catch (cloudErr) {
        console.warn("Error saat hapus image di Cloudinary:", cloudErr);
      }
    }

    await prisma.profilTeamTools.deleteMany({
      where: { toolsId: id },
    });

    // hapus dari database
    await prisma.tools.delete({ where: { id } });

    res.status(200).json({ message: "Tool berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal menghapus tool" });
  }
};
