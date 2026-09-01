import { Router } from "express";

import {
  likeVideo,
  unlikeVideo,
} from "../controllers/like.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/:id/like", authenticate, likeVideo);
router.delete("/:id/like", authenticate, unlikeVideo);

export default router;