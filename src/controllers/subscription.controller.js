import prisma from "../config/db.js";

// POST /api/users/:id/subscribe
export const subscribe = async (req, res) => {
  try {
    const creatorId = Number(req.params.id);
    const subscriberId = req.user.id;

    if (Number.isNaN(creatorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Cannot subscribe to yourself
    if (creatorId === subscriberId) {
      return res.status(400).json({
        success: false,
        message: "You cannot subscribe to yourself",
      });
    }

    // Check creator exists
    const creator = await prisma.user.findUnique({
      where: {
        id: creatorId,
      },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId,
          creatorId,
        },
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Already subscribed",
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        subscriberId,
        creatorId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      data: {
        subscription,
      },
    });
  } catch (error) {
    console.error("Subscribe error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to subscribe",
      error: error.message,
    });
  }
};

// DELETE /api/users/:id/subscribe
export const unsubscribe = async (req, res) => {
  try {
    const creatorId = Number(req.params.id);
    const subscriberId = req.user.id;

    if (Number.isNaN(creatorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId,
          creatorId,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "You are not subscribed to this user",
      });
    }

    await prisma.subscription.delete({
      where: {
        subscriberId_creatorId: {
          subscriberId,
          creatorId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Unsubscribed successfully",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unsubscribe",
      error: error.message,
    });
  }
};