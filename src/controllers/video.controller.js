import prisma from "../config/db.js";

import {
  uploadVideo,
  uploadThumbnail,
  deleteVideoFromCloudinary,
  deleteThumbnailFromCloudinary,
} from "../services/video.service.js";


// POST /api/videos
export const createVideo = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!req.files?.video) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail?.[0];

    const uploadedVideo = await uploadVideo(videoFile.buffer);

    let uploadedThumbnail = null;

    if (thumbnailFile) {
      uploadedThumbnail = await uploadThumbnail(thumbnailFile.buffer);
    }

    const video = await prisma.video.create({
  data: {
    title,
    description: description || null,
    videoUrl: uploadedVideo.secure_url,
    thumbnailUrl: uploadedThumbnail?.secure_url || null,
    publicId: uploadedVideo.public_id,
    thumbnailPublicId: uploadedThumbnail?.public_id || null,
    userId: req.user.id,
  },
});

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        video,
      },
    });
  } catch (error) {
    console.error("Create video error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload video",
      error: error.message,
    });
  }
};

// GET /api/videos
export const getVideos = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50
    );

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    const [totalVideos, videos] = await prisma.$transaction([
      prisma.video.count({
        where,
      }),

      prisma.video.findMany({
        where,
        skip,
        take: limit,

        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },

          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const userId = req.user?.id || null;

    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        let isLiked = false;

        if (userId) {
          const like = await prisma.like.findUnique({
            where: {
              userId_videoId: {
                userId,
                videoId: video.id,
              },
            },
          });

          isLiked = !!like;
        }

        return {
          ...video,
          viewCount: video.views,
          likeCount: video._count.likes,
          commentCount: video._count.comments,
          isLiked,
          _count: undefined,
          };
      })
    );

    const totalPages = Math.ceil(totalVideos / limit);

    return res.status(200).json({
      success: true,

      count: videosWithStats.length,

      data: videosWithStats,

      pagination: {
        page,
        limit,
        totalVideos,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch videos",
      error: error.message,
    });
  }
};


// GET /api/videos/:id
export const getVideoById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await prisma.video.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = req.user?.id || null;

    let isLiked = false;

    if (userId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId: id,
          },
        },
      });

      isLiked = !!like;
    }

    const videoWithStats = {
  ...video,
  viewCount: video.views,
  likeCount: video._count.likes,
  commentCount: video._count.comments,
  isLiked,
  _count: undefined,
    };

    return res.status(200).json({
      success: true,
      data: {
        video: videoWithStats,
      },
    });
  } catch (error) {
    console.error("Get video error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch video",
      error: error.message,
    });
  }
};


// DELETE /api/videos/:id
export const deleteVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await prisma.video.findUnique({
      where: {
        id,
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership
    if (video.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this video",
      });
    }

    // Delete video from Cloudinary
    await deleteVideoFromCloudinary(video.publicId);

    // Delete video from database
    await prisma.video.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete video error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete video",
      error: error.message,
    });
  }
};


// PUT /api/videos/:id
export const updateVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await prisma.video.findUnique({
      where: {
        id,
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership
    if (video.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this video",
      });
    }

    const { title, description } = req.body;

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    // Handle new thumbnail
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (thumbnailFile) {
      // Delete old thumbnail from Cloudinary
      if (video.thumbnailPublicId) {
        await deleteThumbnailFromCloudinary(video.thumbnailPublicId);
      }

      // Upload new thumbnail
      const uploadedThumbnail = await uploadThumbnail(
        thumbnailFile.buffer
      );

      updateData.thumbnailUrl = uploadedThumbnail.secure_url;
      updateData.thumbnailPublicId = uploadedThumbnail.public_id;
    }

    const updatedVideo = await prisma.video.update({
      where: {
        id,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: {
        video: updatedVideo,
      },
    });
  } catch (error) {
    console.error("Update video error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update video",
      error: error.message,
    });
  }
};


