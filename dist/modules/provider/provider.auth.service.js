"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerLogin = providerLogin;
exports.providerLogout = providerLogout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../prisma");
const jwt_1 = require("../../utils/jwt");
async function providerLogin(email, password) {
    const provider = await prisma_1.prisma.rentalProvider.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!provider) {
        throw new Error("INVALID_CREDENTIALS");
    }
    if (!provider.password) {
        throw new Error("PROVIDER_ACCOUNT_NOT_READY");
    }
    const ok = await bcryptjs_1.default.compare(password, provider.password);
    if (!ok) {
        throw new Error("INVALID_CREDENTIALS");
    }
    if (provider.status === "SUSPENDED" || !provider.isActive) {
        throw new Error("PROVIDER_SUSPENDED");
    }
    if (provider.status !== "ACTIVE") {
        throw new Error("PROVIDER_PENDING_APPROVAL");
    }
    if (!provider.isVerified) {
        throw new Error("PROVIDER_NOT_VERIFIED");
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await prisma_1.prisma.providerSession.create({
        data: {
            providerId: provider.id,
            expiresAt,
        },
    });
    const token = (0, jwt_1.signToken)({
        type: "PROVIDER",
        sessionId: session.id,
        providerId: provider.id,
        email: provider.email,
    });
    return {
        token,
        provider: {
            id: provider.id,
            name: provider.name,
            email: provider.email,
            status: provider.status,
        },
    };
}
async function providerLogout(sessionId) {
    await prisma_1.prisma.providerSession.update({
        where: { id: sessionId },
        data: { isActive: false },
    });
}
