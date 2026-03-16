"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripePaymentSheetSession = createStripePaymentSheetSession;
exports.handlePaymentWebhook = handlePaymentWebhook;
exports.getClientPaymentConfig = getClientPaymentConfig;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const stripe_gateway_1 = require("./gateways/stripe.gateway");
const payment_secrets_1 = require("./payment-secrets");
function toMinorUnit(amount) {
    return Math.round(amount * 100);
}
function normalizeProvider(rawProvider) {
    const normalized = rawProvider.toUpperCase();
    if (!Object.values(client_1.PaymentProvider).includes(normalized)) {
        throw new Error("UNSUPPORTED_PAYMENT_PROVIDER");
    }
    return normalized;
}
function assertProviderImplemented(provider) {
    if (provider !== "STRIPE") {
        throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
    }
}
function toRuntimeConfig(config) {
    return {
        provider: config.provider,
        mode: config.mode,
        publishableKey: config.publishableKey,
        secretKey: (0, payment_secrets_1.decryptSecret)(config.secretKeyEncrypted),
        webhookSecret: (0, payment_secrets_1.decryptSecret)(config.webhookSecretEncrypted),
        merchantDisplayName: config.merchantDisplayName,
    };
}
function buildStripeEnvConfig() {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
        return null;
    }
    return {
        provider: "STRIPE",
        mode: "TEST",
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        merchantDisplayName: process.env.STRIPE_MERCHANT_NAME || "SureRide",
    };
}
async function getPaymentSettings() {
    return prisma_1.prisma.paymentSettings.upsert({
        where: { id: "GLOBAL" },
        update: {},
        create: { id: "GLOBAL" },
    });
}
async function getActiveRuntimeGatewayConfig() {
    const config = (await prisma_1.prisma.paymentGatewayConfig.findFirst({
        where: { isEnabled: true, isDefault: true },
        select: {
            provider: true,
            mode: true,
            publishableKey: true,
            secretKeyEncrypted: true,
            webhookSecretEncrypted: true,
            merchantDisplayName: true,
        },
    })) ||
        (await prisma_1.prisma.paymentGatewayConfig.findFirst({
            where: { isEnabled: true },
            orderBy: { updatedAt: "desc" },
            select: {
                provider: true,
                mode: true,
                publishableKey: true,
                secretKeyEncrypted: true,
                webhookSecretEncrypted: true,
                merchantDisplayName: true,
            },
        }));
    if (config) {
        return toRuntimeConfig(config);
    }
    const envConfig = buildStripeEnvConfig();
    if (envConfig)
        return envConfig;
    throw new Error("NO_ACTIVE_PAYMENT_GATEWAY");
}
async function getRuntimeGatewayConfigByProvider(provider) {
    const config = await prisma_1.prisma.paymentGatewayConfig.findUnique({
        where: { provider },
        select: {
            provider: true,
            mode: true,
            isEnabled: true,
            publishableKey: true,
            secretKeyEncrypted: true,
            webhookSecretEncrypted: true,
            merchantDisplayName: true,
        },
    });
    if (config && config.isEnabled) {
        return toRuntimeConfig(config);
    }
    if (provider === "STRIPE") {
        const envConfig = buildStripeEnvConfig();
        if (envConfig)
            return envConfig;
    }
    throw new Error("PAYMENT_GATEWAY_NOT_ENABLED");
}
function buildGateway(config) {
    assertProviderImplemented(config.provider);
    if (config.provider === "STRIPE") {
        if (!config.secretKey) {
            throw new Error("STRIPE_SECRET_KEY_NOT_CONFIGURED");
        }
        return new stripe_gateway_1.StripeGateway(config.secretKey, config.webhookSecret || undefined);
    }
    throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
}
async function createStripePaymentSheetSession(input) {
    const booking = await prisma_1.prisma.booking.findFirst({
        where: { id: input.bookingId, userId: input.userId },
    });
    if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
    }
    if (booking.status !== "PENDING") {
        throw new Error("BOOKING_NOT_PAYABLE");
    }
    if (booking.paymentStatus === "SUCCEEDED") {
        throw new Error("BOOKING_ALREADY_PAID");
    }
    const [settings, gatewayConfig] = await Promise.all([
        getPaymentSettings(),
        getActiveRuntimeGatewayConfig(),
    ]);
    if (!gatewayConfig.publishableKey) {
        throw new Error("PAYMENT_PUBLISHABLE_KEY_NOT_CONFIGURED");
    }
    const gateway = buildGateway(gatewayConfig);
    const result = await gateway.createPaymentIntent({
        amount: toMinorUnit(booking.totalPrice),
        currency: (booking.currency || settings.defaultCurrency).toLowerCase(),
        metadata: {
            bookingId: booking.id,
            userId: booking.userId,
        },
    });
    await prisma_1.prisma.booking.update({
        where: { id: booking.id },
        data: {
            paymentProvider: result.provider,
            paymentStatus: result.status,
            paymentReference: result.reference,
            paymentError: null,
            currency: (booking.currency || settings.defaultCurrency).toLowerCase(),
        },
    });
    return {
        provider: result.provider,
        bookingId: booking.id,
        amount: toMinorUnit(booking.totalPrice),
        currency: (booking.currency || settings.defaultCurrency).toLowerCase(),
        paymentIntentClientSecret: result.clientSecret,
        publishableKey: gatewayConfig.publishableKey,
        merchantDisplayName: gatewayConfig.merchantDisplayName || "SureRide",
        allowsDelayedPaymentMethods: settings.allowDelayedPaymentMethods,
        mode: gatewayConfig.mode,
    };
}
function buildWebhookUpdate(event) {
    const data = {
        paymentProvider: event.provider,
        paymentStatus: event.status,
        paymentReference: event.reference,
        paymentError: event.errorMessage ?? null,
    };
    if (event.status === "SUCCEEDED") {
        data.status = "CONFIRMED";
        data.paidAt = new Date();
    }
    return data;
}
async function handlePaymentWebhook(providerRaw, payload, signature) {
    const provider = normalizeProvider(providerRaw);
    const gatewayConfig = await getRuntimeGatewayConfigByProvider(provider);
    const gateway = buildGateway(gatewayConfig);
    const event = gateway.parseWebhook(payload, signature);
    if (!event) {
        return { processed: false };
    }
    const bookingId = event.metadata?.bookingId;
    const booking = await prisma_1.prisma.booking.findFirst({
        where: {
            OR: [
                { paymentReference: event.reference },
                ...(bookingId ? [{ id: bookingId }] : []),
            ],
        },
    });
    if (!booking) {
        return { processed: false, ignored: "BOOKING_NOT_FOUND" };
    }
    await prisma_1.prisma.booking.update({
        where: { id: booking.id },
        data: buildWebhookUpdate(event),
    });
    return {
        processed: true,
        bookingId: booking.id,
        paymentStatus: event.status,
        eventType: event.eventType,
    };
}
async function getClientPaymentConfig() {
    const [settings, gatewayConfig] = await Promise.all([
        getPaymentSettings(),
        getActiveRuntimeGatewayConfig(),
    ]);
    if (!gatewayConfig.publishableKey) {
        throw new Error("PAYMENT_PUBLISHABLE_KEY_NOT_CONFIGURED");
    }
    return {
        provider: gatewayConfig.provider,
        publishableKey: gatewayConfig.publishableKey,
        merchantDisplayName: gatewayConfig.merchantDisplayName || "SureRide",
        allowsDelayedPaymentMethods: settings.allowDelayedPaymentMethods,
        defaultCurrency: settings.defaultCurrency,
        mode: gatewayConfig.mode,
    };
}
