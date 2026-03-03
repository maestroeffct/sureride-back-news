"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAvailableCars = searchAvailableCars;
exports.listAllCars = listAllCars;
const prisma_1 = require("../../prisma");
async function searchAvailableCars(input) {
    return prisma_1.prisma.car.findMany({
        where: {
            isActive: true,
            location: {
                id: input.pickupLocationId,
                country: {
                    code: input.countryCode,
                },
            },
            bookings: {
                none: {
                    AND: [
                        { pickupAt: { lt: input.returnAt } },
                        { returnAt: { gt: input.pickupAt } },
                    ],
                },
            },
        },
        include: {
            provider: true,
            location: true,
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
    });
}
async function listAllCars() {
    return prisma_1.prisma.car.findMany({
        include: {
            provider: true,
            location: true,
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
