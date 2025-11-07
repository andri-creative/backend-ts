import cloudinary from "./cloudinary";
import { UploadApiResponse } from "cloudinary";

/**
 * Upload file ke Cloudinary (PDF → konversi otomatis)
 */
export async function UploadToolsCloudinary(
  fileBuffer: Buffer,
  originalName: string,
  isPdf: boolean = false
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(
      now.getHours()
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      now.getSeconds()
    ).padStart(2, "0")}`;
    const publicId = `temp-achievements/${timestamp}_${originalName.replace(
      /\.[^/.]+$/,
      ""
    )}`;

    const uploadOptions: any = {
      folder: "temp-achievements",
      public_id: publicId,
      overwrite: true,
      access_mode: "public",
    };

    if (isPdf) {
      // PDF → upload sebagai RAW, lalu konversi via URL
      uploadOptions.resource_type = "raw";
      uploadOptions.format = "pdf";
    } else {
      uploadOptions.resource_type = "auto";
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload gagal"));
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

/**
 * Hapus file dari Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary dihapus: ${publicId}`);
    return result;
  } catch (error) {
    console.error("Gagal hapus Cloudinary:", error);
    throw error;
  }
}

/**
 * Cleanup file temp > 1 jam
 */
export async function cleanupTempCloudinaryFiles() {
  try {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "temp-achievements/",
      max_results: 500,
    });

    const deletePromises = result.resources
      .filter((r: any) => new Date(r.created_at).getTime() < oneHourAgo)
      .map((r: any) => cloudinary.uploader.destroy(r.public_id));

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`Cleanup: ${deletePromises.length} file temp dihapus`);
    }
  } catch (error) {
    console.error("Cleanup Cloudinary gagal:", error);
  }
}
