import { MongoClient, Db, GridFSBucket } from "mongodb";
import dotenv from "dotenv";
import multer from "multer";
import sharp from "sharp";

dotenv.config();
const mongoURI = process.env.DATABASE_URL as string;

let db: Db;
let gfs: GridFSBucket;

export async function initGridFS() {
  const client = new MongoClient(mongoURI);
  await client.connect();
  db = client.db("poro-semi");
  gfs = new GridFSBucket(db, { bucketName: "uploads" });
  console.log("✅ MongoDB GridFS Connected to:", db.databaseName);
}

export function getGfs() {
  if (!gfs) throw new Error("❌ GridFS belum diinisialisasi");
  return gfs;
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diizinkan"));
    }
  },
});

// COMPRESS IMAGE FUNCTION
const compressImage = async (buffer: Buffer): Promise<Buffer> => {
  try {
    const originalSizeMB = buffer.length / 1024 / 1024;
    let quality = 80;

    // Adjust quality berdasarkan ukuran file
    if (originalSizeMB > 3) quality = 50; // >3MB → quality 50
    else if (originalSizeMB > 1) quality = 60; // >1MB → quality 60
    else if (originalSizeMB > 0.5) quality = 70; // >0.5MB → quality 70

    const compressedBuffer = await sharp(buffer)
      .jpeg({
        quality: quality,
        mozjpeg: true,
      })
      .png({
        quality: Math.max(quality - 10, 60),
        compressionLevel: 9,
      })
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    console.log(
      `✅ Image compressed: ${originalSizeMB.toFixed(2)}MB → ${(
        compressedBuffer.length /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
    return compressedBuffer;
  } catch (error) {
    console.error("❌ Image compression error:", error);
    throw new Error("Gagal mengkompres gambar");
  }
};

// UPLOAD FILE KE GRIDFS DENGAN COMPRESSION
export const uploadToGridFS = async (
  file: Express.Multer.File
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const gfs = getGfs();
      const filename = `${Date.now()}-${file.originalname}`;

      let finalBuffer = file.buffer;
      let finalSize = file.size;

      // COMPRESS JIKA FILE > 100KB
      if (file.size > 100 * 1024) {
        console.log(`🔄 Compressing image...`);
        finalBuffer = await compressImage(file.buffer);
        finalSize = finalBuffer.length;
      }

      const uploadStream = gfs.openUploadStream(filename, {
        metadata: {
          mimetype: file.mimetype,
          originalSize: file.size,
          compressedSize: finalSize,
          uploadedAt: new Date(),
        },
      });

      uploadStream.end(finalBuffer);

      uploadStream.on("finish", () => {
        console.log(
          `✅ File uploaded: ${filename} (${(finalSize / 1024).toFixed(2)}KB)`
        );
        resolve(filename);
      });
      uploadStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

// GET FILE DARI GRIDFS
export const getFileFromGridFS = async (
  filename: string
): Promise<{ stream: any; mimetype: string }> => {
  const gfs = getGfs();
  const files = await gfs.find({ filename }).toArray();

  if (!files || files.length === 0) {
    throw new Error("File tidak ditemukan");
  }

  const downloadStream = gfs.openDownloadStreamByName(filename);
  return {
    stream: downloadStream,
    mimetype: files[0].metadata?.mimetype || "image/jpeg",
  };
};

// HAPUS FILE DARI GRIDFS
export const deleteFileFromGridFS = async (filename: string): Promise<void> => {
  const gfs = getGfs();
  const files = await gfs.find({ filename }).toArray();

  if (files.length > 0) {
    await gfs.delete(files[0]._id);
  }
};
