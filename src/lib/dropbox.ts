import { Dropbox } from "dropbox";
import dotenv from "dotenv";

dotenv.config();

const accessToken = process.env.DROPBOX_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("DROPBOX_ACCESS_TOKEN is required in environment variables");
}

export const dropbox = new Dropbox({
  accessToken: accessToken,
});

export const uploadToDropbox = async (
  fileBuffer: Buffer,
  filename: string
): Promise<any> => {
  try {
    console.log("📤 Uploading to Dropbox:", filename);

    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dropboxPath = `/uploads/${Date.now()}_${cleanFilename}`;

    const response = await dropbox.filesUpload({
      path: dropboxPath,
      contents: fileBuffer,
      mode: { ".tag": "add" },
      autorename: true,
      mute: false,
    });

    console.log("✅ Upload successful:", response.result.name);
    return response.result;
  } catch (error: any) {
    console.error("❌ Upload failed:");

    if (error?.status === 401) {
      throw new Error(
        "Authentication failed. Please check your Dropbox access token and permissions."
      );
    }

    throw new Error(`Upload error: ${error.message}`);
  }
};

// Modified functions yang tidak memerlukan files.metadata.read
export const deleteFromDropbox = async (dropboxPath: string): Promise<void> => {
  try {
    await dropbox.filesDeleteV2({ path: dropboxPath });
    console.log("✅ File deleted from Dropbox");
  } catch (error: any) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

export const getShareableLink = async (
  dropboxPath: string
): Promise<string> => {
  try {
    const response = await dropbox.sharingCreateSharedLinkWithSettings({
      path: dropboxPath,
    });
    return response.result.url;
  } catch (error: any) {
    // Jika link sudah ada
    if (error?.error?.error?.[".tag"] === "shared_link_already_exists") {
      try {
        const links = await dropbox.sharingListSharedLinks({
          path: dropboxPath,
        });
        if (links.result.links.length > 0) {
          return links.result.links[0].url;
        }
      } catch (listError) {
        console.log("⚠️  Cannot get existing links (missing permissions)");
      }
    }
    throw new Error(`Cannot create shareable link: ${error.message}`);
  }
};

// Ubah link Dropbox jadi direct download
export const toDirectUrl = (url: string) => {
  return url
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace("dropbox.com", "dl.dropboxusercontent.com")
    .replace("?dl=0", "")
    .replace("&dl=0", "");
};
