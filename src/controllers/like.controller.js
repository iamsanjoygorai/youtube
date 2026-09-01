import prisma from "../config/db.js";

// POST /api/videos/:id/like
export const likeVideo = async (req, res) => {
  try {
    const videoId = Number(req.params.id);

    if (Number.isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    // Check video exists
    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check if user already liked the video
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: "Video already liked",
      });
    }

    const like = await prisma.like.create({
      data: {
        userId: req.user.id,
        videoId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Video liked successfully",
      data: {
        like,
      },
    });
  } catch (error) {
    console.error("Like video error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to like video",
      error: error.message,
    });
  }
};