import { z } from "zod";
import {
  CarCategory,
  Transmission,
  MileagePolicy,
  CarStatus,
} from "@prisma/client";

export const adminCarListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(CarStatus).optional(),
  providerId: z.string().uuid().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminCreateCarSchema = z.object({
  providerId: z.string().uuid(),
  locationId: z.string().uuid(),

  brand: z.string().min(1),
  model: z.string().min(1),
  category: z.nativeEnum(CarCategory),
  year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),

  seats: z.coerce.number().int().min(1).max(30),
  bags: z.string().min(1), // keep as string since your schema uses String
  hasAC: z.coerce.boolean(),
  transmission: z.nativeEnum(Transmission),
  mileagePolicy: z.nativeEnum(MileagePolicy),

  dailyRate: z.coerce.number().positive(),
  hourlyRate: z.coerce.number().positive().optional().nullable(),

  // Admin-only behavior
  autoApprove: z.coerce.boolean().optional().default(false),
  note: z.string().optional(),
});

export const adminUpdateCarSchema = z.object({
  locationId: z.string().uuid().optional(),

  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  category: z.nativeEnum(CarCategory).optional(),
  year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),

  seats: z.coerce.number().int().min(1).max(30).optional(),
  bags: z.string().min(1).optional(),
  hasAC: z.coerce.boolean().optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  mileagePolicy: z.nativeEnum(MileagePolicy).optional(),

  dailyRate: z.coerce.number().positive().optional(),
  hourlyRate: z.coerce.number().positive().optional().nullable(),

  // Admin can optionally change moderation fields
  status: z.nativeEnum(CarStatus).optional(),
  isActive: z.coerce.boolean().optional(),

  moderationNote: z.string().optional().nullable(),
  flaggedReason: z.string().optional().nullable(),
});

export const adminApproveSchema = z.object({
  note: z.string().optional(),
});

export const adminRejectSchema = z.object({
  reason: z.string().min(2),
});

export const adminFlagSchema = z.object({
  reason: z.string().min(2),
});

export const adminUnflagSchema = z.object({
  note: z.string().optional(),
});

export const adminDeactivateSchema = z.object({
  reason: z.string().optional(),
});
