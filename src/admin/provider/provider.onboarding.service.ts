import bcrypt from "bcryptjs";
import { prisma } from "../../prisma";
import { randomBytes } from "crypto";

/**
 * Step 1: Save Draft Provider
 */
export async function createOrUpdateDraftProvider(data: any) {
  if (data.id) {
    return prisma.rentalProvider.update({
      where: { id: data.id },
      data,
    });
  }

  return prisma.rentalProvider.create({
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
export async function submitProvider(providerId: string) {
  const provider = await prisma.rentalProvider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  // Generate random password
  const rawPassword = randomBytes(6).toString("hex");
  const hashed = await bcrypt.hash(rawPassword, 10);

  const updated = await prisma.rentalProvider.update({
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
export async function listProviders() {
  return prisma.rentalProvider.findMany({
    orderBy: { createdAt: "desc" },
  });
}
