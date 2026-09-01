import { Router } from "express";

import {
  getUserProfile,
  updateProfile,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

// Update my profile
router.put(
  "/profile",
  authenticate,
  upload.fields([
    { name: "avatar", maxCount: 1 },
  ]),
  updateProfile
);

// Get user profile
router.get("/:id", getUserProfile);

export default router;