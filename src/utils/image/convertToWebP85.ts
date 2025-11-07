// src/utils/image/convertToWebP85.ts
import sharp from "sharp";

export async function convertToWebP85(buffer: Buffer, mimetype: string, maxKB = 150): Promise<Buffer> {
  // LEWATKAN PDF! Cloudinary yang konversi
  if (mimetype === "application/pdf") {
    console.log("PDF: Lewati WebP (Cloudinary handle)");
    return buffer;
  }

  let quality = 90;
  const maxSize = maxKB * 1024;

  while (buffer.length > maxSize && quality > 70) {
    buffer = await sharp(buffer)
      .webp({ quality, effort: 6, lossless: false })
      .toBuffer();
    quality -= 5;
  }

  return await sharp(buffer)
    .webp({ quality: 85, effort: 6, lossless: false })
    .toBuffer();
}