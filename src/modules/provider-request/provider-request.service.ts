import { prisma } from "../../prisma";
import { notifyProviderSubmission } from "../../utils/provider-notifications";

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

  const request = await prisma.providerRequest.create({
    data: {
      businessName: data.businessName,
      email: data.email.toLowerCase(),
      phone: data.phone,
    },
  });

  await notifyProviderSubmission({
    name: request.businessName,
    email: request.email,
    phone: request.phone,
    source: "PUBLIC_REQUEST",
  });

  return request;
}
