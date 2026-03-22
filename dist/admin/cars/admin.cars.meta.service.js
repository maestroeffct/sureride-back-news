"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCarMetaCategories = listCarMetaCategories;
exports.importCarMetaCategories = importCarMetaCategories;
exports.createCarMetaCategory = createCarMetaCategory;
exports.updateCarMetaCategory = updateCarMetaCategory;
exports.listCarMetaBrands = listCarMetaBrands;
exports.importCarMetaBrands = importCarMetaBrands;
exports.createCarMetaBrand = createCarMetaBrand;
exports.updateCarMetaBrand = updateCarMetaBrand;
exports.listCarMetaModels = listCarMetaModels;
exports.importCarMetaModels = importCarMetaModels;
exports.createCarMetaModel = createCarMetaModel;
exports.updateCarMetaModel = updateCarMetaModel;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
function normalizeSlug(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function normalizeName(value) {
    return value.trim();
}
function toJsonValue(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return client_1.Prisma.JsonNull;
    return value;
}
function listMeta(page, limit, total) {
    return {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}
async function ensureCategoryExists(categoryId) {
    const category = await prisma_1.prisma.carCategoryConfig.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true },
    });
    if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
    }
    return category;
}
async function ensureBrandExists(brandId) {
    const brand = await prisma_1.prisma.carBrandConfig.findUnique({
        where: { id: brandId },
        select: {
            id: true,
            name: true,
            categoryId: true,
        },
    });
    if (!brand) {
        throw new Error("BRAND_NOT_FOUND");
    }
    return brand;
}
async function listCarMetaCategories(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { name: { contains: input.q, mode: "insensitive" } },
            { slug: { contains: input.q, mode: "insensitive" } },
        ];
    }
    if (input.isActive !== undefined) {
        where.isActive = input.isActive;
    }
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.carCategoryConfig.findMany({
            where,
            skip,
            take: input.limit,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
                _count: {
                    select: {
                        brands: true,
                        models: true,
                    },
                },
            },
        }),
        prisma_1.prisma.carCategoryConfig.count({ where }),
    ]);
    return {
        items: items.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            externalId: item.externalId,
            source: item.source,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
            brandsCount: item._count.brands,
            modelsCount: item._count.models,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })),
        meta: listMeta(input.page, input.limit, total),
    };
}
async function importCarMetaCategories(input) {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (const item of input.items) {
        const slug = normalizeSlug(item.slug);
        const name = normalizeName(item.name);
        const existing = (item.externalId
            ? await prisma_1.prisma.carCategoryConfig.findFirst({
                where: {
                    externalId: item.externalId,
                    source: input.source,
                },
            })
            : null) ||
            (await prisma_1.prisma.carCategoryConfig.findUnique({
                where: { slug },
            }));
        if (!existing) {
            await prisma_1.prisma.carCategoryConfig.create({
                data: {
                    name,
                    slug,
                    externalId: item.externalId,
                    source: input.source,
                    sortOrder: item.sortOrder,
                    metadata: toJsonValue(item.metadata),
                    isActive: true,
                },
            });
            created += 1;
            continue;
        }
        const changed = existing.name !== name ||
            existing.slug !== slug ||
            existing.externalId !== item.externalId ||
            existing.source !== input.source ||
            existing.sortOrder !== item.sortOrder ||
            JSON.stringify(existing.metadata) !== JSON.stringify(item.metadata ?? null);
        if (!changed) {
            skipped += 1;
            continue;
        }
        await prisma_1.prisma.carCategoryConfig.update({
            where: { id: existing.id },
            data: {
                name,
                slug,
                externalId: item.externalId,
                source: input.source,
                sortOrder: item.sortOrder,
                metadata: toJsonValue(item.metadata),
            },
        });
        updated += 1;
    }
    return {
        message: "Categories imported",
        created,
        updated,
        skipped,
    };
}
async function createCarMetaCategory(input) {
    return prisma_1.prisma.carCategoryConfig.create({
        data: {
            name: normalizeName(input.name),
            slug: normalizeSlug(input.slug),
            externalId: input.externalId,
            source: input.source || "manual",
            isActive: input.isActive,
            sortOrder: input.sortOrder,
            metadata: toJsonValue(input.metadata),
        },
    });
}
async function updateCarMetaCategory(categoryId, input) {
    await ensureCategoryExists(categoryId);
    return prisma_1.prisma.carCategoryConfig.update({
        where: { id: categoryId },
        data: {
            ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
            ...(input.externalId !== undefined ? { externalId: input.externalId } : {}),
            ...(input.source !== undefined ? { source: input.source } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
            ...(input.metadata !== undefined ? { metadata: toJsonValue(input.metadata) } : {}),
        },
    });
}
async function listCarMetaBrands(input) {
    const where = {};
    if (input.categoryId)
        where.categoryId = input.categoryId;
    if (input.isActive !== undefined)
        where.isActive = input.isActive;
    if (input.q) {
        where.OR = [
            { name: { contains: input.q, mode: "insensitive" } },
            { slug: { contains: input.q, mode: "insensitive" } },
        ];
    }
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.carBrandConfig.findMany({
            where,
            skip,
            take: input.limit,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
                category: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { models: true },
                },
            },
        }),
        prisma_1.prisma.carBrandConfig.count({ where }),
    ]);
    return {
        items: items.map((item) => ({
            id: item.id,
            categoryId: item.categoryId,
            categoryName: item.category?.name || null,
            name: item.name,
            slug: item.slug,
            externalId: item.externalId,
            source: item.source,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
            modelsCount: item._count.models,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })),
        meta: listMeta(input.page, input.limit, total),
    };
}
async function importCarMetaBrands(input) {
    await ensureCategoryExists(input.categoryId);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (const item of input.items) {
        const slug = normalizeSlug(item.slug);
        const name = normalizeName(item.name);
        const existing = (item.externalId
            ? await prisma_1.prisma.carBrandConfig.findFirst({
                where: {
                    categoryId: input.categoryId,
                    externalId: item.externalId,
                    source: input.source,
                },
            })
            : null) ||
            (await prisma_1.prisma.carBrandConfig.findFirst({
                where: {
                    categoryId: input.categoryId,
                    slug,
                },
            }));
        if (!existing) {
            await prisma_1.prisma.carBrandConfig.create({
                data: {
                    categoryId: input.categoryId,
                    name,
                    slug,
                    externalId: item.externalId,
                    source: input.source,
                    sortOrder: item.sortOrder,
                    metadata: toJsonValue(item.metadata),
                    isActive: true,
                },
            });
            created += 1;
            continue;
        }
        const changed = existing.name !== name ||
            existing.slug !== slug ||
            existing.externalId !== item.externalId ||
            existing.source !== input.source ||
            existing.sortOrder !== item.sortOrder ||
            JSON.stringify(existing.metadata) !== JSON.stringify(item.metadata ?? null);
        if (!changed) {
            skipped += 1;
            continue;
        }
        await prisma_1.prisma.carBrandConfig.update({
            where: { id: existing.id },
            data: {
                name,
                slug,
                externalId: item.externalId,
                source: input.source,
                sortOrder: item.sortOrder,
                metadata: toJsonValue(item.metadata),
            },
        });
        updated += 1;
    }
    return {
        message: "Brands imported",
        created,
        updated,
        skipped,
    };
}
async function createCarMetaBrand(input) {
    await ensureCategoryExists(input.categoryId);
    return prisma_1.prisma.carBrandConfig.create({
        data: {
            categoryId: input.categoryId,
            name: normalizeName(input.name),
            slug: normalizeSlug(input.slug),
            externalId: input.externalId,
            source: input.source || "manual",
            isActive: input.isActive,
            sortOrder: input.sortOrder,
            metadata: toJsonValue(input.metadata),
        },
    });
}
async function updateCarMetaBrand(brandId, input) {
    if (input.categoryId)
        await ensureCategoryExists(input.categoryId);
    const existing = await prisma_1.prisma.carBrandConfig.findUnique({
        where: { id: brandId },
        select: { id: true },
    });
    if (!existing)
        throw new Error("BRAND_NOT_FOUND");
    return prisma_1.prisma.carBrandConfig.update({
        where: { id: brandId },
        data: {
            ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
            ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
            ...(input.externalId !== undefined ? { externalId: input.externalId } : {}),
            ...(input.source !== undefined ? { source: input.source } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
            ...(input.metadata !== undefined ? { metadata: toJsonValue(input.metadata) } : {}),
        },
    });
}
async function listCarMetaModels(input) {
    const where = {};
    if (input.categoryId)
        where.categoryId = input.categoryId;
    if (input.brandId)
        where.brandId = input.brandId;
    if (input.isActive !== undefined)
        where.isActive = input.isActive;
    if (input.q) {
        where.OR = [
            { name: { contains: input.q, mode: "insensitive" } },
            { slug: { contains: input.q, mode: "insensitive" } },
        ];
    }
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.carModelConfig.findMany({
            where,
            skip,
            take: input.limit,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
                category: {
                    select: { id: true, name: true },
                },
                brand: {
                    select: { id: true, name: true },
                },
            },
        }),
        prisma_1.prisma.carModelConfig.count({ where }),
    ]);
    return {
        items: items.map((item) => ({
            id: item.id,
            categoryId: item.categoryId,
            categoryName: item.category?.name || null,
            brandId: item.brandId,
            brandName: item.brand.name,
            name: item.name,
            slug: item.slug,
            externalId: item.externalId,
            source: item.source,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })),
        meta: listMeta(input.page, input.limit, total),
    };
}
async function importCarMetaModels(input) {
    const brand = await ensureBrandExists(input.brandId);
    if (input.categoryId) {
        await ensureCategoryExists(input.categoryId);
        if (brand.categoryId && brand.categoryId !== input.categoryId) {
            throw new Error("BRAND_CATEGORY_MISMATCH");
        }
    }
    const resolvedCategoryId = input.categoryId ?? brand.categoryId ?? null;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (const item of input.items) {
        const slug = normalizeSlug(item.slug);
        const name = normalizeName(item.name);
        const existing = (item.externalId
            ? await prisma_1.prisma.carModelConfig.findFirst({
                where: {
                    brandId: input.brandId,
                    externalId: item.externalId,
                    source: input.source,
                },
            })
            : null) ||
            (await prisma_1.prisma.carModelConfig.findFirst({
                where: {
                    brandId: input.brandId,
                    slug,
                },
            }));
        if (!existing) {
            await prisma_1.prisma.carModelConfig.create({
                data: {
                    categoryId: resolvedCategoryId,
                    brandId: input.brandId,
                    name,
                    slug,
                    externalId: item.externalId,
                    source: input.source,
                    sortOrder: item.sortOrder,
                    metadata: toJsonValue(item.metadata),
                    isActive: true,
                },
            });
            created += 1;
            continue;
        }
        const changed = existing.name !== name ||
            existing.slug !== slug ||
            existing.externalId !== item.externalId ||
            existing.source !== input.source ||
            existing.sortOrder !== item.sortOrder ||
            existing.categoryId !== resolvedCategoryId ||
            JSON.stringify(existing.metadata) !== JSON.stringify(item.metadata ?? null);
        if (!changed) {
            skipped += 1;
            continue;
        }
        await prisma_1.prisma.carModelConfig.update({
            where: { id: existing.id },
            data: {
                categoryId: resolvedCategoryId,
                name,
                slug,
                externalId: item.externalId,
                source: input.source,
                sortOrder: item.sortOrder,
                metadata: toJsonValue(item.metadata),
            },
        });
        updated += 1;
    }
    return {
        message: "Models imported",
        created,
        updated,
        skipped,
    };
}
async function createCarMetaModel(input) {
    const brand = await ensureBrandExists(input.brandId);
    if (input.categoryId) {
        await ensureCategoryExists(input.categoryId);
        if (brand.categoryId && brand.categoryId !== input.categoryId) {
            throw new Error("BRAND_CATEGORY_MISMATCH");
        }
    }
    return prisma_1.prisma.carModelConfig.create({
        data: {
            categoryId: input.categoryId ?? brand.categoryId ?? null,
            brandId: input.brandId,
            name: normalizeName(input.name),
            slug: normalizeSlug(input.slug),
            externalId: input.externalId,
            source: input.source || "manual",
            isActive: input.isActive,
            sortOrder: input.sortOrder,
            metadata: toJsonValue(input.metadata),
        },
    });
}
async function updateCarMetaModel(modelId, input) {
    const existing = await prisma_1.prisma.carModelConfig.findUnique({
        where: { id: modelId },
        select: { id: true, brandId: true, categoryId: true },
    });
    if (!existing)
        throw new Error("MODEL_NOT_FOUND");
    const nextBrandId = input.brandId ?? existing.brandId;
    const nextBrand = await ensureBrandExists(nextBrandId);
    if (input.categoryId) {
        await ensureCategoryExists(input.categoryId);
        if (nextBrand.categoryId && nextBrand.categoryId !== input.categoryId) {
            throw new Error("BRAND_CATEGORY_MISMATCH");
        }
    }
    return prisma_1.prisma.carModelConfig.update({
        where: { id: modelId },
        data: {
            ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
            ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
            ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
            ...(input.externalId !== undefined ? { externalId: input.externalId } : {}),
            ...(input.source !== undefined ? { source: input.source } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
            ...(input.metadata !== undefined ? { metadata: toJsonValue(input.metadata) } : {}),
        },
    });
}
