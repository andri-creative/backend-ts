import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import axios from "axios";
import uploadToDropbox from "../../utils/dropbox/upload";
import getShareableLink from "../../utils/dropbox/shareable";
import toDirectUrl from "../../utils/dropbox/url";
import deleteFromDropbox from "../../utils/dropbox/delete";

export const uploadPdfToWebp = async (req: Request, res: Response) => {
  let cloudPublicId = "";

  try {
    // 0️⃣ Validasi file
    if (!req.file) {
      return res.status(400).json({ error: "PDF tidak ditemukan" });
    }

    const file = req.file as Express.Multer.File;

    // 1️⃣ Upload PDF → Cloudinary (auto convert ke webp)
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          format: "webp",
          quality: 80,
          folder: "achievement_pdf",
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(file.buffer);
    });

    cloudPublicId = result.public_id;

    // 2️⃣ Ambil file WEBP dari cloudinary → buffer
    const buffer = await axios
      .get(result.secure_url, { responseType: "arraybuffer" })
      .then((r) => Buffer.from(r.data));

    const filename = `achievement_${Date.now()}.webp`;

    // 3️⃣ Upload ke Dropbox
    const dropRes = await uploadToDropbox(buffer, filename);

    // FIX: path_display bisa undefined
    const dropboxPath = dropRes.path_display ?? dropRes.path_lower;

    // FIX: kalau undefined → langsung error
    if (!dropboxPath) {
      return res.status(500).json({
        error: "Dropbox path tidak ditemukan",
      });
    }

    // 4️⃣ Buat direct link (raw)
    const shareable = await getShareableLink(dropboxPath);
    const link = toDirectUrl(shareable);

    // 5️⃣ Hapus cloudinary
    await cloudinary.uploader.destroy(cloudPublicId);

    let tags: string[] = [];
    if (typeof req.body.tags === "string") {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (e) {
        tags = [];
      }
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    // 6️⃣ Simpan ke database (sesuai schema)
    const saved = await prisma.achievement.create({
      data: {
        title: req.body.title,
        issuer: req.body.issuer,
        label: req.body.label,
        issueDate: req.body.issueDate,
        description: req.body.description,
        category: req.body.category,
        level: req.body.level,
        tags: tags,

        src: link,
        dropboxPath: dropboxPath,
        dropboxId: dropRes.id,

        uploadStatus: "completed", // FIX ENUM
      },
    });

    return res.json({
      success: true,
      url: link,
      data: saved,
    });
  } catch (err) {
    console.error(err);

    // Cleanup cloudinary jika error
    if (cloudPublicId) {
      await cloudinary.uploader.destroy(cloudPublicId);
    }

    return res.status(500).json({ error: "Upload gagal", detail: err });
  }
};

export const updateAchievement = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    let tags: string[] = [];

    if (typeof req.body.tags === "string") {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (e) {
        tags = [];
      }
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: {
        title: req.body.title,
        issuer: req.body.issuer,
        label: req.body.label,
        issueDate: req.body.issueDate,
        description: req.body.description,
        category: req.body.category,
        level: req.body.level,
        tags: tags,
        pinned: req.body.pinned === "true",
        status: req.body.status === "true",
      },
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Update gagal", detail: err });
  }
};

export const updatePdfToWebp = async (req: Request, res: Response) => {
  let cloudPublicId = "";

  try {
    const id = req.params.id;

    // ambil data lama
    const oldData = await prisma.achievement.findUnique({ where: { id } });

    if (!oldData)
      return res.status(404).json({ error: "Data tidak ditemukan" });

    // jika tidak kirim file → hanya update text
    if (!req.file) {
      return updateAchievement(req, res);
    }

    const file = req.file as Express.Multer.File;

    // upload cloudinary → webp
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          format: "webp",
          quality: 80,
          folder: "achievement_pdf",
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(file.buffer);
    });

    cloudPublicId = result.public_id;

    // download webp → buffer
    const buffer = await axios
      .get(result.secure_url, { responseType: "arraybuffer" })
      .then((r) => Buffer.from(r.data));

    const filename = `achievement_${Date.now()}.webp`;

    // upload ke dropbox
    const dropRes = await uploadToDropbox(buffer, filename);

    const dropboxPath = dropRes.path_display ?? dropRes.path_lower;
    if (!dropboxPath) throw new Error("Dropbox path tidak ditemukan");

    const link = toDirectUrl(await getShareableLink(dropboxPath));

    // Hapus cloudinary temp
    await cloudinary.uploader.destroy(cloudPublicId);

    // ------------------------------------
    // 🔥 DELETE FILE LAMA dari Dropbox
    // ------------------------------------
    if (oldData.dropboxPath) {
      try {
        await deleteFromDropbox(oldData.dropboxPath);
      } catch (e) {
        console.error("Gagal delete file lama:", e);
      }
    }

    // parsing tags
    let tags: string[] = [];
    if (typeof req.body.tags === "string") tags = JSON.parse(req.body.tags);

    // update DB
    const updated = await prisma.achievement.update({
      where: { id },
      data: {
        title: req.body.title,
        issuer: req.body.issuer,
        label: req.body.label,
        issueDate: req.body.issueDate,
        description: req.body.description,
        category: req.body.category,
        level: req.body.level,
        tags: tags,
        src: link,
        dropboxPath,
        dropboxId: dropRes.id,
        uploadStatus: "completed",
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    if (cloudPublicId) await cloudinary.uploader.destroy(cloudPublicId);
    return res.status(500).json({ error: "Update gagal", detail: err });
  }
};

// =====================================================================
// DELETE ACHIEVEMENT + FILE DI DROPBOX
// =====================================================================
export const deleteAchievement = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const data = await prisma.achievement.findUnique({ where: { id } });
    if (!data) return res.status(404).json({ error: "Data tidak ditemukan" });

    // Hapus file di Dropbox jika ada
    if (data.dropboxPath) {
      try {
        await deleteFromDropbox(data.dropboxPath);
      } catch (e) {
        console.error("Gagal delete file Dropbox:", e);
      }
    }

    // Hapus record DB
    await prisma.achievement.delete({ where: { id } });

    res.json({ message: "Berhasil delete", id });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Gagal delete", detail: err });
  }
};
