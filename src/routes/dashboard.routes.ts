import { Router } from "express";
import NodeCache from "node-cache";
import {
  getAllRolesData,
  getAllToolsData,
  getAllAchievementData,
  getAllRantingsData,
  getAllAlbumData,
  getAllUserData,
  getAllProjectData,
} from "../controllers/dashboard/dashboard.controller";

const cache = new NodeCache({ stdTTL: 300 });

const router = Router();

router.get("/dashboard", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20)
    );

    // BUAT CACHE KEY
    const cacheKey = `dashboard_${page}_${limit}`;

    // CEK CACHE DULU → Kalau ada, langsung return
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const [tools, roles, achievements, rantings, myAlbum, team, project] =
      await Promise.all([
        getAllToolsData({ page, limit }),
        getAllRolesData({ page, limit }),
        getAllAchievementData({ page, limit }),
        getAllRantingsData({ page, limit }),
        getAllAlbumData({ page, limit }),
        getAllUserData({ page, limit }),
        getAllProjectData({ page, limit }),
      ]);
    const response = {
      tools,
      roles,
      achievements,
      rantings,
      myAlbum,
      team,
      project,
    };
    cache.set(cacheKey, response);

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
