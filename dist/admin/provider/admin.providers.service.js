"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveProvider = approveProvider;
exports.suspendProvider = suspendProvider;
exports.setProviderCommission = setProviderCommission;
const prisma_1 = require("../../prisma");
async function approveProvider(providerId) {
    return prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: { status: "ACTIVE", isVerified: true, isActive: true },
    });
}
async function suspendProvider(providerId, reason) {
    // optional: store reason somewhere (audit table later)
    return prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: { status: "SUSPENDED", isActive: false },
    });
}
async function setProviderCommission(providerId, commissionRate) {
    if (commissionRate < 0 || commissionRate > 1) {
        throw new Error("COMMISSION_RATE_INVALID"); // expects 0..1
    }
    return prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: { commissionRate },
    });
}
