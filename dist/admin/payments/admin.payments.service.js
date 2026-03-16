"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminPaymentGateways = listAdminPaymentGateways;
exports.createAdminPaymentGateway = createAdminPaymentGateway;
exports.updateAdminPaymentGateway = updateAdminPaymentGateway;
exports.setAdminPaymentGatewayEnabled = setAdminPaymentGatewayEnabled;
exports.setAdminDefaultPaymentGateway = setAdminDefaultPaymentGateway;
exports.getAdminPaymentSettings = getAdminPaymentSettings;
exports.updateAdminPaymentSettings = updateAdminPaymentSettings;
exports.listAdminPaymentTransactions = listAdminPaymentTransactions;
const prisma_1 = require("../../prisma");
const payment_secrets_1 = require("../../modules/payments/payment-secrets");
function isRuntimeProviderImplemented(provider) {
    return provider === "STRIPE";
}
function toInputJsonValue(value) {
    if (value === undefined)
        return undefined;
    return value;
}
function maskGateway(config) {
    return {
        id: config.id,
        provider: config.provider,
        displayName: config.displayName,
        mode: config.mode,
        isEnabled: config.isEnabled,
        isDefault: config.isDefault,
        publishableKey: config.publishableKey,
        merchantDisplayName: config.merchantDisplayName,
        supportedCurrencies: config.supportedCurrencies,
        options: config.options,
        hasSecretKey: Boolean(config.secretKeyEncrypted),
        hasWebhookSecret: Boolean(config.webhookSecretEncrypted),
        isRuntimeSupported: isRuntimeProviderImplemented(config.provider),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
    };
}
async function listAdminPaymentGateways() {
    const gateways = await prisma_1.prisma.paymentGatewayConfig.findMany({
        orderBy: { provider: "asc" },
    });
    return gateways.map(maskGateway);
}
async function createAdminPaymentGateway(input) {
    const existing = await prisma_1.prisma.paymentGatewayConfig.findUnique({
        where: { provider: input.provider },
        select: { id: true },
    });
    if (existing) {
        throw new Error("PAYMENT_GATEWAY_ALREADY_EXISTS");
    }
    const isDefault = input.isDefault === true;
    const isEnabled = input.isEnabled === true || isDefault;
    if (isDefault && !isRuntimeProviderImplemented(input.provider)) {
        throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
    }
    const created = await prisma_1.prisma.$transaction(async (tx) => {
        if (isDefault) {
            await tx.paymentGatewayConfig.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }
        return tx.paymentGatewayConfig.create({
            data: {
                provider: input.provider,
                displayName: input.displayName || input.provider,
                mode: input.mode || "TEST",
                isEnabled,
                isDefault,
                publishableKey: input.publishableKey,
                secretKeyEncrypted: (0, payment_secrets_1.encryptSecret)(input.secretKey),
                webhookSecretEncrypted: (0, payment_secrets_1.encryptSecret)(input.webhookSecret),
                merchantDisplayName: input.merchantDisplayName,
                supportedCurrencies: input.supportedCurrencies || [],
                options: toInputJsonValue(input.options),
            },
        });
    });
    return maskGateway(created);
}
async function updateAdminPaymentGateway(provider, input) {
    const existing = await prisma_1.prisma.paymentGatewayConfig.findUnique({
        where: { provider },
    });
    if (!existing) {
        throw new Error("PAYMENT_GATEWAY_NOT_FOUND");
    }
    const willBeDefault = input.isDefault === true;
    const willBeEnabled = input.isEnabled ?? existing.isEnabled;
    if (existing.isDefault && input.isEnabled === false) {
        throw new Error("DEFAULT_GATEWAY_DISABLE_FORBIDDEN");
    }
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        if (willBeDefault) {
            if (!isRuntimeProviderImplemented(provider)) {
                throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
            }
            await tx.paymentGatewayConfig.updateMany({
                where: { isDefault: true, provider: { not: provider } },
                data: { isDefault: false },
            });
        }
        return tx.paymentGatewayConfig.update({
            where: { provider },
            data: {
                displayName: input.displayName,
                mode: input.mode,
                isEnabled: willBeDefault ? true : willBeEnabled,
                isDefault: input.isDefault,
                publishableKey: input.publishableKey,
                secretKeyEncrypted: input.secretKey === undefined
                    ? undefined
                    : (0, payment_secrets_1.encryptSecret)(input.secretKey),
                webhookSecretEncrypted: input.webhookSecret === undefined
                    ? undefined
                    : (0, payment_secrets_1.encryptSecret)(input.webhookSecret),
                merchantDisplayName: input.merchantDisplayName,
                supportedCurrencies: input.supportedCurrencies,
                options: toInputJsonValue(input.options),
            },
        });
    });
    return maskGateway(updated);
}
async function setAdminPaymentGatewayEnabled(provider, isEnabled) {
    const existing = await prisma_1.prisma.paymentGatewayConfig.findUnique({
        where: { provider },
    });
    if (!existing) {
        throw new Error("PAYMENT_GATEWAY_NOT_FOUND");
    }
    if (existing.isDefault && !isEnabled) {
        throw new Error("DEFAULT_GATEWAY_DISABLE_FORBIDDEN");
    }
    const updated = await prisma_1.prisma.paymentGatewayConfig.update({
        where: { provider },
        data: { isEnabled },
    });
    return maskGateway(updated);
}
async function setAdminDefaultPaymentGateway(provider) {
    const existing = await prisma_1.prisma.paymentGatewayConfig.findUnique({
        where: { provider },
    });
    if (!existing) {
        throw new Error("PAYMENT_GATEWAY_NOT_FOUND");
    }
    if (!existing.isEnabled) {
        throw new Error("PAYMENT_GATEWAY_NOT_ENABLED");
    }
    if (!isRuntimeProviderImplemented(provider)) {
        throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
    }
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.paymentGatewayConfig.updateMany({
            where: { isDefault: true, provider: { not: provider } },
            data: { isDefault: false },
        });
        return tx.paymentGatewayConfig.update({
            where: { provider },
            data: { isDefault: true },
        });
    });
    return maskGateway(updated);
}
async function getAdminPaymentSettings() {
    return prisma_1.prisma.paymentSettings.upsert({
        where: { id: "GLOBAL" },
        update: {},
        create: { id: "GLOBAL" },
    });
}
async function updateAdminPaymentSettings(input) {
    return prisma_1.prisma.paymentSettings.upsert({
        where: { id: "GLOBAL" },
        update: {
            ...(input.defaultCurrency !== undefined
                ? { defaultCurrency: input.defaultCurrency }
                : {}),
            ...(input.allowDelayedPaymentMethods !== undefined
                ? { allowDelayedPaymentMethods: input.allowDelayedPaymentMethods }
                : {}),
            ...(input.bookingAutoCancelMinutes !== undefined
                ? { bookingAutoCancelMinutes: input.bookingAutoCancelMinutes }
                : {}),
        },
        create: {
            id: "GLOBAL",
            defaultCurrency: input.defaultCurrency || "ngn",
            allowDelayedPaymentMethods: input.allowDelayedPaymentMethods ?? true,
            bookingAutoCancelMinutes: input.bookingAutoCancelMinutes ?? 30,
        },
    });
}
async function listAdminPaymentTransactions(input) {
    const where = {
        ...(input.provider ? { paymentProvider: input.provider } : {}),
        ...(input.status ? { paymentStatus: input.status } : {}),
        ...(input.from || input.to
            ? {
                createdAt: {
                    ...(input.from ? { gte: input.from } : {}),
                    ...(input.to ? { lte: input.to } : {}),
                },
            }
            : {}),
        paymentProvider: input.provider ?? { not: null },
    };
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.booking.findMany({
            where,
            skip,
            take: input.limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                userId: true,
                carId: true,
                totalPrice: true,
                currency: true,
                status: true,
                paymentProvider: true,
                paymentStatus: true,
                paymentReference: true,
                paymentError: true,
                paidAt: true,
                createdAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                car: {
                    select: {
                        brand: true,
                        model: true,
                    },
                },
            },
        }),
        prisma_1.prisma.booking.count({ where }),
    ]);
    return {
        items,
        meta: {
            total,
            page: input.page,
            limit: input.limit,
            totalPages: Math.max(1, Math.ceil(total / input.limit)),
        },
    };
}
