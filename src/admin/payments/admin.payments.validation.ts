import { PaymentMode, PaymentProvider, PaymentStatus } from "@prisma/client";
import { z } from "zod";

const isoCurrencyCode = z.string().regex(/^[A-Za-z]{3}$/).transform((v) => v.toLowerCase());

export const paymentGatewayProviderParamSchema = z.object({
  provider: z.nativeEnum(PaymentProvider),
});

export const createPaymentGatewaySchema = z.object({
  provider: z.nativeEnum(PaymentProvider),
  displayName: z.string().min(1).optional(),
  mode: z.nativeEnum(PaymentMode).optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  publishableKey: z.string().min(1).optional(),
  secretKey: z.string().min(1).optional(),
  webhookSecret: z.string().min(1).optional(),
  merchantDisplayName: z.string().min(1).optional(),
  supportedCurrencies: z.array(isoCurrencyCode).optional(),
  options: z.record(z.string(), z.any()).optional(),
});

export const updatePaymentGatewaySchema = z
  .object({
    displayName: z.string().min(1).optional(),
    mode: z.nativeEnum(PaymentMode).optional(),
    isEnabled: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    publishableKey: z.string().min(1).optional(),
    secretKey: z.string().min(1).optional(),
    webhookSecret: z.string().min(1).optional(),
    merchantDisplayName: z.string().min(1).optional(),
    supportedCurrencies: z.array(isoCurrencyCode).optional(),
    options: z.record(z.string(), z.any()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const togglePaymentGatewaySchema = z.object({
  isEnabled: z.boolean(),
});

export const updatePaymentSettingsSchema = z
  .object({
    defaultCurrency: isoCurrencyCode.optional(),
    allowDelayedPaymentMethods: z.boolean().optional(),
    bookingAutoCancelMinutes: z.number().int().min(1).max(24 * 60).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one settings field is required",
  });

export const listPaymentTransactionsQuerySchema = z.object({
  provider: z.nativeEnum(PaymentProvider).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
