import { prisma } from "../../prisma";

export async function approveProviderDocument(docId: string) {
  return prisma.providerDocument.update({
    where: { id: docId },
    data: { status: "APPROVED", rejectionReason: null },
  });
}

export async function rejectProviderDocument(docId: string, reason: string) {
  return prisma.providerDocument.update({
    where: { id: docId },
    data: { status: "REJECTED", rejectionReason: reason },
  });
}

export async function listProviderDocuments(providerId: string) {
  return prisma.providerDocument.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
  });
}
