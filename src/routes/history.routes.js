import { Router } from "express";

import {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
} from "../controllers/history.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

<<<<<<< HEAD
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
=======
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
>>>>>>> 5c7ecf0 (history feature has been added)
