import { Router } from "express";

import {
  createVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  updateVideo,
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

// Update video
router.put(
  "/:id",
  authenticate,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateVideo
);

// Delete video
router.delete("/:id", authenticate, deleteVideo);

export default router;