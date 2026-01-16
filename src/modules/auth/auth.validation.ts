import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),

  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),

  password: z.string().min(6),

  phone: z.string().regex(/^\+\d{7,15}$/, "Invalid phone number"),

  country: z.string().min(1),

  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth"),
});
