import cloudinary from "./cloudinary";

export function UploadToolsCloudinary(
  fileBuffer: Buffer,
  originalName: string,
  isPdf: boolean = false
) {
  return new Promise<any>((resolve, reject) => {
    const now = new Date();
    const fileName = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}_${originalName}`;

    const uploadOptions: any = {
      folder: "temp-achievements",
      public_id: fileName.replace(/\.[^/.]+$/, ""),
      overwrite: true,
      resource_type: isPdf ? "image" : "auto",
      access_mode: "public",
    };

    // Jika PDF, gunakan transformation untuk convert ke image
    if (isPdf) {
      uploadOptions.resource_type = "image";
      uploadOptions.transformation = [
        { format: "png" }, // Convert to PNG
        { page: 1 }, // Ambil halaman pertama saja
        { width: 800, height: 1000, crop: "limit" },
      ];
    } else {
      uploadOptions.resource_type = "auto";
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve({ ...result, fileName });
      }
    );

    stream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

export async function cleanupTempCloudinaryFiles() {
  try {
    // Hapus file yang lebih dari 1 jam di folder temp-achievements
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "temp-achievements/",
      max_results: 100,
    });

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    for (const resource of result.resources) {
      const createdAt = new Date(resource.created_at).getTime();
      if (now - createdAt > ONE_HOUR) {
        await cloudinary.uploader.destroy(resource.public_id);
        console.log(`🗑️ Cleanup Cloudinary temp file: ${resource.public_id}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up Cloudinary temp files:", error);
  }
}
