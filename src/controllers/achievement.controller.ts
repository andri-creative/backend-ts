// src\controllers\achievement.controller.ts
import sharp from "sharp";
import { fromPath } from "pdf2pic";
import path from "path";
import os from "os";
import fs from "fs";
import { Readable } from "stream";
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getGfs } from "../utils/gridfs";
import cloudinary from "../utils/cloudinary";

import {
  UploadToolsCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryHelper";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

async function processFileToCloudinaryThenGridFS(
  achievementId: string,
  file: MulterFile,
  req: Request
) {
  let cloudinaryPublicId: string | null = null;

  try {
    console.log(`🔄 Mulai proses file untuk achievement ${achievementId}`);
    console.log(`📄 File type: ${file.mimetype}`);

    // Tentukan apakah file PDF
    const isPdf = file.mimetype === "application/pdf";

    // Upload ke Cloudinary untuk processing
    const uploadResult = await UploadToolsCloudinary(
      file.buffer,
      file.originalname,
      isPdf
    );
    cloudinaryPublicId = uploadResult.public_id;

    console.log(
      `✅ File berhasil diproses di Cloudinary: ${uploadResult.secure_url}`
    );
    console.log(`📊 Resource type: ${uploadResult.resource_type}`);

    // ---------- DOWNLOAD DARI CLOUDINARY ----------
    console.log(`⬇️ Download dari Cloudinary...`);

    let downloadUrl = uploadResult.secure_url;

    if (isPdf && cloudinaryPublicId) {
      // Generate signed URL untuk PDF yang di-transform menjadi PNG
      downloadUrl = cloudinary.url(cloudinaryPublicId, {
        resource_type: "image",
        format: "png",
        page: 1,
        width: 800,
        height: 1000,
        crop: "limit",
        sign_url: true, // <- ini penting supaya fetch tidak 401
      });
      console.log(`🔗 Signed URL generated for PDF: ${downloadUrl}`);
    }

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download from Cloudinary: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");
    console.log(`📦 Content-Type: ${contentType}`);

    const arrayBuffer = await response.arrayBuffer();
    const cloudinaryBuffer = Buffer.from(arrayBuffer);
    console.log(`📊 Buffer size: ${cloudinaryBuffer.length} bytes`);

    // ---------- UPLOAD KE GRIDFS ----------
    console.log(`📦 Upload ke GridFS...`);
    const gfs = getGfs();

    if (!gfs) {
      throw new Error("GridFS is not available");
    }

    const filename = `${achievementId}-${Date.now()}.jpg`;
    const uploadStream = gfs.openUploadStream(filename);

    uploadStream.end(cloudinaryBuffer);
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const gridfsSrc = `${baseUrl}/api/file/${filename}`;

    // ---------- HAPUS DARI CLOUDINARY ----------
    console.log(`🗑️ Menghapus dari Cloudinary...`);
    if (cloudinaryPublicId) {
      await deleteFromCloudinary(cloudinaryPublicId);
    }

    // ---------- UPDATE DATABASE ----------
    await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        src: gridfsSrc,
        uploadStatus: "completed",
      },
    });

    console.log(`✅ Proses selesai untuk achievement ${achievementId}`);
  } catch (error) {
    console.error(`❌ Error processing file:`, error);

    // Cleanup jika error
    if (cloudinaryPublicId) {
      await deleteFromCloudinary(cloudinaryPublicId).catch((cleanupError) =>
        console.warn("Gagal cleanup Cloudinary:", cleanupError)
      );
    }

    await prisma.achievement.update({
      where: { id: achievementId },
      data: { uploadStatus: "failed" },
    });
  }
}

