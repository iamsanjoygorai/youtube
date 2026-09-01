import { Router } from "express";

import { createComment } from "../controllers/comment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/videos/:id/comments",
  authenticate,
  createComment
);

export default router;