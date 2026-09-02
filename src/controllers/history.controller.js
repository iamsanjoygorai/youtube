import prisma from "../config/db.js";

// POST /api/history
export const addToHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = Number(req.body.videoId);

    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const history = await prisma.history.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {
        watchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        watchedAt: new Date(),
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            thumbnailUrl: true,
            views: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Video added to history",
      data: { history },
    });
  } catch (error) {
    console.error("Add history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add video to history",
    });
  }
};

// GET /api/history
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [totalHistory, history] = await prisma.$transaction([
      prisma.history.count({ where: { userId } }),
      prisma.history.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { watchedAt: "desc" },
        select: {
          id: true,
          videoId: true,
          watchedAt: true,
          video: {
            select: {
              id: true,
              title: true,
              description: true,
              videoUrl: true,
              thumbnailUrl: true,
              views: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalHistory / limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
      pagination: {
        page,
        limit,
        totalHistory,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
};

// DELETE /api/history/:videoId
export const removeFromHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = Number(req.params.videoId);

    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const deleted = await prisma.history.deleteMany({
      where: {
        userId,
        videoId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found in history",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video removed from history",
    });
  } catch (error) {
    console.error("Remove history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove video from history",
    });
  }
};

// DELETE /api/history
export const clearHistory = async (req, res) => {
  try {
    const result = await prisma.history.deleteMany({
      where: { userId: req.user.id },
    });

    return res.status(200).json({
      success: true,
      message: "History cleared successfully",
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error("Clear history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear history",
    });
  }
};
