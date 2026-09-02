import { Router } from "express";

import {
  register,
  login,
  getMe,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { verifyEmail } from "../controllers/email.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/verify-email", verifyEmail);

export default router;