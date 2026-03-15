"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerCreateCar = providerCreateCar;
exports.providerUpdateCar = providerUpdateCar;
exports.providerSubmitCar = providerSubmitCar;
exports.providerUploadCarImages = providerUploadCarImages;
exports.providerDeleteCarImage = providerDeleteCarImage;
exports.providerAttachCarFeatures = providerAttachCarFeatures;
const prisma_1 = require("../../../prisma");
const feature_service_1 = require("../../rental/feature/feature.service");
async function assertProviderOwnsCar(providerId, carId) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    if (car.providerId !== providerId)
        throw new Error("FORBIDDEN");
    return car;
}
async function providerCreateCar(providerId, data) {
    // Ensure location belongs to provider
    const location = await prisma_1.prisma.location.findUnique({
        where: { id: data.locationId },
    });
    if (!location)
        throw new Error("LOCATION_NOT_FOUND");
    if (location.providerId !== providerId)
        throw new Error("LOCATION_NOT_OWNED");
    // Provider cannot control moderation fields
    const car = await prisma_1.prisma.car.create({
        data: {
            ...data,
            providerId,
            status: "DRAFT",
            isActive: false,
            moderationNote: null,
            flaggedReason: null,
        },
    });
    return car;
}
async function providerUpdateCar(providerId, carId, data) {
    const car = await assertProviderOwnsCar(providerId, carId);
    if (car.status === "FLAGGED") {
        // Admin must unflag before provider can modify
        throw new Error("CAR_FLAGGED");
    }
    // Ensure location belongs to provider if changed
    if (data.locationId) {
        const location = await prisma_1.prisma.location.findUnique({
            where: { id: data.locationId },
        });
        if (!location)
            throw new Error("LOCATION_NOT_FOUND");
        if (location.providerId !== providerId)
            throw new Error("LOCATION_NOT_OWNED");
    }
    // Strip forbidden fields from provider
    delete data.status;
    delete data.isActive;
    delete data.flaggedReason;
    delete data.moderationNote;
    delete data.providerId;
    // If provider edits an approved/rejected/pending car, force moderation again
    const nextStatus = car.status === "APPROVED" ? "PENDING_APPROVAL" : car.status;
    const shouldReset = car.status === "APPROVED" || car.status === "REJECTED";
    const updated = await prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            ...data,
            ...(shouldReset
                ? {
                    status: "PENDING_APPROVAL",
                    isActive: false,
                }
                : { status: nextStatus }),
        },
    });
    return updated;
}
async function providerSubmitCar(providerId, carId, note) {
    const car = await assertProviderOwnsCar(providerId, carId);
    if (car.status !== "DRAFT" && car.status !== "REJECTED") {
        throw new Error("INVALID_STATUS_FOR_SUBMIT");
    }
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            status: "PENDING_APPROVAL",
            isActive: false,
            moderationNote: note ?? car.moderationNote ?? null,
        },
    });
}
async function providerUploadCarImages(providerId, carId, files) {
    const car = await assertProviderOwnsCar(providerId, carId);
    if (car.status === "FLAGGED")
        throw new Error("CAR_FLAGGED");
    if (!files?.length)
        throw new Error("NO_FILES");
    // Convert file names to URLs relative to /uploads
    const records = await prisma_1.prisma.carImage.createMany({
        data: files.map((f, idx) => ({
            carId,
            url: `/uploads/cars/${f.filename}`,
            isPrimary: idx === 0, // first image primary by default
        })),
    });
    return records;
}
async function providerDeleteCarImage(providerId, carId, imageId) {
    await assertProviderOwnsCar(providerId, carId);
    const img = await prisma_1.prisma.carImage.findUnique({ where: { id: imageId } });
    if (!img)
        throw new Error("IMAGE_NOT_FOUND");
    if (img.carId !== carId)
        throw new Error("IMAGE_NOT_IN_CAR");
    await prisma_1.prisma.carImage.delete({ where: { id: imageId } });
    return { message: "Image deleted" };
}
async function providerAttachCarFeatures(providerId, carId, featureIds) {
    // Reuse your feature module (it already validates global vs provider ownership)
    return (0, feature_service_1.attachFeaturesToCar)(providerId, carId, featureIds);
}
