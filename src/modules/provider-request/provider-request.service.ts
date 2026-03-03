import { prisma } from "../../prisma";

export async function createProviderRequest(data: {
  businessName: string;
  email: string;
  phone?: string;
}) {
  // Prevent duplicate active request
  const existing = await prisma.providerRequest.findFirst({
    where: {
      email: data.email,
      status: "PENDING",
    },
  });

  if (existing) {
    throw new Error("REQUEST_ALREADY_EXISTS");
  }

  return prisma.providerRequest.create({
    data: {
      businessName: data.businessName,
      email: data.email.toLowerCase(),
      phone: data.phone,
    },
  });
}