// POST /api/videos/:id/view
export const addVideoView = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Increase video view count
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        views: true,
      },
    });

    // Add video to history only if user is logged in
    if (req.user?.id) {
      await prisma.history.upsert({
        where: {
          userId_videoId: {
            userId: req.user.id,
            videoId: id,
          },
        },

        update: {
          watchedAt: new Date(),
        },

        create: {
          userId: req.user.id,
          videoId: id,
          watchedAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video view added",
      data: {
        videoId: updatedVideo.id,
        viewCount: updatedVideo.views,
      },
    });
  } catch (error) {
    console.error("Add video view error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add video view",
      error: error.message,
    });
  }
};

// GET /api/videos/feed
export const getHomeFeed = async (req, res) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50
    );

    const userId = req.user?.id || null;

    // ==========================================
    // ANONYMOUS USER
    // ==========================================

    if (!userId) {
      const skip = (page - 1) * limit;

      const [totalVideos, videos] =
        await prisma.$transaction([
          prisma.video.count(),

          prisma.video.findMany({
            skip,
            take: limit,

            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },

              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },

            orderBy: [
              {
                views: "desc",
              },
              {
                createdAt: "desc",
              },
            ],
          }),
        ]);

      const videosWithStats = videos.map(
        (video) => ({
          ...video,

          viewCount: video.views,
          likeCount: video._count.likes,
          commentCount:
            video._count.comments,

          isLiked: false,

          _count: undefined,
        })
      );

      const totalPages = Math.ceil(
        totalVideos / limit
      );

      return res.status(200).json({
        success: true,

        count: videosWithStats.length,

        data: videosWithStats,

        pagination: {
          page,
          limit,
          totalVideos,
          totalPages,
          hasNextPage:
            page < totalPages,
          hasPreviousPage:
            page > 1,
        },
      });
    }

    // ==========================================
    // GET USER SUBSCRIPTIONS
    // ==========================================

    const subscriptions =
      await prisma.subscription.findMany({
        where: {
          subscriberId: userId,
        },

        select: {
          creatorId: true,
        },
      });

    const subscribedCreatorIds =
      subscriptions.map(
        (subscription) =>
          subscription.creatorId
      );

    // ==========================================
    // GET WATCH HISTORY
    // ==========================================

    const history =
      await prisma.history.findMany({
        where: {
          userId,
        },

        select: {
          videoId: true,

          video: {
            select: {
              userId: true,
              title: true,
              description: true,
            },
          },
        },

        orderBy: {
          watchedAt: "desc",
        },

        take: 100,
      });

    const watchedVideoIds =
      history.map(
        (item) => item.videoId
      );

    const watchedCreatorIds = [
      ...new Set(
        history.map(
          (item) =>
            item.video.userId
        )
      ),
    ];

    // ==========================================
    // BUILD USER INTEREST KEYWORDS
    // ==========================================

    const stopWords = new Set([
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
      "from",
      "your",
      "you",
      "are",
      "was",
      "how",
      "what",
      "why",
      "when",
      "where",
      "into",
      "about",
      "using",
      "use",
      "new",
      "the",
      "a",
      "an",
      "to",
      "of",
      "in",
      "on",
      "is",
      "it",
      "or",
      "as",
      "at",
      "by",
      "be",
      "can",
    ]);

    const keywordFrequency = {};

    for (const item of history) {
      const text = `
        ${item.video.title || ""}
        ${item.video.description || ""}
      `.toLowerCase();

      const words =
        text.match(/[a-z0-9]+/g) || [];

      for (const word of words) {
        if (word.length < 3) {
          continue;
        }

        if (stopWords.has(word)) {
          continue;
        }

        keywordFrequency[word] =
          (keywordFrequency[word] || 0) + 1;
      }
    }

    // Keep strongest 30 interests
    const userKeywords =
      Object.entries(
        keywordFrequency
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([keyword]) => keyword);

    // ==========================================
    // GET CANDIDATE VIDEOS
    // ==========================================

    const videos =
      await prisma.video.findMany({
        where: {
          NOT: {
            id: {
              in: watchedVideoIds,
            },
          },
        },

        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },

          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

    // ==========================================
    // CALCULATE RECOMMENDATION SCORE
    // ==========================================

    const now = Date.now();

    const rankedVideos =
      videos.map((video) => {
        let score = 0;

        // --------------------------------------
        // SUBSCRIBED CREATOR
        // --------------------------------------

        if (
          subscribedCreatorIds.includes(
            video.userId
          )
        ) {
          score += 1000;
        }

        // --------------------------------------
        // CREATOR FROM WATCH HISTORY
        // --------------------------------------

        if (
          watchedCreatorIds.includes(
            video.userId
          )
        ) {
          score += 300;
        }

        // --------------------------------------
        // CONTENT MATCH
        // --------------------------------------

        const videoText = `
          ${video.title || ""}
          ${video.description || ""}
        `.toLowerCase();

        let matchingKeywords = 0;

        for (const keyword of userKeywords) {
          if (
            videoText.includes(keyword)
          ) {
            matchingKeywords++;
          }
        }

        score +=
          matchingKeywords * 50;

        // --------------------------------------
        // POPULARITY
        // --------------------------------------

        score +=
          Math.log10(
            video.views + 1
          ) * 100;

        // --------------------------------------
        // FRESHNESS
        // --------------------------------------

        const ageInHours =
          (now -
            new Date(
              video.createdAt
            ).getTime()) /
          (1000 * 60 * 60);

        if (ageInHours < 24) {
          score += 200;
        } else if (
          ageInHours < 72
        ) {
          score += 100;
        } else if (
          ageInHours < 168
        ) {
          score += 50;
        }

        return {
          video,
          score,
          matchingKeywords,
        };
      });

    // ==========================================
    // SORT BY ORIGINAL SCORE
    // ==========================================

    rankedVideos.sort(
      (a, b) => b.score - a.score
    );

    // ==========================================
    // CREATOR DIVERSITY
    // ==========================================

    const creatorCount = {};

    const diversifiedVideos =
      rankedVideos.map((item) => {
        const creatorId =
          item.video.userId;

        const count =
          creatorCount[creatorId] || 0;

        let diversityPenalty = 0;

        if (count === 1) {
          diversityPenalty = 150;
        } else if (count === 2) {
          diversityPenalty = 300;
        } else if (count >= 3) {
          diversityPenalty = 500;
        }

        creatorCount[creatorId] =
          count + 1;

        return {
          ...item,

          adjustedScore:
            item.score -
            diversityPenalty,
        };
      });

    // ==========================================
    // SORT BY DIVERSITY-ADJUSTED SCORE
    // ==========================================

    diversifiedVideos.sort(
      (a, b) =>
        b.adjustedScore -
        a.adjustedScore
    );

    // ==========================================
    // PAGINATION
    // ==========================================

    const totalVideos =
      diversifiedVideos.length;

    const skip =
      (page - 1) * limit;

    const paginatedVideos =
      diversifiedVideos.slice(
        skip,
        skip + limit
      );

    // ==========================================
    // ADD LIKE STATUS
    // ==========================================

    const videosWithStats =
      await Promise.all(
        paginatedVideos.map(
          async ({ video }) => {
            const like =
              await prisma.like.findUnique({
                where: {
                  userId_videoId: {
                    userId,
                    videoId:
                      video.id,
                  },
                },
              });

            return {
              ...video,

              viewCount:
                video.views,

              likeCount:
                video._count
                  .likes,

              commentCount:
                video._count
                  .comments,

              isLiked:
                !!like,

              _count:
                undefined,
            };
          }
        )
      );

    // ==========================================
    // PAGINATION INFO
    // ==========================================

    const totalPages =
      Math.ceil(
        totalVideos / limit
      );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      count:
        videosWithStats.length,

      data:
        videosWithStats,

      pagination: {
        page,
        limit,
        totalVideos,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get home feed error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch home feed",

      error: error.message,
    });
  }
};