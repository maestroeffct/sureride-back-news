"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListCars = adminListCars;
exports.adminGetCar = adminGetCar;
exports.adminCreateCar = adminCreateCar;
exports.adminUpdateCar = adminUpdateCar;
exports.adminApproveCar = adminApproveCar;
exports.adminRejectCar = adminRejectCar;
exports.adminFlagCar = adminFlagCar;
exports.adminUnflagCar = adminUnflagCar;
exports.adminActivateCar = adminActivateCar;
exports.adminDeactivateCar = adminDeactivateCar;
const prisma_1 = require("../../prisma");
async function adminListCars(input) {
    const { q, status, providerId, city, page, limit } = input;
    const where = {};
    if (status)
        where.status = status;
    if (providerId)
        where.providerId = providerId;
    if (q) {
        where.OR = [
            { brand: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
        ];
    }
    // You don't have explicit "city" in schema. We approximate via location.address/name.
    if (city) {
        where.location = {
            OR: [
                { name: { contains: city, mode: "insensitive" } },
                { address: { contains: city, mode: "insensitive" } },
            ],
        };
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.car.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                provider: true,
                location: { include: { country: true } },
                images: true,
            },
        }),
        prisma_1.prisma.car.count({ where }),
    ]);
    return {
        items,
        meta: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}
async function adminGetCar(carId) {
    const car = await prisma_1.prisma.car.findUnique({
        where: { id: carId },
        include: {
            provider: true,
            location: { include: { country: true } },
            images: true,
            insurancePackages: true,
            bookings: {
                orderBy: { createdAt: "desc" },
                take: 20,
            },
            features: {
                include: { feature: true },
            },
        },
    });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    return car;
}
async function adminCreateCar(input) {
    const { autoApprove, note, ...data } = input;
    // Ensure provider exists
    const provider = await prisma_1.prisma.rentalProvider.findUnique({
        where: { id: data.providerId },
    });
    if (!provider)
        throw new Error("PROVIDER_NOT_FOUND");
    // Ensure location belongs to provider
    const location = await prisma_1.prisma.location.findUnique({
        where: { id: data.locationId },
    });
    if (!location)
        throw new Error("LOCATION_NOT_FOUND");
    if (location.providerId !== data.providerId)
        throw new Error("LOCATION_NOT_OWNED_BY_PROVIDER");
    const status = autoApprove ? "APPROVED" : "DRAFT";
    const car = await prisma_1.prisma.car.create({
        data: {
            ...data,
            status,
            isActive: autoApprove ? true : false,
            moderationNote: note ?? null,
            flaggedReason: null,
        },
    });
    return car;
}
async function adminUpdateCar(carId, data) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    // If admin changes location, validate provider ownership consistency
    if (data.locationId) {
        const location = await prisma_1.prisma.location.findUnique({
            where: { id: data.locationId },
        });
        if (!location)
            throw new Error("LOCATION_NOT_FOUND");
        if (location.providerId !== car.providerId)
            throw new Error("LOCATION_NOT_OWNED_BY_PROVIDER");
    }
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data,
    });
}
async function adminApproveCar(carId, note) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            status: "APPROVED",
            isActive: true,
            moderationNote: note ?? null,
            flaggedReason: null,
        },
    });
}
async function adminRejectCar(carId, reason) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            status: "REJECTED",
            isActive: false,
            moderationNote: reason,
        },
    });
}
async function adminFlagCar(carId, reason) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            status: "FLAGGED",
            isActive: false,
            flaggedReason: reason,
        },
    });
}
async function adminUnflagCar(carId, note) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    // After unflag, safest is back to APPROVED (not DRAFT)
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            status: "APPROVED",
            isActive: true,
            flaggedReason: null,
            moderationNote: note ?? car.moderationNote ?? null,
        },
    });
}
async function adminActivateCar(carId) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    if (car.status !== "APPROVED") {
        throw new Error("CAR_NOT_APPROVED");
    }
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: { isActive: true },
    });
}
async function adminDeactivateCar(carId, reason) {
    const car = await prisma_1.prisma.car.findUnique({ where: { id: carId } });
    if (!car)
        throw new Error("CAR_NOT_FOUND");
    return prisma_1.prisma.car.update({
        where: { id: carId },
        data: {
            isActive: false,
            moderationNote: reason ?? car.moderationNote ?? null,
        },
    });
}
