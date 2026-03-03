"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripePaymentSheetSession = createStripePaymentSheetSession;
exports.handleStripeWebhook = handleStripeWebhook;
exports.getStripeConfig = getStripeConfig;
const prisma_1 = require("../../prisma");
const stripe_gateway_1 = require("./gateways/stripe.gateway");
function getStripeGateway() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY_NOT_CONFIGURED");
    }
    if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED");
    }
    return new stripe_gateway_1.StripeGateway(secretKey, webhookSecret);
}
function toMinorUnit(amount) {
    return Math.round(amount * 100);
}
async function createStripePaymentSheetSession(input) {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
        throw new Error("STRIPE_PUBLISHABLE_KEY_NOT_CONFIGURED");
    }
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
    const gateway = getStripeGateway();
    const result = await gateway.createPaymentIntent({
        amount: toMinorUnit(booking.totalPrice),
        currency: booking.currency,
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
            currency: booking.currency,
        },
    });
    return {
        provider: result.provider,
        bookingId: booking.id,
        amount: toMinorUnit(booking.totalPrice),
        currency: booking.currency,
        paymentIntentClientSecret: result.clientSecret,
        publishableKey,
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
async function handleStripeWebhook(payload, signature) {
    const gateway = getStripeGateway();
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
function getStripeConfig() {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
        throw new Error("STRIPE_PUBLISHABLE_KEY_NOT_CONFIGURED");
    }
    return {
        provider: "STRIPE",
        publishableKey,
        merchantDisplayName: process.env.STRIPE_MERCHANT_NAME || "SureRide",
    };
}
