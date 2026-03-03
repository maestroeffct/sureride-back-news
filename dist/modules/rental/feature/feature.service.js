"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalFeature = createGlobalFeature;
exports.createProviderFeature = createProviderFeature;
exports.listProviderFeatures = listProviderFeatures;
exports.attachFeaturesToCar = attachFeaturesToCar;
exports.getCarWithFeatures = getCarWithFeatures;
const prisma_1 = require("../../../prisma");
/**
 * ADMIN - Create Global Feature
 * providerId = null
 */
async function createGlobalFeature(data) {
    return prisma_1.prisma.feature.create({
        data: {
            name: data.name,
            category: data.category,
            icon: data.icon,
            providerId: null,
        },
    });
}
/**
 * PROVIDER - Create Custom Feature
 */
async function createProviderFeature(providerId, data) {
    return prisma_1.prisma.feature.create({
        data: {
            name: data.name,
            category: data.category,
            icon: data.icon,
            providerId,
        },
    });
}
/**
 * List features for provider (global + provider owned)
 */
async function listProviderFeatures(providerId) {
    return prisma_1.prisma.feature.findMany({
        where: {
            OR: [
                { providerId: null }, // global
                { providerId }, // owned
            ],
            isActive: true,
        },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Attach features to car (bulk)
 */
async function attachFeaturesToCar(providerId, carId, featureIds) {
    const car = await prisma_1.prisma.car.findUnique({
        where: { id: carId },
    });
    if (!car) {
        throw new Error("CAR_NOT_FOUND");
    }
    if (car.providerId !== providerId) {
        throw new Error("NOT_YOUR_CAR");
    }
    // Validate features ownership
    const features = await prisma_1.prisma.feature.findMany({
        where: { id: { in: featureIds } },
    });
    for (const feature of features) {
        if (feature.providerId && feature.providerId !== providerId) {
            throw new Error("INVALID_FEATURE_OWNERSHIP");
        }
    }
    // Remove existing
    await prisma_1.prisma.carFeature.deleteMany({
        where: { carId },
    });
    // Attach new
    await prisma_1.prisma.carFeature.createMany({
        data: featureIds.map((featureId) => ({
            carId,
            featureId,
        })),
    });
    return { message: "Features attached successfully" };
}
/**
 * Get Car With Grouped Features
 */
async function getCarWithFeatures(carId) {
    const car = await prisma_1.prisma.car.findUnique({
        where: { id: carId },
        include: {
            images: true,
            provider: true,
            location: {
                include: { country: true },
            },
            insurancePackages: true,
            features: {
                include: {
                    feature: true,
                },
            },
        },
    });
    if (!car) {
        throw new Error("CAR_NOT_FOUND");
    }
    // Group features by category
    const grouped = {};
    car.features.forEach((cf) => {
        const category = cf.feature.category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({
            id: cf.feature.id,
            name: cf.feature.name,
            icon: cf.feature.icon,
        });
    });
    return {
        ...car,
        groupedFeatures: grouped,
    };
}
