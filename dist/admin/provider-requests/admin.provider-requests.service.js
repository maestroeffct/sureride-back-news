"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProviderRequests = listProviderRequests;
exports.approveProviderRequest = approveProviderRequest;
exports.rejectProviderRequest = rejectProviderRequest;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_1 = require("../../prisma");
const provider_notifications_1 = require("../../utils/provider-notifications");
const validRequestStatuses = new Set([
    "PENDING",
    "APPROVED",
    "REJECTED",
]);
async function listProviderRequests(params = {}) {
    const page = Number.isFinite(params.page) && Number(params.page) > 0
        ? Number(params.page)
        : 1;
    const limit = Number.isFinite(params.limit) && Number(params.limit) > 0
        ? Math.min(Number(params.limit), 100)
        : 20;
    const skip = (page - 1) * limit;
    const q = params.q?.trim();
    const normalizedStatus = params.status?.trim().toUpperCase();
    const where = {
        ...(normalizedStatus && validRequestStatuses.has(normalizedStatus)
            ? { status: normalizedStatus }
            : {}),
        ...(q
            ? {
                OR: [
                    { businessName: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const [total, items] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.providerRequest.count({ where }),
        prisma_1.prisma.providerRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
    ]);
    return {
        items,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}
async function approveProviderRequest(requestId) {
    const request = await prisma_1.prisma.providerRequest.findUnique({
        where: { id: requestId },
    });
    if (!request)
        throw new Error("REQUEST_NOT_FOUND");
    if (request.status !== "PENDING")
        throw new Error("REQUEST_ALREADY_PROCESSED");
    const existingProvider = await prisma_1.prisma.rentalProvider.findUnique({
        where: { email: request.email.toLowerCase() },
        select: { id: true },
    });
    if (existingProvider) {
        throw new Error("PROVIDER_ALREADY_EXISTS");
    }
    const rawPassword = (0, crypto_1.randomBytes)(6).toString("hex");
    const hashedPassword = await bcryptjs_1.default.hash(rawPassword, 10);
    const provider = await prisma_1.prisma.rentalProvider.create({
        data: {
            name: request.businessName,
            email: request.email.toLowerCase(),
            phone: request.phone,
            password: hashedPassword,
            status: "ACTIVE",
            isVerified: true,
            isActive: true,
            createdBy: "PROVIDER_SELF_REGISTERED",
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdBy: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
        },
    });
    await prisma_1.prisma.providerRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
    });
    await (0, provider_notifications_1.notifyProviderApproved)({
        name: provider.name,
        email: provider.email,
        temporaryPassword: rawPassword,
    });
    return provider;
}
async function rejectProviderRequest(requestId, adminNote) {
    const request = await prisma_1.prisma.providerRequest.findUnique({
        where: { id: requestId },
    });
    if (!request)
        throw new Error("REQUEST_NOT_FOUND");
    if (request.status !== "PENDING")
        throw new Error("REQUEST_ALREADY_PROCESSED");
    return prisma_1.prisma.providerRequest.update({
        where: { id: requestId },
        data: {
            status: "REJECTED",
            adminNote,
        },
    });
}
