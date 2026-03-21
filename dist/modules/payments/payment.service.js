"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSheetSession = createPaymentSheetSession;
exports.handlePaymentWebhook = handlePaymentWebhook;
exports.getClientPaymentConfig = getClientPaymentConfig;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const stripe_gateway_1 = require("./gateways/stripe.gateway");
const payment_secrets_1 = require("./payment-secrets");
const IMPLEMENTED_RUNTIME_ADAPTERS = new Set([
    "STRIPE",
]);
function isRuntimeImplemented(adapter) {
    return IMPLEMENTED_RUNTIME_ADAPTERS.has(adapter);
}
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
function runtimeAdapterFromProvider(provider) {
    if (provider === "STRIPE")
        return "STRIPE";
    if (provider === "PAYSTACK")
        return "PAYSTACK";
    if (provider === "FLUTTERWAVE")
        return "FLUTTERWAVE";
    return "CUSTOM";
}
function providerFromRuntimeAdapter(runtimeAdapter) {
    if (runtimeAdapter === "STRIPE")
        return "STRIPE";
    if (runtimeAdapter === "PAYSTACK")
        return "PAYSTACK";
    if (runtimeAdapter === "FLUTTERWAVE")
        return "FLUTTERWAVE";
    throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
}
function valueMap(gateway) {
    const map = new Map();
    for (const value of gateway.values) {
        const decrypted = value.valueEncrypted
            ? (0, payment_secrets_1.decryptSecret)(value.valueEncrypted)
            : value.valuePlain;
        if (decrypted && decrypted.trim()) {
            map.set(value.field.key, decrypted.trim());
        }
    }
    for (const field of gateway.fields) {
        if (!map.has(field.key) && field.defaultValue?.trim()) {
            map.set(field.key, field.defaultValue.trim());
        }
    }
    return map;
}
function getStripeKeys(values) {
    const publishableKey = values.get("publishable_key") || values.get("public_key");
    const secretKey = values.get("secret_key");
    const webhookSecret = values.get("webhook_secret") || null;
    return { publishableKey: publishableKey || null, secretKey: secretKey || null, webhookSecret };
}
function toRuntimeConfig(gateway) {
    if (!isRuntimeImplemented(gateway.runtimeAdapter)) {
        throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
    }
    const values = valueMap(gateway);
    if (gateway.runtimeAdapter === "STRIPE") {
        const { publishableKey, secretKey, webhookSecret } = getStripeKeys(values);
        if (!publishableKey || !secretKey) {
            throw new Error("GATEWAY_REQUIRED_VALUES_MISSING");
        }
        return {
            gatewayKey: gateway.key,
            runtimeAdapter: gateway.runtimeAdapter,
            provider: "STRIPE",
            mode: gateway.mode,
            publishableKey,
            secretKey,
            webhookSecret,
            merchantDisplayName: gateway.merchantDisplayName,
        };
    }
    throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
}
function buildStripeEnvConfig() {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
        return null;
    }
    return {
        gatewayKey: "stripe",
        runtimeAdapter: "STRIPE",
        provider: "STRIPE",
        mode: "TEST",
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        merchantDisplayName: process.env.STRIPE_MERCHANT_NAME || "SureRide",
    };
}
function buildGateway(config) {
    if (config.provider === "STRIPE") {
        if (!config.secretKey) {
            throw new Error("GATEWAY_REQUIRED_VALUES_MISSING");
        }
        return new stripe_gateway_1.StripeGateway(config.secretKey, config.webhookSecret || undefined);
    }
    throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
}
async function getPaymentSettings() {
    return prisma_1.prisma.paymentSettings.upsert({
        where: { id: "GLOBAL" },
        update: {},
        create: { id: "GLOBAL" },
    });
}
async function findEnabledGatewayByKey(key) {
    return prisma_1.prisma.paymentGateway.findFirst({
        where: {
            key,
            isArchived: false,
        },
        include: {
            fields: true,
            values: {
                include: { field: true },
            },
        },
    });
}
async function getDefaultOrEnabledGateway() {
    return ((await prisma_1.prisma.paymentGateway.findFirst({
        where: { isArchived: false, isEnabled: true, isDefault: true },
        include: {
            fields: true,
            values: { include: { field: true } },
        },
    })) ||
        (await prisma_1.prisma.paymentGateway.findFirst({
            where: { isArchived: false, isEnabled: true },
            orderBy: { updatedAt: "desc" },
            include: {
                fields: true,
                values: { include: { field: true } },
            },
        })));
}
async function getGatewayForCheckout(gatewayKey) {
    if (gatewayKey) {
        const gateway = await findEnabledGatewayByKey(gatewayKey);
        if (!gateway)
            throw new Error("GATEWAY_NOT_FOUND");
        if (!gateway.isEnabled)
            throw new Error("GATEWAY_NOT_ENABLED");
        return gateway;
    }
    const active = await getDefaultOrEnabledGateway();
    if (!active)
        throw new Error("GATEWAY_NOT_FOUND");
    return active;
}
async function getRuntimeGatewayConfigByProvider(provider) {
    const runtimeAdapter = runtimeAdapterFromProvider(provider);
    if (!isRuntimeImplemented(runtimeAdapter)) {
        throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
    }
    const gateway = await prisma_1.prisma.paymentGateway.findFirst({
        where: {
            isArchived: false,
            isEnabled: true,
            runtimeAdapter,
        },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        include: {
            fields: true,
            values: {
                include: { field: true },
            },
        },
    });
    if (gateway)
        return toRuntimeConfig(gateway);
    if (provider === "STRIPE") {
        const env = buildStripeEnvConfig();
        if (env)
            return env;
    }
    throw new Error("GATEWAY_NOT_FOUND");
}
function buildWebhookUpdate(event, gatewayKey) {
    const data = {
        paymentProvider: event.provider,
        paymentStatus: event.status,
        paymentReference: event.reference,
        paymentError: event.errorMessage ?? null,
        paymentGatewayKey: gatewayKey ?? undefined,
    };
    if (event.status === "SUCCEEDED") {
        data.status = "CONFIRMED";
        data.paidAt = new Date();
    }
    return data;
}
async function createPaymentSheetSession(input) {
    const booking = await prisma_1.prisma.booking.findFirst({
        where: { id: input.bookingId, userId: input.userId },
    });
    if (!booking)
        throw new Error("BOOKING_NOT_FOUND");
    if (booking.status !== "PENDING")
        throw new Error("BOOKING_NOT_PAYABLE");
    if (booking.paymentStatus === "SUCCEEDED")
        throw new Error("BOOKING_ALREADY_PAID");
    const [settings, selectedGateway] = await Promise.all([
        getPaymentSettings(),
        getGatewayForCheckout(input.gatewayKey),
    ]);
    if (!selectedGateway.isEnabled)
        throw new Error("GATEWAY_NOT_ENABLED");
    if (!isRuntimeImplemented(selectedGateway.runtimeAdapter)) {
        throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
    }
    const runtimeConfig = toRuntimeConfig(selectedGateway);
    const gateway = buildGateway(runtimeConfig);
    const result = await gateway.createPaymentIntent({
        amount: toMinorUnit(booking.totalPrice),
        currency: (booking.currency || settings.defaultCurrency).toLowerCase(),
        metadata: {
            bookingId: booking.id,
            userId: booking.userId,
            gatewayKey: selectedGateway.key,
        },
    });
    await prisma_1.prisma.booking.update({
        where: { id: booking.id },
        data: {
            paymentProvider: result.provider,
            paymentGatewayKey: selectedGateway.key,
            paymentStatus: result.status,
            paymentReference: result.reference,
            paymentError: null,
            currency: (booking.currency || settings.defaultCurrency).toLowerCase(),
        },
    });
    return {
        gatewayKey: selectedGateway.key,
        provider: result.provider,
        bookingId: booking.id,
        amount: toMinorUnit(booking.totalPrice),
        currency: (booking.currency || settings.defaultCurrency).toLowerCase(),
        paymentIntentClientSecret: result.clientSecret,
        publishableKey: runtimeConfig.publishableKey,
        merchantDisplayName: runtimeConfig.merchantDisplayName || "SureRide",
        allowsDelayedPaymentMethods: settings.allowDelayedPaymentMethods,
        mode: runtimeConfig.mode,
    };
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
        data: buildWebhookUpdate(event, gatewayConfig.gatewayKey || booking.paymentGatewayKey),
    });
    return {
        processed: true,
        bookingId: booking.id,
        paymentStatus: event.status,
        eventType: event.eventType,
    };
}
async function getClientPaymentConfig() {
    const [settings, gateway] = await Promise.all([
        getPaymentSettings(),
        getDefaultOrEnabledGateway(),
    ]);
    if (!gateway) {
        const envConfig = buildStripeEnvConfig();
        if (!envConfig) {
            throw new Error("GATEWAY_NOT_FOUND");
        }
        return {
            gatewayKey: envConfig.gatewayKey,
            displayName: "Stripe",
            logoUrl: null,
            runtimeAdapter: envConfig.runtimeAdapter,
            isRuntimeSupported: true,
            mode: envConfig.mode,
            supportedCurrencies: [],
            merchantDisplayName: envConfig.merchantDisplayName || "SureRide",
            publishableKey: envConfig.publishableKey,
            provider: envConfig.provider,
            allowsDelayedPaymentMethods: settings.allowDelayedPaymentMethods,
            defaultCurrency: settings.defaultCurrency,
        };
    }
    const runtimeSupported = isRuntimeImplemented(gateway.runtimeAdapter);
    const values = valueMap(gateway);
    const publishableKey = gateway.runtimeAdapter === "STRIPE"
        ? values.get("publishable_key") || values.get("public_key") || null
        : null;
    return {
        gatewayKey: gateway.key,
        displayName: gateway.displayName,
        logoUrl: gateway.logoUrl,
        runtimeAdapter: gateway.runtimeAdapter,
        isRuntimeSupported: runtimeSupported,
        mode: gateway.mode,
        supportedCurrencies: gateway.supportedCurrencies,
        merchantDisplayName: gateway.merchantDisplayName || "SureRide",
        publishableKey,
        provider: runtimeSupported
            ? providerFromRuntimeAdapter(gateway.runtimeAdapter)
            : null,
        allowsDelayedPaymentMethods: settings.allowDelayedPaymentMethods,
        defaultCurrency: settings.defaultCurrency,
    };
}
