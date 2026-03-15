"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerAttachFeaturesSchema = exports.providerSubmitSchema = exports.providerUpdateCarSchema = exports.providerCreateCarSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.providerCreateCarSchema = zod_1.z.object({
    locationId: zod_1.z.string().uuid(),
    brand: zod_1.z.string().min(1),
    model: zod_1.z.string().min(1),
    category: zod_1.z.nativeEnum(client_1.CarCategory),
    year: zod_1.z.coerce
        .number()
        .int()
        .min(1990)
        .max(new Date().getFullYear() + 1),
    seats: zod_1.z.coerce.number().int().min(1).max(30),
    bags: zod_1.z.string().min(1),
    hasAC: zod_1.z.coerce.boolean(),
    transmission: zod_1.z.nativeEnum(client_1.Transmission),
    mileagePolicy: zod_1.z.nativeEnum(client_1.MileagePolicy),
    dailyRate: zod_1.z.coerce.number().positive(),
    hourlyRate: zod_1.z.coerce.number().positive().optional().nullable(),
});
exports.providerUpdateCarSchema = exports.providerCreateCarSchema.partial();
exports.providerSubmitSchema = zod_1.z.object({
    note: zod_1.z.string().optional(),
});
exports.providerAttachFeaturesSchema = zod_1.z.object({
    featureIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
