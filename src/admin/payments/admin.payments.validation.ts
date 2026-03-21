import {
  PaymentFieldType,
  PaymentGatewayRuntimeAdapter,
  PaymentMode,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { z } from "zod";

const slugRegex = /^[a-z0-9-]{2,40}$/;
const fieldKeyRegex = /^[a-z0-9_-]{2,60}$/;
const isoCurrencyCode = z
  .string()
  .regex(/^[A-Za-z]{3}$/)
  .transform((v) => v.toLowerCase());

function ensureUniqueByKey<T extends { key: string }>(
  items: T[],
  path: string,
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const key = items[i].key;
    if (seen.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path, i, "key"],
        message: "Duplicate key",
      });
      continue;
    }
    seen.add(key);
  }
}

const gatewayFieldSchema = z.object({
  key: z.string().regex(fieldKeyRegex),
  label: z.string().min(1),
  type: z.nativeEnum(PaymentFieldType).default("TEXT"),
  isRequired: z.boolean().optional().default(false),
  isSecret: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.string().optional(),
  validationRegex: z.string().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

const gatewayValueSchema = z.object({
  fieldKey: z.string().regex(fieldKeyRegex),
  value: z.string(),
});

export const paymentGatewayKeyParamSchema = z.object({
  key: z
    .string()
    .regex(slugRegex)
    .transform((v) => v.toLowerCase()),
});

export const createPaymentGatewaySchema = z
  .object({
    key: z
      .string()
      .regex(slugRegex)
      .transform((v) => v.toLowerCase()),
    displayName: z.string().min(1),
    logoUrl: z.string().url().optional(),
    runtimeAdapter: z
      .nativeEnum(PaymentGatewayRuntimeAdapter)
      .optional()
      .default("CUSTOM"),
    mode: z.nativeEnum(PaymentMode).optional().default("TEST"),
    isEnabled: z.boolean().optional().default(false),
    isDefault: z.boolean().optional().default(false),
    merchantDisplayName: z.string().min(1).optional(),
    supportedCurrencies: z.array(isoCurrencyCode).optional().default([]),
    metadata: z.record(z.string(), z.unknown()).optional(),
    fields: z.array(gatewayFieldSchema).optional().default([]),
    values: z.array(gatewayValueSchema).optional().default([]),
  })
  .superRefine((value, ctx) => {
    ensureUniqueByKey(value.fields, "fields", ctx);
  });

export const updatePaymentGatewaySchema = z
  .object({
    displayName: z.string().min(1).optional(),
    logoUrl: z.string().url().optional().nullable(),
    runtimeAdapter: z.nativeEnum(PaymentGatewayRuntimeAdapter).optional(),
    mode: z.nativeEnum(PaymentMode).optional(),
    merchantDisplayName: z.string().min(1).optional().nullable(),
    supportedCurrencies: z.array(isoCurrencyCode).optional(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const replacePaymentGatewayFieldsSchema = z
  .object({
    fields: z.array(gatewayFieldSchema),
  })
  .superRefine((value, ctx) => {
    ensureUniqueByKey(value.fields, "fields", ctx);
  });

export const replacePaymentGatewayValuesSchema = z.object({
  values: z.array(gatewayValueSchema),
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
  gatewayKey: z
    .string()
    .regex(slugRegex)
    .transform((v) => v.toLowerCase())
    .optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
