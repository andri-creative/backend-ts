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

    // 💾 Simpan ke GridFS
    const bucket = getGfs();
    const filename = `${Date.now()}-${file.originalname.split(".")[0]}.webp`;
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
