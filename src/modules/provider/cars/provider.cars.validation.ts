import { z } from "zod";
import { CarCategory, Transmission, MileagePolicy } from "@prisma/client";

export const providerCreateCarSchema = z.object({
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
  bags: z.string().min(1),
  hasAC: z.coerce.boolean(),
  transmission: z.nativeEnum(Transmission),
  mileagePolicy: z.nativeEnum(MileagePolicy),

  dailyRate: z.coerce.number().positive(),
  hourlyRate: z.coerce.number().positive().optional().nullable(),
});

export const providerUpdateCarSchema = providerCreateCarSchema.partial();

export const providerSubmitSchema = z.object({
  note: z.string().optional(),
});

export const providerAttachFeaturesSchema = z.object({
  featureIds: z.array(z.string().uuid()).min(1),
});
