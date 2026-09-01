import prisma from "../config/db.js";

import {
  uploadAvatar,
  deleteAvatarFromCloudinary,
} from "../services/user.service.js";

// GET /api/users/:id
export const getUserProfile = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,

        _count: {
          select: {
            videos: true,
            comments: true,
            likes: true,
            subscribers: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let isSubscribed = false;

    if (req.user?.id) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          subscriberId_creatorId: {
            subscriberId: req.user.id,
            creatorId: id,
          },
        },
      });

      isSubscribed = !!subscription;
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          videoCount: user._count.videos,
          commentCount: user._count.comments,
          likeCount: user._count.likes,
          subscriberCount: user._count.subscribers,
          isSubscribed,
        },
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};


// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { username } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = {};

    // Update username
    if (username !== undefined) {
      const trimmedUsername = username.trim();

      if (!trimmedUsername) {
        return res.status(400).json({
          success: false,
          message: "Username cannot be empty",
        });
      }

      // Check if username is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          username: trimmedUsername,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username already taken",
        });
      }

      updateData.username = trimmedUsername;
    }

    // Update avatar
    const avatarFile = req.files?.avatar?.[0];

    if (avatarFile) {
      // Delete old avatar from Cloudinary
      if (user.avatarPublicId) {
        await deleteAvatarFromCloudinary(user.avatarPublicId);
      }

      // Upload new avatar
      const uploadedAvatar = await uploadAvatar(avatarFile.buffer);

      updateData.avatarUrl = uploadedAvatar.secure_url;
      updateData.avatarPublicId = uploadedAvatar.public_id;
    }

    // Nothing to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        avatarPublicId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};