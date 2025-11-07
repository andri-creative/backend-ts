import { getGfs } from "../utils/gridfs";
import { Request } from "express";

export const uploadToGridFS = async (
  req: Request,
  buffer: Buffer,
  filename: string
) => {
  const bucket = getGfs();
  const uploadStream = bucket.openUploadStream(filename, {
    contentType: "image/webp",
  });

  uploadStream.end(buffer);

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", resolve);
    uploadStream.on("error", reject);
  });

  const url = `${req.protocol}://${req.get("host")}/api/file/${filename}`;
  return url;
};

export const deleteFromGridFS = async (filename: string) => {
  try {
    const bucket = getGfs();
    const files = await bucket.find({ filename }).toArray();
    if (files.length > 0) {
      await bucket.delete(files[0]._id);
      console.log(`🗑️ File GridFS dihapus: ${filename}`);
    }
  } catch (err) {
    console.warn(`⚠️ Gagal hapus file GridFS: ${filename}`, err);
  }
};
