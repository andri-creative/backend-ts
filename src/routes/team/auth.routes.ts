import { Router } from "express";
// import { registerUser } from "../../controllers/team/auth.register.controller";
// import { verifyOtp } from "../../controllers/team/verify.otp.controller";
// import { loginUser } from "../../controllers/team/auth.login.controller";
// import { logoutUser } from "../../controllers/team/auth.logout.controller";
// import { authMiddleware } from "../../middlewares/auth.middleware";

import { authenticateToken } from "../../middlewares/auth.middleware";

import {
  register,
  verifyOtp,
  login,
  updateProfile,
  logout,
} from "../../controllers/team/auth.controller";
const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.put("/update-profile", authenticateToken, updateProfile);
router.post("/logout", authenticateToken, logout);

export default router;
