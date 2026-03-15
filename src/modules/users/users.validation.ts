import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),

  phoneCountry: z.string().optional(),
  phoneNumber: z.string().optional(),

  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});
