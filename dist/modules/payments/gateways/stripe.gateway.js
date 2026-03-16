"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeGateway = void 0;
const stripe_1 = __importDefault(require("stripe"));
function mapStripeStatus(status) {
    if (status === "succeeded") {
        return "SUCCEEDED";
    }
    if (status === "processing") {
        return "PROCESSING";
    }
    if (status === "canceled") {
        return "CANCELED";
    }
    return "REQUIRES_ACTION";
}
class StripeGateway {
    constructor(secretKey, webhookSecret) {
        this.provider = "STRIPE";
        this.stripe = new stripe_1.default(secretKey);
        this.webhookSecret = webhookSecret;
    }
    async createPaymentIntent(input) {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: input.amount,
            currency: input.currency,
            automatic_payment_methods: { enabled: true },
            metadata: input.metadata,
        });
        if (!paymentIntent.client_secret) {
            throw new Error("PAYMENT_INTENT_CLIENT_SECRET_MISSING");
        }
        return {
            provider: this.provider,
            reference: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: mapStripeStatus(paymentIntent.status),
        };
    }
    parseWebhook(payload, signature) {
        if (!this.webhookSecret) {
            throw new Error("STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED");
        }
        const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
        if (!event.type.startsWith("payment_intent.")) {
            return null;
        }
        const paymentIntent = event.data.object;
        const metadata = (paymentIntent.metadata ?? {});
        if (event.type === "payment_intent.succeeded") {
            return {
                provider: this.provider,
                reference: paymentIntent.id,
                status: "SUCCEEDED",
                eventType: event.type,
                metadata,
            };
        }
        if (event.type === "payment_intent.processing") {
            return {
                provider: this.provider,
                reference: paymentIntent.id,
                status: "PROCESSING",
                eventType: event.type,
                metadata,
            };
        }
        if (event.type === "payment_intent.payment_failed") {
            return {
                provider: this.provider,
                reference: paymentIntent.id,
                status: "FAILED",
                eventType: event.type,
                metadata,
                errorMessage: paymentIntent.last_payment_error?.message,
            };
        }
        if (event.type === "payment_intent.canceled") {
            return {
                provider: this.provider,
                reference: paymentIntent.id,
                status: "CANCELED",
                eventType: event.type,
                metadata,
            };
        }
        return null;
    }
}
exports.StripeGateway = StripeGateway;
