import { PaymentProvider, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";
import {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  NormalizedWebhookEvent,
  PaymentGateway,
} from "./payment-gateway";

function mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
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

export class StripeGateway implements PaymentGateway {
  provider: PaymentProvider = "STRIPE";

  private stripe: Stripe;
  private webhookSecret?: string;

  constructor(secretKey: string, webhookSecret?: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult> {
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

  parseWebhook(payload: Buffer, signature: string): NormalizedWebhookEvent | null {
    if (!this.webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED");
    }

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );

    if (!event.type.startsWith("payment_intent.")) {
      return null;
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = (paymentIntent.metadata ?? {}) as Record<string, string>;

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
