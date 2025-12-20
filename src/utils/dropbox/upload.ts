import dropbox from "./client";

export default async (buffer: Buffer, filename: string) => {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `/uploads/${Date.now()}_${clean}`;

  const res = await dropbox.filesUpload({
    path,
    contents: buffer,
  });

  return res.result;
};
