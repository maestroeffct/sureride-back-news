"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLocations = searchLocations;
exports.listAllLocations = listAllLocations;
const prisma_1 = require("../../../prisma");
async function searchLocations(input) {
    if (!input.query || input.query.length < 3) {
        return [];
    }
    return prisma_1.prisma.location.findMany({
        where: {
            name: {
                contains: input.query,
                mode: "insensitive",
            },
            ...(input.countryId && { countryId: input.countryId }),
        },
        include: {
            country: true,
            provider: true,
        },
        take: 15,
    });
}
async function listAllLocations() {
    return prisma_1.prisma.location.findMany({
        include: {
            country: true,
            provider: true,
        },
        orderBy: { createdAt: "desc" },
    });
}
