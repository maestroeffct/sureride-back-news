"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireProviderAuth = requireProviderAuth;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../prisma");
async function requireProviderAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type !== "PROVIDER" ||
            !payload.sessionId ||
            !payload.providerId) {
            return res.status(401).json({ message: "Invalid provider token" });
        }
        const session = await prisma_1.prisma.providerSession.findUnique({
            where: { id: payload.sessionId },
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return res.status(401).json({ message: "Session expired" });
        }
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token or Expired Token" });
    }
}
