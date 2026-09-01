import { Router } from "express";

import {
  createComment,
  getComments,
} from "../controllers/comment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/videos/:id/comments",
  authenticate,
  createComment
);

// GET /api/videos/:id/comments
router.get(
  "/videos/:id/comments",
  getComments
);

export default router;