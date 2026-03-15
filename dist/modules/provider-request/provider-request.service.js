"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProviderRequest = createProviderRequest;
const prisma_1 = require("../../prisma");
const provider_notifications_1 = require("../../utils/provider-notifications");
async function createProviderRequest(data) {
    // Prevent duplicate active request
    const existing = await prisma_1.prisma.providerRequest.findFirst({
        where: {
            email: data.email,
            status: "PENDING",
        },
    });
    if (existing) {
        throw new Error("REQUEST_ALREADY_EXISTS");
    }
    const request = await prisma_1.prisma.providerRequest.create({
        data: {
            businessName: data.businessName,
            email: data.email.toLowerCase(),
            phone: data.phone,
        },
    });
    await (0, provider_notifications_1.notifyProviderSubmission)({
        name: request.businessName,
        email: request.email,
        phone: request.phone,
        source: "PUBLIC_REQUEST",
    });
    return request;
}
