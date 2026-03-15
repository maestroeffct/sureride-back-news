import { z } from "zod";
import { ProfileStatus } from "@prisma/client";

export const adminUsersQuerySchema = z.object({
  q: z.string().optional(),
  profileStatus: z.nativeEnum(ProfileStatus).optional(),
  isVerified: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),

  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const adminUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const adminCreateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(6).optional(),
  phoneCountry: z.string().regex(/^\+\d{1,4}$/),
  phoneNumber: z.string().regex(/^\d{6,15}$/),
  dateOfBirth: z.coerce.date(),
  nationality: z.string().min(1),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  profileStatus: z.nativeEnum(ProfileStatus).optional(),
  sendInvite: z.boolean().default(true),
}).superRefine((value, ctx) => {
  if (!value.password && value.sendInvite === false) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "password is required when sendInvite is false",
    });
  }
});

export const adminVerificationSchema = z.object({
  isVerified: z.boolean(),
  profileStatus: z.nativeEnum(ProfileStatus).optional(),
});

export const adminProfileStatusSchema = z.object({
  profileStatus: z.nativeEnum(ProfileStatus),
});

export const adminRejectKycSchema = z.object({
  reason: z.string().min(2),
});
