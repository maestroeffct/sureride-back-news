import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../prisma";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (payload.type !== "USER" || !payload.userId || !payload.sessionId) {
      return res.status(401).json({ message: "Invalid user token", code: "UNAUTHORIZED" });
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired", code: "UNAUTHORIZED" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account suspended", code: "ACCOUNT_SUSPENDED" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token or Expired Token", code: "UNAUTHORIZED" });
  }
}
