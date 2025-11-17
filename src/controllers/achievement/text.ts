import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import axios from "axios";
import { getGfs } from "../../utils/gridfs";

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
    if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    // 🚀 Upload ke Cloudinary dengan kualitas tertentu
    const uploadToCloudinary = (quality: number) => {
      return new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            format: "webp",
            quality,
            folder: "achievements",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    };

    let quality = 85;
    let webpUrl = "";
    let publicId = "";
    let webpBuffer: Buffer = Buffer.alloc(0);

    // 🔁 Ulangi konversi sampai ukuran < 1MB atau quality < 70
    for (let i = 0; i < 4; i++) {
      const uploadResult = await uploadToCloudinary(quality);
      webpUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;

      const buffer = await axios
        .get(webpUrl, { responseType: "arraybuffer" })
        .then((res) => Buffer.from(res.data, "binary"));

      const sizeKB = Math.round(buffer.length / 1024);

      if (sizeKB <= 1024) {
        // sudah di bawah 1MB
        webpBuffer = buffer;
        console.log(`✅ Ukuran final: ${sizeKB}KB (q=${quality})`);
        break;
      }

      if (quality < 70) {
        // hentikan biar tidak blur
        webpBuffer = buffer;
        console.log(
          `⚠️ Kualitas minimal tercapai (q=${quality}), ukuran: ${sizeKB}KB`
        );
        break;
      }

      console.log(`⚙️ Masih ${sizeKB}KB, turunkan kualitas ke ${quality - 10}`);
      quality -= 10;
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

    console.log("🔄 Nama file asli:", file.originalname);
    console.log("🔄 Nama file baru:", filename);

    // 💾 Simpan ke GridFS
    const bucket = getGfs();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: "image/webp",
    });
    uploadStream.end(webpBuffer);

    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
    });

    const gridfsUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/file/${filename}`;

    // 🧾 Simpan metadata ke Prisma
    const achievement = await prisma.achievement.create({
      data: {
        title,
        issuer,
        label,
        issueDate,
        description,
        category,
        level,
        tags: typeof tags === "string" ? JSON.parse(tags) : tags,
        src: gridfsUrl,
        uploadStatus: "completed",
      },
    });

    // 🧹 Setelah semua sukses, hapus file Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      console.log(`🧹 File Cloudinary dihapus: ${publicId}`);
    } catch (err) {
      console.warn(`⚠️ Gagal hapus file Cloudinary: ${publicId}`, err);
    }

    return res.status(201).json({
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
    if (!existing) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    let updatedSrc = existing.src;

    // 🖼️ Jika ada file baru → proses ulang
    if (file) {
      console.log("📸 File baru ditemukan, mulai proses upload...");

      // 🚀 Upload ke Cloudinary dengan kualitas tertentu
      const uploadToCloudinary = (quality: number) => {
        return new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              format: "webp",
              quality,
              folder: "achievements",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      };

      let quality = 85;
      let webpUrl = "";
      let publicId = "";
      let webpBuffer: Buffer = Buffer.alloc(0);

      // 🔁 Ulangi konversi sampai ukuran < 1MB atau quality < 70
      for (let i = 0; i < 4; i++) {
        const uploadResult = await uploadToCloudinary(quality);
        webpUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;

        const buffer = await axios
          .get(webpUrl, { responseType: "arraybuffer" })
          .then((res) => Buffer.from(res.data, "binary"));

        const sizeKB = Math.round(buffer.length / 1024);

        if (sizeKB <= 1024) {
          webpBuffer = buffer;
          console.log(`✅ Ukuran final: ${sizeKB}KB (q=${quality})`);
          break;
        }

        if (quality < 70) {
          webpBuffer = buffer;
          console.log(
            `⚠️ Kualitas minimal tercapai (q=${quality}), ukuran: ${sizeKB}KB`
          );
          break;
        }

        console.log(
          `⚙️ Masih ${sizeKB}KB, turunkan kualitas ke ${quality - 10}`
        );
        quality -= 10;
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

      console.log("🔄 Nama file asli:", file.originalname);
      console.log("🔄 Nama file baru:", filename);

      // 💾 Simpan ke GridFS
      const bucket = getGfs();
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: "image/webp",
      });
      uploadStream.end(webpBuffer);

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      updatedSrc = `${req.protocol}://${req.get("host")}/api/file/${filename}`;

      // 🧹 Hapus file Cloudinary
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        console.log(`🧹 File Cloudinary dihapus: ${publicId}`);
      } catch (err) {
        console.warn(`⚠️ Gagal hapus file Cloudinary: ${publicId}`, err);
      }

      // 🧹 Hapus file lama GridFS
      const oldFilename = existing.src?.split("/api/file/")[1];
      if (oldFilename) {
        try {
          const bucket = getGfs();
          const files = await bucket.find({ filename: oldFilename }).toArray();
          if (files.length > 0) {
            await bucket.delete(files[0]._id);
            console.log(`🗑️ File GridFS lama dihapus: ${oldFilename}`);
          }
        } catch (err) {
          console.warn(`⚠️ Gagal hapus file GridFS lama: ${oldFilename}`, err);
        }
      }
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
        pinned: pinned === "true" || pinned === true,
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
