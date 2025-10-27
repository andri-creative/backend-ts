// src\utils\gridfsAlbum.ts
import { MongoClient, Db, GridFSBucket } from "mongodb";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();
const mongoURI = process.env.DATABASE_ALBUM as string;

let db: Db;
let gfs: GridFSBucket;

export async function initGridFSAlbum() {
  const client = new MongoClient(mongoURI);
  await client.connect();
  db = client.db("myAlbum");
  gfs = new GridFSBucket(db, { bucketName: "uploads" });
  console.log("✅ MongoDB GridFS Connected to:", db.databaseName);
}

export function getGfs() {
  if (!gfs) throw new Error("❌ GridFS belum diinisialisasi");
  return gfs;
}

// Gunakan multer memory storage
export const upload = multer({ storage: multer.memoryStorage() });
