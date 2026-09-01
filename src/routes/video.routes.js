import { Router } from "express";

import {
  createVideo,
  getVideos,
  getVideoById,
  deleteVideo,
} from "../controllers/video.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

// Upload video
router.post(
  "/",
  authenticate,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createVideo
);

// Get all videos
router.get("/", getVideos);

// Get single video
router.get("/:id", getVideoById);
router.delete("/:id", authenticate, deleteVideo);

export default router;