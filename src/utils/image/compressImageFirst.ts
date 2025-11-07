// src/utils/image/compressImageFirst.ts
import sharp from "sharp";

export async function compressImageFirst(buffer: Buffer, mimetype: string): Promise<Buffer> {
  // LEWATKAN PDF!
  if (mimetype === "application/pdf") {
    console.log("PDF: Lewati kompresi awal");
    return buffer;
  }

  if (buffer.length < 150 * 1024) return buffer;

  return await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
}