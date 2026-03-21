"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPaymentTransactionsQuerySchema = exports.updatePaymentSettingsSchema = exports.togglePaymentGatewaySchema = exports.replacePaymentGatewayValuesSchema = exports.replacePaymentGatewayFieldsSchema = exports.updatePaymentGatewaySchema = exports.createPaymentGatewaySchema = exports.paymentGatewayKeyParamSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const slugRegex = /^[a-z0-9-]{2,40}$/;
const fieldKeyRegex = /^[a-z0-9_-]{2,60}$/;
const isoCurrencyCode = zod_1.z
    .string()
    .regex(/^[A-Za-z]{3}$/)
    .transform((v) => v.toLowerCase());
function ensureUniqueByKey(items, path, ctx) {
    const seen = new Set();
    for (let i = 0; i < items.length; i++) {
        const key = items[i].key;
        if (seen.has(key)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: [path, i, "key"],
                message: "Duplicate key",
            });
            continue;
        }
        seen.add(key);
    }
}
const gatewayFieldSchema = zod_1.z.object({
    key: zod_1.z.string().regex(fieldKeyRegex),
    label: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(client_1.PaymentFieldType).default("TEXT"),
    isRequired: zod_1.z.boolean().optional().default(false),
    isSecret: zod_1.z.boolean().optional().default(false),
    sortOrder: zod_1.z.number().int().optional().default(0),
    placeholder: zod_1.z.string().optional(),
    helpText: zod_1.z.string().optional(),
    defaultValue: zod_1.z.string().optional(),
    validationRegex: zod_1.z.string().optional(),
    options: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
const gatewayValueSchema = zod_1.z.object({
    fieldKey: zod_1.z.string().regex(fieldKeyRegex),
    value: zod_1.z.string(),
});
exports.paymentGatewayKeyParamSchema = zod_1.z.object({
    key: zod_1.z
        .string()
        .regex(slugRegex)
        .transform((v) => v.toLowerCase()),
});
exports.createPaymentGatewaySchema = zod_1.z
    .object({
    key: zod_1.z
        .string()
        .regex(slugRegex)
        .transform((v) => v.toLowerCase()),
    displayName: zod_1.z.string().min(1),
    logoUrl: zod_1.z.string().url().optional(),
    runtimeAdapter: zod_1.z
        .nativeEnum(client_1.PaymentGatewayRuntimeAdapter)
        .optional()
        .default("CUSTOM"),
    mode: zod_1.z.nativeEnum(client_1.PaymentMode).optional().default("TEST"),
    isEnabled: zod_1.z.boolean().optional().default(false),
    isDefault: zod_1.z.boolean().optional().default(false),
    merchantDisplayName: zod_1.z.string().min(1).optional(),
    supportedCurrencies: zod_1.z.array(isoCurrencyCode).optional().default([]),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    fields: zod_1.z.array(gatewayFieldSchema).optional().default([]),
    values: zod_1.z.array(gatewayValueSchema).optional().default([]),
})
    .superRefine((value, ctx) => {
    ensureUniqueByKey(value.fields, "fields", ctx);
});
exports.updatePaymentGatewaySchema = zod_1.z
    .object({
    displayName: zod_1.z.string().min(1).optional(),
    logoUrl: zod_1.z.string().url().optional().nullable(),
    runtimeAdapter: zod_1.z.nativeEnum(client_1.PaymentGatewayRuntimeAdapter).optional(),
    mode: zod_1.z.nativeEnum(client_1.PaymentMode).optional(),
    merchantDisplayName: zod_1.z.string().min(1).optional().nullable(),
    supportedCurrencies: zod_1.z.array(isoCurrencyCode).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().nullable(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});
exports.replacePaymentGatewayFieldsSchema = zod_1.z
    .object({
    fields: zod_1.z.array(gatewayFieldSchema),
})
    .superRefine((value, ctx) => {
    ensureUniqueByKey(value.fields, "fields", ctx);
});
exports.replacePaymentGatewayValuesSchema = zod_1.z.object({
    values: zod_1.z.array(gatewayValueSchema),
});
exports.togglePaymentGatewaySchema = zod_1.z.object({
    isEnabled: zod_1.z.boolean(),
});
exports.updatePaymentSettingsSchema = zod_1.z
    .object({
    defaultCurrency: isoCurrencyCode.optional(),
    allowDelayedPaymentMethods: zod_1.z.boolean().optional(),
    bookingAutoCancelMinutes: zod_1.z.number().int().min(1).max(24 * 60).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one settings field is required",
});
exports.listPaymentTransactionsQuerySchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(client_1.PaymentProvider).optional(),
    gatewayKey: zod_1.z
        .string()
        .regex(slugRegex)
        .transform((v) => v.toLowerCase())
        .optional(),
    status: zod_1.z.nativeEnum(client_1.PaymentStatus).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
