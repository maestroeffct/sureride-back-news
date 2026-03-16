"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListUsers = adminListUsers;
exports.adminGetUser = adminGetUser;
exports.adminUpdateUserStatus = adminUpdateUserStatus;
exports.adminUpdateVerification = adminUpdateVerification;
exports.adminUpdateProfileStatus = adminUpdateProfileStatus;
exports.adminCreateUser = adminCreateUser;
exports.adminApproveUserKyc = adminApproveUserKyc;
exports.adminRejectUserKyc = adminRejectUserKyc;
const prisma_1 = require("../../prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const mailer_1 = require("../../utils/mailer");
const adminUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneCountry: true,
    phoneNumber: true,
    dateOfBirth: true,
    nationality: true,
    isVerified: true,
    isActive: true,
    mustChangePassword: true,
    tempPasswordExpiresAt: true,
    profileStatus: true,
    createdAt: true,
    updatedAt: true,
    kyc: true,
};
async function sendUserCredentialsEmailSafe(payload) {
    const loginUrl = process.env.USER_LOGIN_URL;
    try {
        await mailer_1.mailer.sendMail({
            from: process.env.SMTP_FROM,
            to: payload.email,
            subject: "Your SureRide account credentials",
            html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your SureRide account is ready</h2>
          <p>Hello ${payload.firstName},</p>
          <p>Your account has been created by SureRide admin.</p>
          <p><b>Email:</b> ${payload.email}</p>
          <p><b>Temporary password:</b> ${payload.password}</p>
          <p>Please sign in and change your password immediately.</p>
          ${loginUrl
                ? `<p><a href="${loginUrl}" target="_blank" rel="noopener noreferrer">Open SureRide app</a></p>`
                : ""}
          <p>If prompted, complete OTP verification from your email.</p>
        </div>
      `,
        });
        return true;
    }
    catch (error) {
        console.error("[AdminUsers] Failed to send credentials email", {
            email: payload.email,
            error,
        });
        return false;
    }
}
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
            select: adminUserSelect,
        });
        if (!isActive) {
            await tx.session.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            });
        }
        return mapUserForAdmin(user);
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
            select: adminUserSelect,
        });
        if (!isVerified) {
            await tx.session.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            });
        }
        return mapUserForAdmin(user);
    });
}
async function adminUpdateProfileStatus(userId, profileStatus) {
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { profileStatus },
        select: adminUserSelect,
    });
    return mapUserForAdmin(user);
}
async function adminCreateUser(input) {
    const email = input.email.toLowerCase();
    const sendInvite = input.sendInvite !== false;
    const existingUser = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [
                { email },
                {
                    AND: [
                        { phoneCountry: input.phoneCountry },
                        { phoneNumber: input.phoneNumber },
                    ],
                },
            ],
        },
        select: { id: true },
    });
    if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }
    const plainPassword = input.password ?? (0, crypto_1.randomBytes)(6).toString("hex");
    const hashedPassword = await bcryptjs_1.default.hash(plainPassword, 10);
    const ttlHours = Number(process.env.USER_TEMP_PASSWORD_TTL_HOURS || 24);
    const tempPasswordExpiresAt = sendInvite && Number.isFinite(ttlHours)
        ? new Date(Date.now() + ttlHours * 60 * 60 * 1000)
        : null;
    const profileStatus = input.profileStatus ??
        (input.isVerified ? client_1.ProfileStatus.VERIFIED : client_1.ProfileStatus.INCOMPLETE);
    const user = await prisma_1.prisma.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email,
            password: hashedPassword,
            phoneCountry: input.phoneCountry,
            phoneNumber: input.phoneNumber,
            dateOfBirth: input.dateOfBirth,
            nationality: input.nationality,
            isActive: input.isActive ?? true,
            isVerified: input.isVerified ?? false,
            profileStatus,
            authProvider: "EMAIL",
            mustChangePassword: sendInvite,
            tempPasswordExpiresAt,
        },
        select: adminUserSelect,
    });
    let inviteEmailSent = false;
    if (sendInvite) {
        inviteEmailSent = await sendUserCredentialsEmailSafe({
            firstName: input.firstName,
            email,
            password: plainPassword,
        });
    }
    return {
        user: mapUserForAdmin(user),
        inviteEmailSent,
        temporaryPasswordGenerated: !input.password,
        temporaryPasswordExpiresAt: user.tempPasswordExpiresAt,
    };
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
