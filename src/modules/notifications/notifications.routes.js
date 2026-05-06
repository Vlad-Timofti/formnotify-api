const express = require("express");
const { z } = require("zod");

const prisma = require("../../db/prisma");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

const createChannelSchema = z.object({
  type: z.enum(["webhook", "email"]),
  name: z.string().min(2),
  config: z.union([
    z.object({
      url: z.string().url(),
    }),
    z.object({
      to: z.string().email(),
    }),
  ]),
  isActive: z.boolean().optional().default(true),
});

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const data = createChannelSchema.parse(req.body);

    const channel = await prisma.notificationChannel.create({
      data: {
        organizationId: req.organization.id,
        type: data.type,
        name: data.name,
        configJson: data.config,
        isActive: data.isActive,
      },
    });

    return res.status(201).json({
      success: true,
      channel,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification channel data",
      error: error.errors || error.message,
    });
  }
});

router.get("/", async (req, res) => {
  const channels = await prisma.notificationChannel.findMany({
    where: {
      organizationId: req.organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json({
    success: true,
    channels,
  });
});

router.delete("/:id", async (req, res) => {
  const channel = await prisma.notificationChannel.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organization.id,
    },
  });

  if (!channel) {
    return res.status(404).json({
      success: false,
      message: "Notification channel not found",
    });
  }

  await prisma.notificationChannel.delete({
    where: {
      id: channel.id,
    },
  });

  return res.json({
    success: true,
    message: "Notification channel deleted",
  });
});

router.get("/logs", async (req, res) => {
  const logs = await prisma.notificationLog.findMany({
    where: {
      organizationId: req.organization.id,
    },
    include: {
      channel: true,
      submission: {
        include: {
          form: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return res.json({
    success: true,
    logs,
  });
});

module.exports = router;