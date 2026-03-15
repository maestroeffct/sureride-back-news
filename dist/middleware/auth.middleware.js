"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../prisma");
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type !== "USER" || !payload.userId || !payload.sessionId) {
            return res.status(401).json({ message: "Invalid user token", code: "UNAUTHORIZED" });
        }
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: payload.sessionId },
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return res.status(401).json({ message: "Session expired", code: "UNAUTHORIZED" });
        }
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch {
        return res.status(401).json({ message: "Invalid token or Expired Token", code: "UNAUTHORIZED" });
    }
}
