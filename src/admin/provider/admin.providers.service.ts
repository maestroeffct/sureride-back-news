import { prisma } from "../../prisma";

export async function approveProvider(providerId: string) {
  return prisma.rentalProvider.update({
    where: { id: providerId },
    data: { status: "ACTIVE", isVerified: true, isActive: true },
  });
}

export async function suspendProvider(providerId: string, reason?: string) {
  // optional: store reason somewhere (audit table later)
  return prisma.rentalProvider.update({
    where: { id: providerId },
    data: { status: "SUSPENDED", isActive: false },
  });
}

export async function setProviderCommission(
  providerId: string,
  commissionRate: number,
) {
  if (commissionRate < 0 || commissionRate > 1) {
    throw new Error("COMMISSION_RATE_INVALID"); // expects 0..1
  }

  return prisma.rentalProvider.update({
    where: { id: providerId },
    data: { commissionRate },
  });
}
