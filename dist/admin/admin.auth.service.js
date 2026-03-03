"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.adminLogout = adminLogout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../prisma");
const jwt_1 = require("../utils/jwt");
async function adminLogin(email, password) {
    const admin = await prisma_1.prisma.admin.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!admin || !admin.isActive) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const ok = await bcryptjs_1.default.compare(password, admin.password);
    if (!ok)
        throw new Error("INVALID_CREDENTIALS");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await prisma_1.prisma.adminSession.create({
        data: {
            adminId: admin.id,
            expiresAt,
        },
    });
    const token = (0, jwt_1.signToken)({
        type: "ADMIN",
        sessionId: session.id,
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
    });
    return {
        token,
        admin: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
        },
    };
}
async function adminLogout(sessionId) {
    await prisma_1.prisma.adminSession.update({
        where: { id: sessionId },
        data: { isActive: false },
    });
}
