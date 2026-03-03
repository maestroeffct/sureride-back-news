import bcrypt from "bcryptjs";
import { ProviderRequestStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../../prisma";

type ListProviderRequestsParams = {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
};

const validRequestStatuses = new Set<ProviderRequestStatus>([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export async function listProviderRequests(
  params: ListProviderRequestsParams = {},
) {
  const page =
    Number.isFinite(params.page) && Number(params.page) > 0
      ? Number(params.page)
      : 1;
  const limit =
    Number.isFinite(params.limit) && Number(params.limit) > 0
      ? Math.min(Number(params.limit), 100)
      : 20;
  const skip = (page - 1) * limit;

  const q = params.q?.trim();
  const normalizedStatus = params.status?.trim().toUpperCase() as
    | ProviderRequestStatus
    | undefined;

  const where = {
    ...(normalizedStatus && validRequestStatuses.has(normalizedStatus)
      ? { status: normalizedStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.providerRequest.count({ where }),
    prisma.providerRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function approveProviderRequest(requestId: string) {
  const request = await prisma.providerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.status !== "PENDING") throw new Error("REQUEST_ALREADY_PROCESSED");

  const existingProvider = await prisma.rentalProvider.findUnique({
    where: { email: request.email.toLowerCase() },
    select: { id: true },
  });

  if (existingProvider) {
    throw new Error("PROVIDER_ALREADY_EXISTS");
  }

  const rawPassword = randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const provider = await prisma.rentalProvider.create({
    data: {
      name: request.businessName,
      email: request.email.toLowerCase(),
      phone: request.phone,
      password: hashedPassword,
      status: "ACTIVE",
      isVerified: true,
      isActive: true,
      createdBy: "PROVIDER_SELF_REGISTERED",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdBy: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  await prisma.providerRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  // TODO: replace with mailer integration.
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
  if (request.status !== "PENDING") throw new Error("REQUEST_ALREADY_PROCESSED");

  return prisma.providerRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      adminNote,
    },
  });
}
