import { Router } from "express";

import {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
} from "../controllers/history.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Every history route requires authentication
router.use(authenticate);

// Add/update history
router.post("/", addToHistory);

// Get user's history
router.get("/", getHistory);

// Clear all history
router.delete("/", clearHistory);

// Delete one video from history
router.delete("/:videoId", removeFromHistory);

export default router;