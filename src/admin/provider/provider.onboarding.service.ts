import { ProviderSource, ProviderStatus } from "@prisma/client";
import { prisma } from "../../prisma";

type ProviderDraftPayload = {
  id?: string;
  name?: string;
  logoUrl?: string | null;
  email?: string;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonRole?: string | null;
  contactPersonPhone?: string | null;
  businessAddress?: string | null;
  countryId?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
};

type ListProvidersParams = {
  q?: string;
  status?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
};

type ProviderSummaryRow = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state?: string;
  totalCars: number;
  activeCars: number;
  pendingCars: number;
  status: "draft" | "pending" | "active" | "suspended";
  workflowStatus: ProviderStatus;
  createdBy: ProviderSource;
  joinedOn: string;
  isVerified: boolean;
  isActive: boolean;
  documentsCount: number;
  commissionRate: number | null;
};

const validProviderStatuses = new Set<ProviderStatus>([
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "SUSPENDED",
]);

const validProviderSources = new Set<ProviderSource>([
  "SURERIDE_ADMIN",
  "PROVIDER_SELF_REGISTERED",
]);

const providerSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  contactPersonName: true,
  businessAddress: true,
  status: true,
  createdBy: true,
  isVerified: true,
  isActive: true,
  commissionRate: true,
  createdAt: true,
  cars: {
    select: { isActive: true },
  },
  _count: {
    select: {
      cars: true,
      documents: true,
    },
  },
} as const;

function toDashboardProviderStatus(
  status: ProviderStatus,
): "draft" | "pending" | "active" | "suspended" {
  if (status === "DRAFT") return "draft";
  if (status === "PENDING_APPROVAL") return "pending";
  if (status === "ACTIVE") return "active";
  return "suspended";
}

function toProviderSummary(
  provider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    contactPersonName: string | null;
    businessAddress: string | null;
    status: ProviderStatus;
    createdBy: ProviderSource;
    isVerified: boolean;
    isActive: boolean;
    commissionRate: number | null;
    createdAt: Date;
    cars: Array<{ isActive: boolean }>;
    _count: { cars: number; documents: number };
  },
): ProviderSummaryRow {
  const activeCars = provider.cars.filter((car) => car.isActive).length;

  return {
    id: provider.id,
    name: provider.name,
    contactPerson: provider.contactPersonName ?? "",
    email: provider.email,
    phone: provider.phone ?? "",
    city: provider.businessAddress ?? "",
    state: "",
    totalCars: provider._count.cars,
    activeCars,
    // TODO: replace when car moderation status exists.
    pendingCars: 0,
    status: toDashboardProviderStatus(provider.status),
    workflowStatus: provider.status,
    createdBy: provider.createdBy,
    joinedOn: provider.createdAt.toISOString(),
    isVerified: provider.isVerified,
    isActive: provider.isActive,
    documentsCount: provider._count.documents,
    commissionRate: provider.commissionRate,
  };
}

async function getProviderSummaryById(providerId: string) {
  const provider = await prisma.rentalProvider.findUnique({
    where: { id: providerId },
    select: providerSummarySelect,
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  return toProviderSummary(provider);
}

export async function getProviderById(providerId: string) {
  return getProviderSummaryById(providerId);
}

/**
 * Step 1: Save Draft Provider
 */
export async function createOrUpdateDraftProvider(data: ProviderDraftPayload) {
  const payload = {
    name: data.name?.trim(),
    logoUrl: data.logoUrl,
    email: data.email?.toLowerCase().trim(),
    phone: data.phone?.trim(),
    contactPersonName: data.contactPersonName?.trim(),
    contactPersonRole: data.contactPersonRole?.trim(),
    contactPersonPhone: data.contactPersonPhone?.trim(),
    businessAddress: data.businessAddress?.trim(),
    countryId: data.countryId?.trim(),
    bankName: data.bankName?.trim(),
    bankAccountNumber: data.bankAccountNumber?.trim(),
    bankAccountName: data.bankAccountName?.trim(),
  };

  if (data.id) {
    await prisma.rentalProvider.update({
      where: { id: data.id },
      data: payload,
    });

    return getProviderSummaryById(data.id);
  }

  if (!payload.name || !payload.email) {
    throw new Error("NAME_AND_EMAIL_REQUIRED");
  }

  const provider = await prisma.rentalProvider.create({
    data: {
      name: payload.name,
      logoUrl: payload.logoUrl,
      email: payload.email,
      phone: payload.phone,
      contactPersonName: payload.contactPersonName,
      contactPersonRole: payload.contactPersonRole,
      contactPersonPhone: payload.contactPersonPhone,
      businessAddress: payload.businessAddress,
      countryId: payload.countryId,
      bankName: payload.bankName,
      bankAccountNumber: payload.bankAccountNumber,
      bankAccountName: payload.bankAccountName,
      password: "",
      status: "DRAFT",
      isVerified: false,
      isActive: true,
    },
  });

  return getProviderSummaryById(provider.id);
}

/**
 * Step 2: Final Submit
 */
export async function submitProvider(providerId: string) {
  const provider = await prisma.rentalProvider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  if (provider.status === "SUSPENDED") {
    throw new Error("PROVIDER_SUSPENDED");
  }

  if (provider.status === "ACTIVE") {
    throw new Error("PROVIDER_ALREADY_ACTIVE");
  }

  await prisma.rentalProvider.update({
    where: { id: providerId },
    data: {
      status: "PENDING_APPROVAL",
      isVerified: false,
    },
  });

  return getProviderSummaryById(providerId);
}

/**
 * Admin list providers
 */
export async function listProviders(params: ListProvidersParams = {}) {
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
    | ProviderStatus
    | undefined;
  const normalizedSource = params.createdBy?.trim().toUpperCase() as
    | ProviderSource
    | undefined;

  const where = {
    ...(normalizedStatus && validProviderStatuses.has(normalizedStatus)
      ? { status: normalizedStatus }
      : {}),
    ...(normalizedSource && validProviderSources.has(normalizedSource)
      ? { createdBy: normalizedSource }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            {
              contactPersonName: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [total, providers] = await prisma.$transaction([
    prisma.rentalProvider.count({ where }),
    prisma.rentalProvider.findMany({
      where,
      select: providerSummarySelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: providers.map(toProviderSummary),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
