import { Router } from "express";

import { getAllUserTeam } from "../../controllers/team/user.Team.controller";

const router = Router();

router.get("/", getAllUserTeam);

export default router;
