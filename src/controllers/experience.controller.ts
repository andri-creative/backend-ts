// src\controllers\experience.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getGfs } from "../utils/gridfs";

export const getAllExperience = async (req: Request, res: Response) => {
  try {
    const experience = await prisma.experience.findMany();
    res.json(experience);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengabil semua experience" });
  }
};

export const getExperienceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const experience = await prisma.experience.findUnique({
      where: { id },
    });
    if (!experience) {
      return res.status(400).json({ error: "Gagal mengal experience" });
    }

    res.json(experience);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengabil data by id" });
  }
};

export const createExperience = async (req: Request, res: Response) => {
  try {
    const { title, company, location, period, duration, type, mode } = req.body;

    let companyLogo = req.body.companyLogo || "";

    let responsibilities: string[] = [];
    if (typeof req.body.responsibilities === "string") {
      // jika hanya string tunggal dari form-encoded
      responsibilities = [req.body.responsibilities];
    } else if (Array.isArray(req.body.responsibilities)) {
      responsibilities = req.body.responsibilities;
    }

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
      companyLogo = `${baseUrl}/api/file/${filename}`;
    }

    const experience = await prisma.experience.create({
      data: {
        companyLogo,
        title,
        company,
        location,
        period,
        duration,
        type,
        mode,
        responsibilities,
      },
    });

    res.status(201).json({ message: "Experience berhasil dibuat", experience });
  } catch (err) {
    console.error("❌ Error createExperience:", err);
    res.status(500).json({ error: "Gagal membuat data" });
  }
};

/** UPDATE Experience */
export const updateExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, company, location, period, duration, type, mode } = req.body;

    // Ambil data lama untuk menghapus logo lama jika perlu
    const oldData = await prisma.experience.findUnique({ where: { id } });
    if (!oldData) {
      return res.status(404).json({ error: "Experience tidak ditemukan" });
    }

    // Siapkan responsibilities array
    let responsibilities: string[] = [];
    if (typeof req.body.responsibilities === "string") {
      responsibilities = [req.body.responsibilities];
    } else if (Array.isArray(req.body.responsibilities)) {
      responsibilities = req.body.responsibilities;
    } else {
      responsibilities = oldData.responsibilities; // pakai lama jika tidak ada
    }

    let companyLogo = oldData.companyLogo;

    // Jika upload logo baru
    if (req.file) {
      const gfs = getGfs();

      // Hapus file lama dari GridFS
      if (oldData.companyLogo) {
        const oldFilename = oldData.companyLogo.split("/file/")[1];
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
      companyLogo = `${baseUrl}/api/file/${filename}`;
    }

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        title,
        company,
        location,
        period,
        duration,
        type,
        mode,
        responsibilities,
        companyLogo,
      },
    });

    res.status(200).json({ message: "Experience berhasil diupdate", updated });
  } catch (err) {
    console.error("❌ Error updateExperience:", err);
    res.status(500).json({ error: "Gagal update data" });
  }
};

/** DELETE Experience */
export const deleteExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) {
      return res.status(404).json({ error: "Experience tidak ditemukan" });
    }

    const gfs = getGfs();

    // Hapus file logo dari GridFS
    if (experience.companyLogo) {
      const filename = experience.companyLogo.split("/file/")[1];
      const cursor = await gfs.find({ filename }).toArray();
      if (cursor.length) {
        await gfs.delete(cursor[0]._id);
      }
    }

    // Hapus data dari database
    await prisma.experience.delete({ where: { id } });

    res.status(200).json({ message: "Experience dan logo berhasil dihapus" });
  } catch (err) {
    console.error("❌ Error deleteExperience:", err);
    res.status(500).json({ error: "Gagal menghapus data" });
  }
};

export const getFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const gfs = getGfs();
    const downloadStream = gfs.openDownloadStreamByName(filename);

    downloadStream.on("error", () =>
      res.status(404).json({ error: "File tidak ditemukan" })
    );

    downloadStream.pipe(res);
  } catch (err) {
    console.error("❌ Error getFile:", err);
    res.status(500).json({ error: "Gagal mengambil file" });
  }
};