export const createAchievement = async (req: Request, res: Response) => {
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

    // ---------- VALIDASI INPUT WAJIB ----------
    if (!title || !issuer) {
      return res.status(400).json({
        error: "Title dan issuer adalah field yang wajib diisi",
      });
    }

    // ---------- VALIDASI & CONVERT ENUM VALUES ----------
    // Validasi dan convert category
    const validCategories = ["sertifikat", "penghargaan", "lainnya"];
    const processedCategory = category?.trim().toLowerCase() || "";

    if (category && !validCategories.includes(processedCategory)) {
      return res.status(400).json({
        error: `Kategori tidak valid. Pilih dari: ${validCategories.join(
          ", "
        )}`,
      });
    }

    // Validasi dan convert level
    const validLevels = ["beginner", "intermediate", "advanced"];
    const processedLevel = level?.trim().toLowerCase() || "";

    if (level && !validLevels.includes(processedLevel)) {
      return res.status(400).json({
        error: `Level tidak valid. Pilih dari: ${validLevels.join(", ")}`,
      });
    }

    // ---------- HANDLE TAGS ----------
    let tags: string[] = [];
    if (typeof req.body.tags === "string") {
      tags = [req.body.tags];
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    // ---------- VALIDASI FILE ----------
    if (req.file) {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error:
            "Format file tidak didukung. Hanya JPEG, PNG, JPG, dan PDF yang diizinkan",
        });
      }

      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({
          error: "Ukuran file terlalu besar. Maksimal 5MB",
        });
      }
    }

    // ---------- SIMPAN KE DB DULU (TANPA FOTO) ----------
    const achievement = await prisma.achievement.create({
      data: {
        title: title.trim(),
        src: "",
        issuer: issuer.trim(),
        label: label?.trim() || "",
        issueDate: issueDate || "",
        description: description?.trim() || "",
        category: processedCategory as any, // Gunakan enum value yang sudah divalidasi
        level: processedLevel as any, // Gunakan enum value yang sudah divalidasi

        tags,
        uploadStatus: req.file ? "pending" : "no_file",
      },
    });

    // ---------- RESPONSE LANGSUNG KE USER ----------
    res.status(201).json({
      success: true,
      message: req.file
        ? "Achievement berhasil dibuat! File sedang diproses di background..."
        : "Achievement berhasil dibuat!",
      data: {
        id: achievement.id,
        title: achievement.title,
        issuer: achievement.issuer,
        uploadStatus: achievement.uploadStatus,
        createdAt: achievement.createdAt,
      },
    });

    // ---------- PROSES FILE DI BACKGROUND ----------
    if (req.file) {
      processFileToCloudinaryThenGridFS(achievement.id, req.file, req)
        .then(() => {
          console.log(
            `✅ Background processing completed for achievement ${achievement.id}`
          );
        })
        .catch((error) => {
          console.error(
            `❌ Background processing failed for achievement ${achievement.id}:`,
            error
          );
        });
    }
  } catch (error) {
    console.error("❌ Error createAchievement:", error);

    // Handle Prisma error
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return res.status(400).json({
          error: "Achievement dengan data yang sama sudah ada",
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan server. Gagal menambahkan achievement",
    });
  }
};

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

// ========================================
// FUNGSI UTAMA - USER DAPAT RESPONSE CEPAT
// ========================================

// ========================================
// FUNGSI BACKGROUND - PROSES FILE LAMBAT
// ========================================

