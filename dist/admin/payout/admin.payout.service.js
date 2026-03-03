"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertProviderPayoutAccount = upsertProviderPayoutAccount;
exports.createPayout = createPayout;
exports.markPayoutPaid = markPayoutPaid;
const prisma_1 = require("../../prisma");
async function upsertProviderPayoutAccount(providerId, data) {
    return prisma_1.prisma.providerPayoutAccount.upsert({
        where: { providerId },
        update: {
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            currency: data.currency ?? "NGN",
            isVerified: true, // admin-set = verified
        },
        create: {
            providerId,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            currency: data.currency ?? "NGN",
            isVerified: true,
        },
    });
}
async function createPayout(providerId, amount, note) {
    return prisma_1.prisma.providerPayout.create({
        data: {
            providerId,
            amount,
            note,
            status: "PENDING",
        },
    });
}
async function markPayoutPaid(payoutId, reference) {
    return prisma_1.prisma.providerPayout.update({
        where: { id: payoutId },
        data: { status: "PAID", reference },
    });
}
