import { Router } from "express";

import {
  subscribe,
  unsubscribe,
} from "../controllers/subscription.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/users/:id/subscribe",
  authenticate,
  subscribe
);

router.delete(
  "/users/:id/subscribe",
  authenticate,
  unsubscribe
);

export default router;