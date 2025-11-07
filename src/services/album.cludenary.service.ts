import cloudinary from "../utils/cloudinary";

export function uploadToCloudinaryAlbum(fileBuffer: Buffer, publicId: string) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "my_album",
        resource_type: "image",
        format: "webp",
        qualiry: "auto:85",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

export async function renameCloudinaryFile(
  publicId: string,
  width: number,
  height: number
) {
  const publicIdWithSize = `${publicId}.${width}x${height}`;
  return cloudinary.uploader.rename(publicId, `my_album/${publicIdWithSize}`);
}
