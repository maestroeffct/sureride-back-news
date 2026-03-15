"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    phoneCountry: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.coerce.date().optional(),
    nationality: zod_1.z.string().optional(),
});
exports.updatePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6),
});
