import dbxClient from "./client";

export default async function deleteFromDropbox(path: string) {
  try {
    return await dbxClient.filesDeleteV2({ path });
  } catch (err) {
    console.error("Dropbox delete error:", err);
    throw err;
  }
}
