// src/controllers/achievement.controller.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

import {
  uploadToCloudinary,
  downloadFromCloudinary,
  deleteFromCloudinary,
} from "../../services/achievement.cloudinary.service";
import {
  uploadToGridFS,
  deleteFromGridFS,
} from "../../services/achevement.gridfs.service";
import { saveAchievementToDB } from "../../services/achevementprisma.service";

export const createAchievementWithUpload = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      issuer,
      label,
      issueDate,
      description,
      category,
      level,
      tags,
    } = req.body;

    const file = req.file;
    if (!file) return res.status(400).json({ error: "File tidak ditemukan" });

    let quality = 85;
    let webpUrl = "";
    let publicId = "";
    let webpBuffer: Buffer = Buffer.alloc(0);

    for (let i = 0; i < 4; i++) {
      const uploadResult = await uploadToCloudinary(file.buffer, quality);
      webpUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;

      const buffer = await downloadFromCloudinary(webpUrl);
      const sizeKB = Math.round(buffer.length / 1024);

      if (sizeKB <= 1024 || quality < 70) {
        webpBuffer = buffer;
        console.log(`✅ Ukuran final: ${sizeKB}KB (q=${quality})`);
        break;
      }

      console.log(`⚙️ Masih ${sizeKB}KB, turunkan kualitas ke ${quality - 10}`);
      quality -= 10;
      webpBuffer = buffer;
    }

    // 🔥 PERUBAHAN DI SINI - Format timestamp: detikmenitjamtanggalbulantahun
    const now = new Date();
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();

    // const filename = `${Date.now()}-${file.originalname.split(".")[0]}.webp`;
    // const gridfsUrl = await uploadToGridFS(req, webpBuffer, filename);

    const timestamp = `${seconds}${minutes}${hours}${date}${month}${year}`;
    const filename = `${timestamp}.webp`;

    const gridfsUrl = await uploadToGridFS(req, webpBuffer, filename);

    const achievement = await saveAchievementToDB({
      title,
      issuer,
      label,
      issueDate,
      description,
      category,
      level,
      tags,
      src: gridfsUrl,
      pinned: false,
    });

    await deleteFromCloudinary(publicId);

    res.status(201).json({
      message: "✅ Upload sukses, simpan ke Prisma & GridFS, hapus Cloudinary",
      size: `${Math.round(webpBuffer.length / 1024)}KB`,
      data: achievement,
    });
  } catch (error: any) {
    console.error("❌ Error createAchievementWithUpload:", error);
    res.status(500).json({
      message: "Gagal upload atau simpan data ❌",
      error: error.message,
    });
  }
};

// 🔁 UPDATE ACHIEVEMENT DENGAN FILE OPSIONAL
export const updateAchievementWithUpload = async (
  req: Request,
  res: Response
) => {
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
      tags,
      pinned,
    } = req.body;

    const file = req.file;
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    let updatedSrc = existing.src;

    // 🖼️ Jika ada file baru → proses ulang
    if (file) {
      console.log("📸 File baru ditemukan, mulai proses upload...");
      let quality = 85;
      let webpUrl = "";
      let publicId = "";
      let webpBuffer: Buffer = Buffer.alloc(0);

      for (let i = 0; i < 4; i++) {
        const uploadResult = await uploadToCloudinary(file.buffer, quality);
        webpUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;

        const buffer = await downloadFromCloudinary(webpUrl);
        const sizeKB = Math.round(buffer.length / 1024);

        if (sizeKB <= 1024 || quality < 70) {
          webpBuffer = buffer;
          console.log(`✅ Ukuran final: ${sizeKB}KB (q=${quality})`);
          break;
        }

        console.log(
          `⚙️ Masih ${sizeKB}KB, turunkan kualitas ke ${quality - 10}`
        );
        quality -= 10;
        webpBuffer = buffer;
      }

      // 🔥 PERUBAHAN DI SINI - Format timestamp: detikmenitjamtanggalbulantahun
      const now = new Date();
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const hours = now.getHours().toString().padStart(2, "0");
      const date = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear();

      const timestamp = `${seconds}${minutes}${hours}${date}${month}${year}`;
      const filename = `${timestamp}.webp`;

      updatedSrc = await uploadToGridFS(req, webpBuffer, filename);

      await deleteFromCloudinary(publicId);

      // 🧹 Hapus file lama GridFS
      const oldFilename = existing.src?.split("/api/file/")[1];
      if (oldFilename) await deleteFromGridFS(oldFilename);
    }

    // 🧾 Update data di Prisma
    const updated = await prisma.achievement.update({
      where: { id },
      data: {
        title,
        issuer,
        label,
        issueDate,
        description,
        category,
        level,
        pinned,
        tags: typeof tags === "string" ? JSON.parse(tags) : tags,
        src: updatedSrc,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      message: "✅ Data Achievement berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    console.error("❌ Error updateAchievementWithUpload:", error);
    res.status(500).json({
      message: "Gagal memperbarui data Achievement ❌",
      error: error.message,
    });
  }
};

//
