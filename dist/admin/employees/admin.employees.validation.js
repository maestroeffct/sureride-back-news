"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmployeeSchema = exports.updateEmployeeStatusSchema = exports.resetEmployeePasswordSchema = exports.assignEmployeeRoleSchema = exports.listEmployeesQuerySchema = exports.updateEmployeeRoleSchema = exports.createEmployeeRoleSchema = exports.employeeParamSchema = exports.employeeRoleParamSchema = void 0;
const zod_1 = require("zod");
const admin_employees_constants_1 = require("./admin.employees.constants");
const permissionSchema = zod_1.z.enum(admin_employees_constants_1.EMPLOYEE_PERMISSION_VALUES);
const singleString = zod_1.z.preprocess((value) => {
    if (Array.isArray(value))
        return value[0];
    return value;
}, zod_1.z.string().min(1));
const optionalSingleString = zod_1.z.preprocess((value) => {
    if (Array.isArray(value))
        return value[0];
    return value;
}, zod_1.z.string().min(1).optional());
const optionalBooleanQuery = zod_1.z.preprocess((value) => (Array.isArray(value) ? value[0] : value), zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.enum(["true", "false"])])
    .transform((value) => (typeof value === "boolean" ? value : value === "true"))
    .optional());
exports.employeeRoleParamSchema = zod_1.z.object({
    roleId: singleString,
});
exports.employeeParamSchema = zod_1.z.object({
    employeeId: singleString,
});
exports.createEmployeeRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().trim().optional(),
    permissions: zod_1.z.array(permissionSchema).min(1),
});
exports.updateEmployeeRoleSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().trim().optional().nullable(),
    permissions: zod_1.z.array(permissionSchema).min(1).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});
exports.listEmployeesQuerySchema = zod_1.z.object({
    q: optionalSingleString,
    isActive: optionalBooleanQuery,
    roleId: optionalSingleString,
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(100),
});
exports.assignEmployeeRoleSchema = zod_1.z.object({
    roleId: zod_1.z.string().min(1),
});
exports.resetEmployeePasswordSchema = zod_1.z.object({
    sendEmail: zod_1.z.boolean().optional().default(true),
});
exports.updateEmployeeStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
exports.createEmployeeSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z
        .string()
        .email()
        .transform((value) => value.toLowerCase()),
    phoneCountry: zod_1.z.string().regex(/^\+\d{1,4}$/),
    phoneNumber: zod_1.z.string().regex(/^\d{6,15}$/),
    nationality: zod_1.z.string().min(1),
    dateOfBirth: zod_1.z.coerce.date(),
    password: zod_1.z.string().min(8).optional(),
    roleId: zod_1.z.string().min(1),
    sendInvite: zod_1.z.boolean().optional().default(true),
})
    .superRefine((value, ctx) => {
    if (!value.password && value.sendInvite === false) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["password"],
            message: "password is required when sendInvite is false",
        });
    }
});
