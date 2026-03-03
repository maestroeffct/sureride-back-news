import bcrypt from "bcryptjs";
import { prisma } from "../../prisma";
import { randomBytes } from "crypto";

export async function listProviderRequests() {
  return prisma.providerRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function approveProviderRequest(requestId: string) {
  const request = await prisma.providerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.status !== "PENDING")
    throw new Error("REQUEST_ALREADY_PROCESSED");

  // Generate temporary password
  const rawPassword = randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Create RentalProvider
  const provider = await prisma.rentalProvider.create({
    data: {
      name: request.businessName,
      email: request.email,
      phone: request.phone,
      password: hashedPassword,
      status: "ACTIVE",
      isVerified: true,
      createdBy: "PROVIDER_SELF_REGISTERED",
    },
  });

  // Mark request approved
  await prisma.providerRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  // TODO: Send email with credentials
  console.log("Send provider login credentials:", {
    email: request.email,
    password: rawPassword,
  });

  return provider;
}

export async function rejectProviderRequest(
  requestId: string,
  adminNote?: string,
) {
  const request = await prisma.providerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.status !== "PENDING")
    throw new Error("REQUEST_ALREADY_PROCESSED");

  return prisma.providerRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      adminNote,
    },
  });
}