async function processUpdateFile(
  achievementId: string,
  file: MulterFile,
  req: Request,
  oldFileSrc: string
) {
  let cloudinaryPublicId: string | null = null;

  try {
    console.log(
      `🔄 Mulai proses file UPDATE untuk achievement ${achievementId}`
    );

    // ---------- HAPUS FILE LAMA DARI GRIDFS ----------
    if (oldFileSrc) {
      console.log(`🗑️ Menghapus file lama dari GridFS...`);
      const gfs = getGfs();
      const oldFilename = oldFileSrc.split("/file/")[1];

      if (oldFilename && gfs) {
        const cursor = await gfs.find({ filename: oldFilename }).toArray();
        if (cursor.length > 0) {
          await gfs.delete(cursor[0]._id);
          console.log(`✅ File lama berhasil dihapus: ${oldFilename}`);
        }
      }
    }

    // ---------- UPLOAD KE CLOUDINARY UNTUK PROCESSING ----------
    console.log(`☁️ Upload file baru ke Cloudinary...`);
    const uploadResult = await UploadToolsCloudinary(
      file.buffer,
      file.originalname
    );
    cloudinaryPublicId = uploadResult.public_id;

    console.log(
      `✅ File berhasil diproses di Cloudinary: ${uploadResult.secure_url}`
    );

    // ---------- DOWNLOAD DARI CLOUDINARY ----------
    console.log(`⬇️ Download dari Cloudinary...`);
    const response = await fetch(uploadResult.secure_url);

    if (!response.ok) {
      throw new Error(
        `Failed to download from Cloudinary: ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const cloudinaryBuffer = Buffer.from(arrayBuffer);

    // ---------- UPLOAD KE GRIDFS ----------
    console.log(`📦 Upload ke GridFS...`);
    const gfs = getGfs();

    if (!gfs) {
      throw new Error("GridFS is not available");
    }

    const filename = `${achievementId}-${Date.now()}.jpg`;
    const uploadStream = gfs.openUploadStream(filename);

    uploadStream.end(cloudinaryBuffer);
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const gridfsSrc = `${baseUrl}/api/file/${filename}`;

    // ---------- HAPUS DARI CLOUDINARY ----------
    console.log(`🗑️ Menghapus dari Cloudinary...`);
    if (cloudinaryPublicId) {
      await deleteFromCloudinary(cloudinaryPublicId);
    }

    // ---------- UPDATE DATABASE DENGAN FILE BARU ----------
    await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        src: gridfsSrc,
        uploadStatus: "completed",
      },
    });

    console.log(
      `✅ Proses update file selesai untuk achievement ${achievementId}`
    );
  } catch (error) {
    console.error(`❌ Error processing update file:`, error);

    // Cleanup jika error
    if (cloudinaryPublicId) {
      await deleteFromCloudinary(cloudinaryPublicId).catch((cleanupError) =>
        console.warn("Gagal cleanup Cloudinary:", cleanupError)
      );
    }

    // Update status jadi failed
    await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        uploadStatus: "failed",
        src: oldFileSrc, // Kembalikan ke file lama
      },
    });
  }
}

/** UPDATE ACHIEVEMENT */
export const updateAchiement = async (req: Request, res: Response) => {
  let cloudinaryPublicId: string | null = null;

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

    // Cari data lama
    const oldData = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!oldData) {
      return res.status(404).json({
        success: false,
        error: "Achievement tidak ditemukan",
      });
    }

    // ---------- HANDLE TAGS ----------
    let tags: string[] = oldData.tags;
    if (typeof req.body.tags === "string") {
      tags = [req.body.tags];
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    // ---------- VALIDASI FILE BARU ----------
    if (req.file) {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error:
            "Format file tidak didukung. Hanya JPEG, PNG, JPG, dan PDF yang diizinkan",
        });
      }

      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: "Ukuran file terlalu besar. Maksimal 5MB",
        });
      }
    }

    let uploadStatus = oldData.uploadStatus;

    // ---------- JIKA ADA FILE BARU, PROSES DI BACKGROUND ----------
    if (req.file) {
      // Update status jadi pending dulu
      uploadStatus = "pending";

      // Response cepat ke user
      const updatedAchievement = await prisma.achievement.update({
        where: { id },
        data: {
          title: title?.trim() || oldData.title,
          issuer: issuer?.trim() || oldData.issuer,
          label: label?.trim() || oldData.label,
          issueDate: issueDate || oldData.issueDate,
          description: description?.trim() || oldData.description,
          category: category ? (category as any) : oldData.category, // Biarkan Prisma handle validation
          level: level ? (level as any) : oldData.level, // Biarkan Prisma handle validation
          tags,
          uploadStatus: "pending" as any,
        },
      });

      res.status(200).json({
        success: true,
        message: "Achievement berhasil diupdate! File sedang diproses...",
        data: updatedAchievement,
      });

      // Proses file di background
      processUpdateFile(id, req.file, req, oldData.src)
        .then(() => {
          console.log(
            `✅ Background file processing completed for achievement ${id}`
          );
        })
        .catch((error) => {
          console.error(
            `❌ Background file processing failed for achievement ${id}:`,
            error
          );
        });

      return; // Keluar dari function setelah kirim response
    } else {
      // ---------- JIKA TIDAK ADA FILE BARU, UPDATE LANGSUNG ----------
      const updatedAchievement = await prisma.achievement.update({
        where: { id },
        data: {
          title: title?.trim() || oldData.title,
          issuer: issuer?.trim() || oldData.issuer,
          label: label?.trim() || oldData.label,
          issueDate: issueDate || oldData.issueDate,
          description: description?.trim() || oldData.description,
          category: category ? (category as any) : oldData.category,
          level: level ? (level as any) : oldData.level,
          tags,
          uploadStatus: oldData.uploadStatus,
        },
      });

      res.status(200).json({
        success: true,
        message: "Achievement berhasil diupdate",
        data: updatedAchievement,
      });
    }
  } catch (error) {
    console.error("❌ Error updateAchiement:", error);

    // Handle Prisma validation error untuk enum
    if (error instanceof Error) {
      if (
        error.message.includes(
          "Invalid `prisma.achievement.update()` invocation"
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Data tidak valid. Pastikan category dan level sesuai dengan pilihan yang tersedia",
        });
      }
    }

    // Cleanup Cloudinary jika error
    if (cloudinaryPublicId) {
      await deleteFromCloudinary(cloudinaryPublicId).catch((cleanupError) =>
        console.warn("Gagal cleanup Cloudinary:", cleanupError)
      );
    }

    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan server. Gagal mengupdate achievement",
    });
  }
};

export const deleteAchiement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Cari achievement yang akan dihapus
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: "Achievement tidak ditemukan",
      });
    }

    const gfs = getGfs();

    // ---------- HAPUS FILE DARI GRIDFS JIKA ADA ----------
    if (achievement.src && gfs) {
      try {
        const filename = achievement.src.split("/file/")[1];
        if (filename) {
          const cursor = await gfs.find({ filename }).toArray();
          if (cursor.length > 0) {
            await gfs.delete(cursor[0]._id);
            console.log(`🗑️ File berhasil dihapus dari GridFS: ${filename}`);
          }
        }
      } catch (fileError) {
        console.warn(`⚠️ Gagal hapus file dari GridFS:`, fileError);
        // Lanjut hapus data meski file gagal dihapus
      }
    }

    // ---------- HAPUS DATA DARI DATABASE ----------
    await prisma.achievement.delete({
      where: { id },
    });

    console.log(`✅ Achievement berhasil dihapus: ${achievement.title}`);

    res.status(200).json({
      success: true,
      message: "Achievement berhasil dihapus",
      data: {
        id: achievement.id,
        title: achievement.title,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error deleteAchiement:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Record to delete does not exist")) {
        return res.status(404).json({
          success: false,
          error: "Achievement tidak ditemukan",
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan server. Gagal menghapus achievement",
    });
  }
};
