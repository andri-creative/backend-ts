// src\utils\gridfs.ts
import { MongoClient, Db, GridFSBucket } from "mongodb";
import dotenv from "dotenv";
import multer from "multer";

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

// Gunakan multer memory storage
export const upload = multer({ storage: multer.memoryStorage() });
