import { PaymentProvider, PaymentStatus } from "@prisma/client";

export type CreatePaymentIntentInput = {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
};

export type CreatePaymentIntentResult = {
  provider: PaymentProvider;
  reference: string;
  clientSecret: string;
  status: PaymentStatus;
};

export type NormalizedWebhookEvent = {
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  eventType: string;
  metadata?: Record<string, string>;
  errorMessage?: string;
};

export interface PaymentGateway {
  provider: PaymentProvider;
  createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult>;
  parseWebhook(
    payload: Buffer,
    signature: string,
  ): NormalizedWebhookEvent | null;
}
