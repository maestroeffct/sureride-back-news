"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.updateCurrentUser = updateCurrentUser;
exports.updateUserPassword = updateUserPassword;
exports.deactivateUser = deactivateUser;
const prisma_1 = require("../../prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function getCurrentUser(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            kyc: true,
        },
    });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const { password, ...safeUser } = user;
    return safeUser;
}
async function updateCurrentUser(userId, data) {
    try {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data,
        });
        const { password, ...safeUser } = user;
        return safeUser;
    }
    catch (err) {
        if (err.code === "P2002") {
            throw new Error("DUPLICATE");
        }
        throw err;
    }
}
async function updateUserPassword(userId, oldPassword, newPassword) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const valid = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!valid)
        throw new Error("INVALID_OLD_PASSWORD");
    const hash = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            password: hash,
            mustChangePassword: false,
            tempPasswordExpiresAt: null,
        },
    });
    return { message: "Password updated successfully" };
}
async function deactivateUser(userId) {
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            isActive: false,
        },
    });
    const { password, ...safeUser } = user;
    return safeUser;
}
