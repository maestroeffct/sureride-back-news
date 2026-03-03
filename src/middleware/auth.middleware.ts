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
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token or Expired Token" });
  }
}
