"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveProviderDocument = approveProviderDocument;
exports.rejectProviderDocument = rejectProviderDocument;
exports.listProviderDocuments = listProviderDocuments;
const prisma_1 = require("../../prisma");
async function approveProviderDocument(docId) {
    return prisma_1.prisma.providerDocument.update({
        where: { id: docId },
        data: { status: "APPROVED", rejectionReason: null },
    });
}
async function rejectProviderDocument(docId, reason) {
    return prisma_1.prisma.providerDocument.update({
        where: { id: docId },
        data: { status: "REJECTED", rejectionReason: reason },
    });
}
async function listProviderDocuments(providerId) {
    return prisma_1.prisma.providerDocument.findMany({
        where: { providerId },
        orderBy: { createdAt: "desc" },
    });
}
