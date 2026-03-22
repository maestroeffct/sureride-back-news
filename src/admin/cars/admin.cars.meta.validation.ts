import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizedString = z.string().min(1).trim();
const optionalQueryBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return value;
}, z.boolean().optional());

const jsonRecordSchema = z.record(z.string(), z.unknown());

const importItemSchema = z.object({
  externalId: normalizedString.optional(),
  name: normalizedString,
  slug: z.string().regex(slugRegex),
  sortOrder: z.coerce.number().int().optional().default(0),
  metadata: jsonRecordSchema.optional(),
});

export const metaCategoryListQuerySchema = z.object({
  q: z.string().optional(),
  isActive: optionalQueryBoolean,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const metaBrandListQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  q: z.string().optional(),
  isActive: optionalQueryBoolean,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

export const metaModelListQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  q: z.string().optional(),
  isActive: optionalQueryBoolean,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export const createCategoryConfigSchema = z.object({
  name: normalizedString,
  slug: z.string().regex(slugRegex),
  externalId: normalizedString.optional(),
  source: normalizedString.optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  metadata: jsonRecordSchema.optional(),
});

export const updateCategoryConfigSchema = z
  .object({
    name: normalizedString.optional(),
    externalId: normalizedString.nullable().optional(),
    source: normalizedString.nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const importCategoriesSchema = z.object({
  source: normalizedString,
  items: z.array(importItemSchema).min(1),
});

export const createBrandConfigSchema = z.object({
  categoryId: z.string().uuid(),
  name: normalizedString,
  slug: z.string().regex(slugRegex),
  externalId: normalizedString.optional(),
  source: normalizedString.optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  metadata: jsonRecordSchema.optional(),
});

export const updateBrandConfigSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    name: normalizedString.optional(),
    externalId: normalizedString.nullable().optional(),
    source: normalizedString.nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const importBrandsSchema = z.object({
  source: normalizedString,
  categoryId: z.string().uuid(),
  items: z.array(importItemSchema).min(1),
});

export const createModelConfigSchema = z.object({
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  name: normalizedString,
  slug: z.string().regex(slugRegex),
  externalId: normalizedString.optional(),
  source: normalizedString.optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  metadata: jsonRecordSchema.optional(),
});

export const updateModelConfigSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    brandId: z.string().uuid().optional(),
    name: normalizedString.optional(),
    externalId: normalizedString.nullable().optional(),
    source: normalizedString.nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const importModelsSchema = z.object({
  source: normalizedString,
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  items: z.array(importItemSchema).min(1),
});
