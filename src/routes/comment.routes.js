import { Router } from "express";

import {
  createComment,
  getComments,
  deleteComment,
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

// DELETE /api/comments/:id
router.delete(
  "/comments/:id",
  authenticate,
  deleteComment
);

export default router;