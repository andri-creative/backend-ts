import cloudinary from "../utils/cloudinary";
import axios from "axios";

export const uploadToCloudinary = (fileBuffer: Buffer, quality: number) => {
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
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    console.log(`🧹 File Cloudinary dihapus: ${publicId}`);
  } catch (err) {
    console.warn(`⚠️ Gagal hapus file Cloudinary: ${publicId}`, err);
  }
};

export const downloadFromCloudinary = async (url: string): Promise<Buffer> => {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data, "binary");
};
