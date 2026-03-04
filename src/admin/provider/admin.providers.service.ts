import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "../../prisma";
import { notifyProviderApproved } from "../../utils/provider-notifications";

const adminProviderSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  contactPersonName: true,
  contactPersonRole: true,
  contactPersonPhone: true,
  status: true,
  commissionRate: true,
  isVerified: true,
  isActive: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function approveProvider(providerId: string) {
  const existing = await prisma.rentalProvider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!existing) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  let generatedPassword: string | null = null;
  const updateData: {
    status: "ACTIVE";
    isVerified: boolean;
    isActive: boolean;
    password?: string;
  } = {
    status: "ACTIVE",
    isVerified: true,
    isActive: true,
  };

  if (!existing.password) {
    generatedPassword = randomBytes(6).toString("hex");
    updateData.password = await bcrypt.hash(generatedPassword, 10);
  }

  const provider = await prisma.rentalProvider.update({
    where: { id: providerId },
    data: updateData,
    select: adminProviderSelect,
  });

  await notifyProviderApproved({
    name: provider.name,
    email: provider.email,
    temporaryPassword: generatedPassword ?? undefined,
  });

  if (generatedPassword) {
    console.log("Generated temporary provider password for approval:", {
      email: provider.email,
    });
  }

  return provider;
}

export async function suspendProvider(providerId: string, _reason?: string) {
  const [provider] = await prisma.$transaction([
    prisma.rentalProvider.update({
      where: { id: providerId },
      data: { status: "SUSPENDED", isActive: false },
      select: adminProviderSelect,
    }),
    prisma.providerSession.updateMany({
      where: {
        providerId,
        isActive: true,
      },
      data: { isActive: false },
    }),
  ]);

  return provider;
}

export async function setProviderCommission(
  providerId: string,
  commissionRate: number,
) {
  if (commissionRate < 0 || commissionRate > 1) {
    throw new Error("COMMISSION_RATE_INVALID");
  }

  return prisma.rentalProvider.update({
    where: { id: providerId },
    data: { commissionRate },
    select: adminProviderSelect,
  });
}
