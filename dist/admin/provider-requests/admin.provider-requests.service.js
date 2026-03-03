"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProviderRequests = listProviderRequests;
exports.approveProviderRequest = approveProviderRequest;
exports.rejectProviderRequest = rejectProviderRequest;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../prisma");
const crypto_1 = require("crypto");
async function listProviderRequests() {
    return prisma_1.prisma.providerRequest.findMany({
        orderBy: { createdAt: "desc" },
    });
}
async function approveProviderRequest(requestId) {
    const request = await prisma_1.prisma.providerRequest.findUnique({
        where: { id: requestId },
    });
    if (!request)
        throw new Error("REQUEST_NOT_FOUND");
    if (request.status !== "PENDING")
        throw new Error("REQUEST_ALREADY_PROCESSED");
    // Generate temporary password
    const rawPassword = (0, crypto_1.randomBytes)(6).toString("hex");
    const hashedPassword = await bcryptjs_1.default.hash(rawPassword, 10);
    // Create RentalProvider
    const provider = await prisma_1.prisma.rentalProvider.create({
        data: {
            name: request.businessName,
            email: request.email,
            phone: request.phone,
            password: hashedPassword,
            status: "ACTIVE",
            isVerified: true,
            createdBy: "PROVIDER_SELF_REGISTERED",
        },
    });
    // Mark request approved
    await prisma_1.prisma.providerRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
    });
    // TODO: Send email with credentials
    console.log("Send provider login credentials:", {
        email: request.email,
        password: rawPassword,
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
