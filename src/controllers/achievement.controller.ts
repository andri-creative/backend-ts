// src\controllers\achievement.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getGfs } from "../utils/gridfs";

export const getAllAchievement = async (req: Request, res: Response) => {
  try {
    const achievement = await prisma.achievement.findMany();
    res.json(achievement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil suamu achievent" });
  }
};

export const getAchievementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement)
      return res.status(400).json({ error: "Gagal mengambil id achievent" });

    res.json(achievement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengabil data by id" });
  }
};

export const createAchiement = async (req: Request, res: Response) => {
  try {
    const {
      title,
      issuer,
      label,
      issueDate,
      description,
      category,
      level,
      link,
    } = req.body;

    let src = req.body.src || "";

    if (req.file) {
      const gfs = getGfs();
      const filename = `${Date.now()}-${req.file.originalname}`;
      const uploadStream = gfs.openUploadStream(filename);
      uploadStream.end(req.file.buffer);

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", () => resolve());
        uploadStream.on("error", reject);
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      src = `${baseUrl}/api/file/${filename}`;
    }

    let tags: string[] = [];
    if (typeof req.body.tags === "string") {
      tags = [req.body.tags];
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    const achievement = await prisma.achievement.create({
      data: {
        title,
        src,
        issuer,
        label,
        issueDate,
        description,
        category,
        level,
        link,
        tags,
      },
    });

    res.status(200).json({ message: "berhasil dibuat", achievement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal menambhkana dat" });
  }
};

/** UPDATE */
export const updateAchiement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      issuer,
      label,
      issueDate,
      description,
      category,
      level,
      link,
    } = req.body;

    const oldData = await prisma.achievement.findUnique({ where: { id } });
    if (!oldData) {
      return res.status(404).json({ error: "Achievement tidak ditemukan" });
    }

    let tags: string[] = [];
    if (typeof req.body.tags === "string") {
      tags = [req.body.tags];
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    let src = oldData.src;

    // Jika upload logo baru
    if (req.file) {
      const gfs = getGfs();

      // Hapus file lama dari GridFS
      if (oldData.src) {
        const oldFilename = oldData.src.split("/file/")[1];
        const cursor = await gfs.find({ filename: oldFilename }).toArray();
        if (cursor.length) {
          await gfs.delete(cursor[0]._id);
        }
      }

      // Upload file baru
      const filename = `${Date.now()}-${req.file.originalname}`;
      const uploadStream = gfs.openUploadStream(filename);
      uploadStream.end(req.file.buffer);

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", () => resolve());
        uploadStream.on("error", reject);
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      src = `${baseUrl}/api/file/${filename}`;
    }

    const achiement = await prisma.achievement.update({
      where: { id },
      data: {
        title,
        src,
        issuer,
        label,
        issueDate,
        description,
        category,
        level,
        link,
        tags,
      },
    });
    res.status(200).json({ message: "Achiement berhasil diupdate", achiement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal Update data achiement" });
  }
};

export const deleteAchiement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const achievement = await prisma.achievement.findUnique({ where: { id } });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement tidak ditemukan" });
    }

    const gfs = getGfs();

    if (achievement.src) {
      const filename = achievement.src.split("/file/")[1];
      const cursor = await gfs.find({ filename }).toArray();
      if (cursor.length) {
        await gfs.delete(cursor[0]._id);
      }
    }

    await prisma.achievement.delete({ where: { id } });
    res.status(200).json({ message: "Menghapus data" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal delete data achimenet" });
  }
};
