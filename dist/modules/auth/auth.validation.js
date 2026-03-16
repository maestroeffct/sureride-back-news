"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeTemporaryPasswordSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().regex(/^\+\d{7,15}$/, "Invalid phone number"),
    country: zod_1.z.string().min(1),
    dob: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth"),
});
exports.changeTemporaryPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((v) => v.toLowerCase()),
    temporaryPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6),
});
