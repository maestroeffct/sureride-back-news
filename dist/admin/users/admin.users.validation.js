"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRejectKycSchema = exports.adminProfileStatusSchema = exports.adminVerificationSchema = exports.adminCreateUserSchema = exports.adminUserStatusSchema = exports.adminUsersQuerySchema = void 0;
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
exports.adminCreateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
    password: zod_1.z.string().min(6).optional(),
    phoneCountry: zod_1.z.string().regex(/^\+\d{1,4}$/),
    phoneNumber: zod_1.z.string().regex(/^\d{6,15}$/),
    dateOfBirth: zod_1.z.coerce.date(),
    nationality: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().optional(),
    isVerified: zod_1.z.boolean().optional(),
    profileStatus: zod_1.z.nativeEnum(client_1.ProfileStatus).optional(),
    sendInvite: zod_1.z.boolean().default(true),
}).superRefine((value, ctx) => {
    if (!value.password && value.sendInvite === false) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["password"],
            message: "password is required when sendInvite is false",
        });
    }
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
