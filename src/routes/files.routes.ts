import { Router, Request, Response } from "express";
import { getFileFromGridFS } from "../utils/gridfs";

const router = Router();

// GET file dari GridFS
router.get("/:fileId", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    const { stream, mimetype } = await getFileFromGridFS(fileId);

    res.set("Content-Type", mimetype);
    stream.pipe(res);

    stream.on("error", (error: Error) => {
      // console.error("Stream error:", error);
      res.status(404).json({ error: "File tidak ditemukan" });
    });
  } catch (error) {
    // console.error("Get file error:", error);
    res.status(404).json({ error: "File tidak ditemukan" });
  }
});

export default router;
