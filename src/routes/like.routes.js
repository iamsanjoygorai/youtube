import { Router } from "express";

import { likeVideo } from "../controllers/like.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/:id/like", authenticate, likeVideo);

export default router;