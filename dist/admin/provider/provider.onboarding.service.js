"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviderById = getProviderById;
exports.createOrUpdateDraftProvider = createOrUpdateDraftProvider;
exports.submitProvider = submitProvider;
exports.listProviders = listProviders;
const prisma_1 = require("../../prisma");
const provider_notifications_1 = require("../../utils/provider-notifications");
const validProviderStatuses = new Set([
    "DRAFT",
    "PENDING_APPROVAL",
    "ACTIVE",
    "SUSPENDED",
]);
const validProviderSources = new Set([
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
};
function toDashboardProviderStatus(status) {
    if (status === "DRAFT")
        return "draft";
    if (status === "PENDING_APPROVAL")
        return "pending";
    if (status === "ACTIVE")
        return "active";
    return "suspended";
}
function toProviderSummary(provider) {
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
async function getProviderSummaryById(providerId) {
    const provider = await prisma_1.prisma.rentalProvider.findUnique({
        where: { id: providerId },
        select: providerSummarySelect,
    });
    if (!provider) {
        throw new Error("PROVIDER_NOT_FOUND");
    }
    return toProviderSummary(provider);
}
async function getProviderById(providerId) {
    return getProviderSummaryById(providerId);
}
/**
 * Step 1: Save Draft Provider
 */
async function createOrUpdateDraftProvider(data) {
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
        await prisma_1.prisma.rentalProvider.update({
            where: { id: data.id },
            data: payload,
        });
        return getProviderSummaryById(data.id);
    }
    if (!payload.name || !payload.email) {
        throw new Error("NAME_AND_EMAIL_REQUIRED");
    }
    const provider = await prisma_1.prisma.rentalProvider.create({
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
async function submitProvider(providerId) {
    const provider = await prisma_1.prisma.rentalProvider.findUnique({
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
    await prisma_1.prisma.rentalProvider.update({
        where: { id: providerId },
        data: {
            status: "PENDING_APPROVAL",
            isVerified: false,
        },
    });
    const summary = await getProviderSummaryById(providerId);
    await (0, provider_notifications_1.notifyProviderSubmission)({
        name: summary.name,
        email: summary.email,
        phone: summary.phone,
        source: "ONBOARDING",
    });
    return summary;
}
/**
 * Admin list providers
 */
async function listProviders(params = {}) {
    const page = Number.isFinite(params.page) && Number(params.page) > 0
        ? Number(params.page)
        : 1;
    const limit = Number.isFinite(params.limit) && Number(params.limit) > 0
        ? Math.min(Number(params.limit), 100)
        : 20;
    const skip = (page - 1) * limit;
    const q = params.q?.trim();
    const normalizedStatus = params.status?.trim().toUpperCase();
    const normalizedSource = params.createdBy?.trim().toUpperCase();
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
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q, mode: "insensitive" } },
                    {
                        contactPersonName: {
                            contains: q,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {}),
    };
    const [total, providers] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.rentalProvider.count({ where }),
        prisma_1.prisma.rentalProvider.findMany({
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
