import prisma from "../config/db.js";

// POST /api/videos/:id/comments
export const createComment = async (req, res) => {
  try {
    const videoId = Number(req.params.id);
    const { text } = req.body;

    if (Number.isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    // Check if video exists
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

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId: req.user.id,
        videoId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};


// GET /api/videos/:id/comments
export const getComments = async (req, res) => {
  try {
    const videoId = Number(req.params.id);

    if (Number.isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    // Check if video exists
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

    const comments = await prisma.comment.findMany({
      where: {
        videoId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: {
        comments,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};