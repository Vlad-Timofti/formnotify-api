const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing authorization token",
      });
    }

    const token = header.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    req.user = user;
    req.organization = user.organization;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
}

module.exports = authMiddleware;