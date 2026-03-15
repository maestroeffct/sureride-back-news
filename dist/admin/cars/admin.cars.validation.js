"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeactivateSchema = exports.adminUnflagSchema = exports.adminFlagSchema = exports.adminRejectSchema = exports.adminApproveSchema = exports.adminUpdateCarSchema = exports.adminCreateCarSchema = exports.adminCarListQuerySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.adminCarListQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.CarStatus).optional(),
    providerId: zod_1.z.string().uuid().optional(),
    city: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
});
exports.adminCreateCarSchema = zod_1.z.object({
    providerId: zod_1.z.string().uuid(),
    locationId: zod_1.z.string().uuid(),
    brand: zod_1.z.string().min(1),
    model: zod_1.z.string().min(1),
    category: zod_1.z.nativeEnum(client_1.CarCategory),
    year: zod_1.z.coerce
        .number()
        .int()
        .min(1990)
        .max(new Date().getFullYear() + 1),
    seats: zod_1.z.coerce.number().int().min(1).max(30),
    bags: zod_1.z.string().min(1), // keep as string since your schema uses String
    hasAC: zod_1.z.coerce.boolean(),
    transmission: zod_1.z.nativeEnum(client_1.Transmission),
    mileagePolicy: zod_1.z.nativeEnum(client_1.MileagePolicy),
    dailyRate: zod_1.z.coerce.number().positive(),
    hourlyRate: zod_1.z.coerce.number().positive().optional().nullable(),
    // Admin-only behavior
    autoApprove: zod_1.z.coerce.boolean().optional().default(false),
    note: zod_1.z.string().optional(),
});
exports.adminUpdateCarSchema = zod_1.z.object({
    locationId: zod_1.z.string().uuid().optional(),
    brand: zod_1.z.string().min(1).optional(),
    model: zod_1.z.string().min(1).optional(),
    category: zod_1.z.nativeEnum(client_1.CarCategory).optional(),
    year: zod_1.z.coerce
        .number()
        .int()
        .min(1990)
        .max(new Date().getFullYear() + 1)
        .optional(),
    seats: zod_1.z.coerce.number().int().min(1).max(30).optional(),
    bags: zod_1.z.string().min(1).optional(),
    hasAC: zod_1.z.coerce.boolean().optional(),
    transmission: zod_1.z.nativeEnum(client_1.Transmission).optional(),
    mileagePolicy: zod_1.z.nativeEnum(client_1.MileagePolicy).optional(),
    dailyRate: zod_1.z.coerce.number().positive().optional(),
    hourlyRate: zod_1.z.coerce.number().positive().optional().nullable(),
    // Admin can optionally change moderation fields
    status: zod_1.z.nativeEnum(client_1.CarStatus).optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    moderationNote: zod_1.z.string().optional().nullable(),
    flaggedReason: zod_1.z.string().optional().nullable(),
});
exports.adminApproveSchema = zod_1.z.object({
    note: zod_1.z.string().optional(),
});
exports.adminRejectSchema = zod_1.z.object({
    reason: zod_1.z.string().min(2),
});
exports.adminFlagSchema = zod_1.z.object({
    reason: zod_1.z.string().min(2),
});
exports.adminUnflagSchema = zod_1.z.object({
    note: zod_1.z.string().optional(),
});
exports.adminDeactivateSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
