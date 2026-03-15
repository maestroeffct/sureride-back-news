"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRejectKycSchema = exports.adminProfileStatusSchema = exports.adminVerificationSchema = exports.adminUserStatusSchema = exports.adminUsersQuerySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.adminUsersQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    profileStatus: zod_1.z.nativeEnum(client_1.ProfileStatus).optional(),
    isVerified: zod_1.z.coerce.boolean().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    page: zod_1.z.coerce.number().default(1),
    limit: zod_1.z.coerce.number().default(20),
});
exports.adminUserStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
exports.adminVerificationSchema = zod_1.z.object({
    isVerified: zod_1.z.boolean(),
    profileStatus: zod_1.z.nativeEnum(client_1.ProfileStatus).optional(),
});
exports.adminProfileStatusSchema = zod_1.z.object({
    profileStatus: zod_1.z.nativeEnum(client_1.ProfileStatus),
});
exports.adminRejectKycSchema = zod_1.z.object({
    reason: zod_1.z.string().min(2),
});
