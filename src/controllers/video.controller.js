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
    const videos = await prisma.video.findMany({
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
      count: videos.length,
      data: videos,
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
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        video,
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