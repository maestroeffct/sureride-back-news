"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importModelsSchema = exports.updateModelConfigSchema = exports.createModelConfigSchema = exports.importBrandsSchema = exports.updateBrandConfigSchema = exports.createBrandConfigSchema = exports.importCategoriesSchema = exports.updateCategoryConfigSchema = exports.createCategoryConfigSchema = exports.metaModelListQuerySchema = exports.metaBrandListQuerySchema = exports.metaCategoryListQuerySchema = void 0;
const zod_1 = require("zod");
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const normalizedString = zod_1.z.string().min(1).trim();
const optionalQueryBoolean = zod_1.z.preprocess((value) => {
    if (value === undefined || value === null || value === "")
        return undefined;
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string") {
        if (value === "true")
            return true;
        if (value === "false")
            return false;
    }
    return value;
}, zod_1.z.boolean().optional());
const jsonRecordSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
const importItemSchema = zod_1.z.object({
    externalId: normalizedString.optional(),
    name: normalizedString,
    slug: zod_1.z.string().regex(slugRegex),
    sortOrder: zod_1.z.coerce.number().int().optional().default(0),
    metadata: jsonRecordSchema.optional(),
});
exports.metaCategoryListQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    isActive: optionalQueryBoolean,
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(200).default(20),
});
exports.metaBrandListQuerySchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    q: zod_1.z.string().optional(),
    isActive: optionalQueryBoolean,
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(500).default(20),
});
exports.metaModelListQuerySchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    brandId: zod_1.z.string().uuid().optional(),
    q: zod_1.z.string().optional(),
    isActive: optionalQueryBoolean,
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(1000).default(20),
});
exports.createCategoryConfigSchema = zod_1.z.object({
    name: normalizedString,
    slug: zod_1.z.string().regex(slugRegex),
    externalId: normalizedString.optional(),
    source: normalizedString.optional(),
    isActive: zod_1.z.boolean().optional().default(true),
    sortOrder: zod_1.z.coerce.number().int().optional().default(0),
    metadata: jsonRecordSchema.optional(),
});
exports.updateCategoryConfigSchema = zod_1.z
    .object({
    name: normalizedString.optional(),
    externalId: normalizedString.nullable().optional(),
    source: normalizedString.nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z.coerce.number().int().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});
exports.importCategoriesSchema = zod_1.z.object({
    source: normalizedString,
    items: zod_1.z.array(importItemSchema).min(1),
});
exports.createBrandConfigSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    name: normalizedString,
    slug: zod_1.z.string().regex(slugRegex),
    externalId: normalizedString.optional(),
    source: normalizedString.optional(),
    isActive: zod_1.z.boolean().optional().default(true),
    sortOrder: zod_1.z.coerce.number().int().optional().default(0),
    metadata: jsonRecordSchema.optional(),
});
exports.updateBrandConfigSchema = zod_1.z
    .object({
    categoryId: zod_1.z.string().uuid().optional(),
    name: normalizedString.optional(),
    externalId: normalizedString.nullable().optional(),
    source: normalizedString.nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z.coerce.number().int().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});
exports.importBrandsSchema = zod_1.z.object({
    source: normalizedString,
    categoryId: zod_1.z.string().uuid(),
    items: zod_1.z.array(importItemSchema).min(1),
});
exports.createModelConfigSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    brandId: zod_1.z.string().uuid(),
    name: normalizedString,
    slug: zod_1.z.string().regex(slugRegex),
    externalId: normalizedString.optional(),
    source: normalizedString.optional(),
    isActive: zod_1.z.boolean().optional().default(true),
    sortOrder: zod_1.z.coerce.number().int().optional().default(0),
    metadata: jsonRecordSchema.optional(),
});
exports.updateModelConfigSchema = zod_1.z
    .object({
    categoryId: zod_1.z.string().uuid().nullable().optional(),
    brandId: zod_1.z.string().uuid().optional(),
    name: normalizedString.optional(),
    externalId: normalizedString.nullable().optional(),
    source: normalizedString.nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z.coerce.number().int().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});
exports.importModelsSchema = zod_1.z.object({
    source: normalizedString,
    categoryId: zod_1.z.string().uuid().optional(),
    brandId: zod_1.z.string().uuid(),
    items: zod_1.z.array(importItemSchema).min(1),
});
