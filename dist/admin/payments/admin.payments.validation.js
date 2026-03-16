"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPaymentTransactionsQuerySchema = exports.updatePaymentSettingsSchema = exports.togglePaymentGatewaySchema = exports.updatePaymentGatewaySchema = exports.createPaymentGatewaySchema = exports.paymentGatewayProviderParamSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const isoCurrencyCode = zod_1.z.string().regex(/^[A-Za-z]{3}$/).transform((v) => v.toLowerCase());
exports.paymentGatewayProviderParamSchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(client_1.PaymentProvider),
});
exports.createPaymentGatewaySchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(client_1.PaymentProvider),
    displayName: zod_1.z.string().min(1).optional(),
    mode: zod_1.z.nativeEnum(client_1.PaymentMode).optional(),
    isEnabled: zod_1.z.boolean().optional(),
    isDefault: zod_1.z.boolean().optional(),
    publishableKey: zod_1.z.string().min(1).optional(),
    secretKey: zod_1.z.string().min(1).optional(),
    webhookSecret: zod_1.z.string().min(1).optional(),
    merchantDisplayName: zod_1.z.string().min(1).optional(),
    supportedCurrencies: zod_1.z.array(isoCurrencyCode).optional(),
    options: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.updatePaymentGatewaySchema = zod_1.z
    .object({
    displayName: zod_1.z.string().min(1).optional(),
    mode: zod_1.z.nativeEnum(client_1.PaymentMode).optional(),
    isEnabled: zod_1.z.boolean().optional(),
    isDefault: zod_1.z.boolean().optional(),
    publishableKey: zod_1.z.string().min(1).optional(),
    secretKey: zod_1.z.string().min(1).optional(),
    webhookSecret: zod_1.z.string().min(1).optional(),
    merchantDisplayName: zod_1.z.string().min(1).optional(),
    supportedCurrencies: zod_1.z.array(isoCurrencyCode).optional(),
    options: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
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
    status: zod_1.z.nativeEnum(client_1.PaymentStatus).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
