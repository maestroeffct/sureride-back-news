"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListUsers = adminListUsers;
exports.adminGetUser = adminGetUser;
exports.adminUpdateUserStatus = adminUpdateUserStatus;
exports.adminUpdateVerification = adminUpdateVerification;
exports.adminUpdateProfileStatus = adminUpdateProfileStatus;
exports.adminApproveUserKyc = adminApproveUserKyc;
exports.adminRejectUserKyc = adminRejectUserKyc;
const prisma_1 = require("../../prisma");
function toUploadUrl(fileName, publicBaseUrl) {
    if (!fileName)
        return "";
    if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
        return fileName;
    }
    const cleanBase = (publicBaseUrl || "").replace(/\/+$/, "");
    return cleanBase ? `${cleanBase}/uploads/${fileName}` : `/uploads/${fileName}`;
}
function mapUserForAdmin(user, publicBaseUrl) {
    const { password, ...safeUser } = user;
    if (!safeUser.kyc) {
        return safeUser;
    }
    return {
        ...safeUser,
        kyc: {
            ...safeUser.kyc,
            passportPhotoUrl: toUploadUrl(safeUser.kyc.passportPhotoUrl, publicBaseUrl),
            governmentIdFrontUrl: toUploadUrl(safeUser.kyc.governmentIdFrontUrl, publicBaseUrl),
            governmentIdBackUrl: toUploadUrl(safeUser.kyc.governmentIdBackUrl, publicBaseUrl),
            driverLicenseFrontUrl: toUploadUrl(safeUser.kyc.driverLicenseFrontUrl, publicBaseUrl),
            driverLicenseBackUrl: toUploadUrl(safeUser.kyc.driverLicenseBackUrl, publicBaseUrl),
        },
    };
}
async function adminListUsers(query, publicBaseUrl) {
    const { q, profileStatus, isVerified, isActive, page, limit } = query;
    const where = {};
    if (profileStatus)
        where.profileStatus = profileStatus;
    if (isVerified !== undefined)
        where.isVerified = isVerified;
    if (isActive !== undefined)
        where.isActive = isActive;
    if (q) {
        where.OR = [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
        ];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { kyc: true },
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    const sanitized = items.map((u) => mapUserForAdmin(u, publicBaseUrl));
    return {
        items: sanitized,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}
async function adminGetUser(userId, publicBaseUrl) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: { kyc: true },
    });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return mapUserForAdmin(user, publicBaseUrl);
}
async function adminUpdateUserStatus(userId, isActive) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: { isActive },
        });
        if (!isActive) {
            await tx.session.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            });
        }
        return user;
    });
}
async function adminUpdateVerification(userId, isVerified, profileStatus) {
    const resolvedProfileStatus = profileStatus ?? (isVerified ? undefined : "REJECTED");
    return prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                isVerified,
                ...(resolvedProfileStatus ? { profileStatus: resolvedProfileStatus } : {}),
            },
        });
        if (!isVerified) {
            await tx.session.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            });
        }
        return user;
    });
}
async function adminUpdateProfileStatus(userId, profileStatus) {
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: { profileStatus },
    });
}
async function adminApproveUserKyc(userId, publicBaseUrl) {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    if (!existingUser)
        throw new Error("USER_NOT_FOUND");
    const existingKyc = await prisma_1.prisma.userKyc.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!existingKyc)
        throw new Error("KYC_NOT_FOUND");
    const user = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.userKyc.update({
            where: { userId },
            data: {
                status: "VERIFIED",
                rejectionReason: null,
            },
        });
        return tx.user.update({
            where: { id: userId },
            data: {
                isVerified: true,
                profileStatus: "VERIFIED",
            },
            include: { kyc: true },
        });
    });
    return mapUserForAdmin(user, publicBaseUrl);
}
async function adminRejectUserKyc(userId, reason, publicBaseUrl) {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    if (!existingUser)
        throw new Error("USER_NOT_FOUND");
    const existingKyc = await prisma_1.prisma.userKyc.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!existingKyc)
        throw new Error("KYC_NOT_FOUND");
    const user = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.userKyc.update({
            where: { userId },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
            },
        });
        return tx.user.update({
            where: { id: userId },
            data: {
                isVerified: false,
                profileStatus: "REJECTED",
            },
            include: { kyc: true },
        });
    });
    return mapUserForAdmin(user, publicBaseUrl);
}
