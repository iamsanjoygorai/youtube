import { Router } from "express";

import {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
} from "../controllers/history.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Add/update a watched video
router.post("/", addToHistory);

// Get current user's history
router.get("/", getHistory);

// Clear current user's history
router.delete("/", clearHistory);

// Remove one video from current user's history
router.delete("/:videoId", removeFromHistory);

export default router;
