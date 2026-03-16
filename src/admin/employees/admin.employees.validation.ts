import { z } from "zod";
import { EMPLOYEE_PERMISSION_VALUES } from "./admin.employees.constants";

const permissionSchema = z.enum(EMPLOYEE_PERMISSION_VALUES);

const singleString = z.preprocess((value) => {
  if (Array.isArray(value)) return value[0];
  return value;
}, z.string().min(1));

const optionalSingleString = z.preprocess((value) => {
  if (Array.isArray(value)) return value[0];
  return value;
}, z.string().min(1).optional());

const optionalBooleanQuery = z.preprocess(
  (value) => (Array.isArray(value) ? value[0] : value),
  z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => (typeof value === "boolean" ? value : value === "true"))
    .optional(),
);

export const employeeRoleParamSchema = z.object({
  roleId: singleString,
});

export const employeeParamSchema = z.object({
  employeeId: singleString,
});

export const createEmployeeRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().trim().optional(),
  permissions: z.array(permissionSchema).min(1),
});

export const updateEmployeeRoleSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().trim().optional().nullable(),
    permissions: z.array(permissionSchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listEmployeesQuerySchema = z.object({
  q: optionalSingleString,
  isActive: optionalBooleanQuery,
  roleId: optionalSingleString,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export const assignEmployeeRoleSchema = z.object({
  roleId: z.string().min(1),
});

export const resetEmployeePasswordSchema = z.object({
  sendEmail: z.boolean().optional().default(true),
});

export const updateEmployeeStatusSchema = z.object({
  isActive: z.boolean(),
});

export const createEmployeeSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z
      .string()
      .email()
      .transform((value) => value.toLowerCase()),
    phoneCountry: z.string().regex(/^\+\d{1,4}$/),
    phoneNumber: z.string().regex(/^\d{6,15}$/),
    nationality: z.string().min(1),
    dateOfBirth: z.coerce.date(),
    password: z.string().min(8).optional(),
    roleId: z.string().min(1),
    sendInvite: z.boolean().optional().default(true),
  })
  .superRefine((value, ctx) => {
    if (!value.password && value.sendInvite === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "password is required when sendInvite is false",
      });
    }
  });
