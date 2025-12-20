import dropbox from "./client";

export default async (path: string): Promise<string> => {
  try {
    const res = await dropbox.sharingCreateSharedLinkWithSettings({ path });
    return res.result.url;
  } catch (e: any) {
    if (e.error?.error?.[".tag"] === "shared_link_already_exists") {
      const links = await dropbox.sharingListSharedLinks({ path });
      return links.result.links[0].url;
    }
    throw e;
  }
};
