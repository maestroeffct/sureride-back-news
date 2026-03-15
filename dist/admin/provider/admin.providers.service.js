"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveProvider = approveProvider;
exports.suspendProvider = suspendProvider;
exports.setProviderCommission = setProviderCommission;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_1 = require("../../prisma");
const provider_notifications_1 = require("../../utils/provider-notifications");
const adminProviderSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    contactPersonName: true,
    contactPersonRole: true,
    contactPersonPhone: true,
    status: true,
    commissionRate: true,
    isVerified: true,
    isActive: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
};
async function approveProvider(providerId) {
    const existing = await prisma_1.prisma.rentalProvider.findUnique({
        where: { id: providerId },
        select: {
            id: true,
            password: true,
        },
    });
    if (!existing) {
        throw new Error("PROVIDER_NOT_FOUND");
    }
    let generatedPassword = null;
    const updateData = {
        status: "ACTIVE",
        isVerified: true,
        isActive: true,
    };
    if (!existing.password) {
        generatedPassword = (0, crypto_1.randomBytes)(6).toString("hex");
        updateData.password = await bcryptjs_1.default.hash(generatedPassword, 10);
    }
    const provider = await prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: updateData,
        select: adminProviderSelect,
    });
    await (0, provider_notifications_1.notifyProviderApproved)({
        name: provider.name,
        email: provider.email,
        temporaryPassword: generatedPassword ?? undefined,
    });
    if (generatedPassword) {
        console.log("Generated temporary provider password for approval:", {
            email: provider.email,
        });
    }
    return provider;
}
async function suspendProvider(providerId, _reason) {
    const [provider] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.rentalProvider.update({
            where: { id: providerId },
            data: { status: "SUSPENDED", isActive: false },
            select: adminProviderSelect,
        }),
        prisma_1.prisma.providerSession.updateMany({
            where: {
                providerId,
                isActive: true,
            },
            data: { isActive: false },
        }),
    ]);
    return provider;
}
async function setProviderCommission(providerId, commissionRate) {
    if (commissionRate < 0 || commissionRate > 1) {
        throw new Error("COMMISSION_RATE_INVALID");
    }
    return prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: { commissionRate },
        select: adminProviderSelect,
    });
}
