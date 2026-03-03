"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdateDraftProvider = createOrUpdateDraftProvider;
exports.submitProvider = submitProvider;
exports.listProviders = listProviders;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../prisma");
const crypto_1 = require("crypto");
/**
 * Step 1: Save Draft Provider
 */
async function createOrUpdateDraftProvider(data) {
    if (data.id) {
        return prisma_1.prisma.rentalProvider.update({
            where: { id: data.id },
            data,
        });
    }
    return prisma_1.prisma.rentalProvider.create({
        data: {
            name: data.name,
            email: data.email,
            password: "", // temp
            status: "DRAFT",
        },
    });
}
/**
 * Step 2: Final Submit
 */
async function submitProvider(providerId) {
    const provider = await prisma_1.prisma.rentalProvider.findUnique({
        where: { id: providerId },
    });
    if (!provider) {
        throw new Error("PROVIDER_NOT_FOUND");
    }
    // Generate random password
    const rawPassword = (0, crypto_1.randomBytes)(6).toString("hex");
    const hashed = await bcryptjs_1.default.hash(rawPassword, 10);
    const updated = await prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: {
            password: hashed,
            status: "ACTIVE",
            isVerified: true,
        },
    });
    // TODO: send email with credentials
    console.log("Send login email with password:", rawPassword);
    return updated;
}
/**
 * Admin list providers
 */
async function listProviders() {
    return prisma_1.prisma.rentalProvider.findMany({
        orderBy: { createdAt: "desc" },
    });
}
