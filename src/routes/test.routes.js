import { Router } from "express";
import cloudinary from "../config/cloudinary.js";

const router = Router();

router.get("/cloudinary", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();

    return res.status(200).json({
      success: true,
      message: "Cloudinary connection successful",
      result,
    });
  } catch (error) {
    console.error("Cloudinary error:", error);

    return res.status(500).json({
      success: false,
      message: "Cloudinary connection failed",
      error: error.message,
    });
  }
});

export default router;