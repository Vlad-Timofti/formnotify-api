const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");

const prisma = require("../../db/prisma");
const { generateApiKey, generateJwt } = require("../../utils/tokens");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

const registerSchema = z.object({
  organizationName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const baseSlug = createSlug(data.organizationName);
    const slug = `${baseSlug}-${Date.now()}`;
    const apiKey = generateApiKey();

    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        slug,
        apiKey,
        users: {
          create: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: "owner",
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = organization.users[0];

    const token = generateJwt({
      userId: user.id,
      organizationId: organization.id,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        apiKey: organization.apiKey,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid register data",
      error: error.errors || error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateJwt({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
        apiKey: user.organization.apiKey,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid login data",
      error: error.errors || error.message,
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
    organization: {
      id: req.organization.id,
      name: req.organization.name,
      slug: req.organization.slug,
      plan: req.organization.plan,
      apiKey: req.organization.apiKey,
    },
  });
});

module.exports = router;