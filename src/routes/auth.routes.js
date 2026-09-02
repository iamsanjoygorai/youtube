import { Router } from "express";

import {
  register,
  login,
  getMe,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

import {
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/email.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;