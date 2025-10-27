import { Router } from "express";
import { forgotPassword } from "../../controllers/team/risetpas/user.forget.pass.controller";
import { resetPassword } from "../../controllers/team/risetpas/user.riset.pass.controller";
const router = Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
