"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.fetchUserBookings = fetchUserBookings;
exports.fetchBookingDetails = fetchBookingDetails;
exports.cancelUserBooking = cancelUserBooking;
exports.confirmUserBooking = confirmUserBooking;
const prisma_1 = require("../../../prisma");
async function createBooking(input) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: input.userId },
    });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    if (user.profileStatus !== "VERIFIED") {
        throw new Error("PROFILE_INCOMPLETE");
    }
    const car = await prisma_1.prisma.car.findUnique({
        where: { id: input.carId },
        include: { insurancePackages: true },
    });
    if (!car || !car.isActive) {
        throw new Error("CAR_NOT_AVAILABLE");
    }
    const overlapping = await prisma_1.prisma.booking.findFirst({
        where: {
            carId: input.carId,
            AND: [
                { pickupAt: { lt: input.returnAt } },
                { returnAt: { gt: input.pickupAt } },
                { status: { in: ["PENDING", "CONFIRMED"] } },
            ],
        },
    });
    if (overlapping)
        throw new Error("CAR_ALREADY_BOOKED");
    const ms = input.returnAt.getTime() - input.pickupAt.getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    const basePrice = days * car.dailyRate;
    let insuranceFee = 0;
    if (input.insuranceId) {
        const insurance = await prisma_1.prisma.insurancePackage.findUnique({
            where: { id: input.insuranceId },
        });
        if (insurance) {
            insuranceFee = days * insurance.dailyPrice;
        }
    }
    const totalPrice = basePrice + insuranceFee;
    return prisma_1.prisma.booking.create({
        data: {
            userId: input.userId,
            carId: input.carId,
            pickupAt: input.pickupAt,
            returnAt: input.returnAt,
            pickupLocationId: input.pickupLocationId,
            dropoffLocationId: input.dropoffLocationId,
            pricingUnit: "DAILY",
            basePrice,
            insuranceFee,
            totalPrice,
            insuranceId: input.insuranceId,
        },
    });
}
async function fetchUserBookings(userId, status) {
    let filter = { userId };
    if (status === "IN_PROGRESS") {
        filter.status = {
            in: ["PENDING", "CONFIRMED"],
        };
    }
    if (status === "COMPLETED") {
        filter.status = "COMPLETED";
    }
    return prisma_1.prisma.booking.findMany({
        where: filter,
        include: {
            car: {
                include: {
                    images: true,
                    location: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function fetchBookingDetails(userId, bookingId) {
    const booking = await prisma_1.prisma.booking.findFirst({
        where: { id: bookingId, userId },
        include: {
            car: {
                include: {
                    images: true,
                    provider: true,
                    location: true,
                },
            },
            insurance: true,
        },
    });
    if (!booking) {
        throw new Error("Booking not found");
    }
    return {
        id: booking.id,
        pickupCode: generatePickupCode(booking.id),
        car: {
            brand: booking.car.brand,
            model: booking.car.model,
            category: booking.car.category,
            transmission: booking.car.transmission,
            seats: booking.car.seats,
            hasAC: booking.car.hasAC,
            mileagePolicy: booking.car.mileagePolicy,
            images: booking.car.images,
        },
        provider: {
            name: booking.car.provider.name,
            logo: booking.car.provider.logoUrl,
            phone: booking.car.provider.phone,
            email: booking.car.provider.email,
        },
        rentalPeriod: {
            pickupAt: booking.pickupAt,
            returnAt: booking.returnAt,
            pickupLocation: booking.car.location,
            dropoffLocation: booking.dropoffLocationId,
        },
        insurance: booking.insurance,
        payment: {
            basePrice: booking.basePrice,
            insuranceFee: booking.insuranceFee,
            totalPrice: booking.totalPrice,
            pricingUnit: booking.pricingUnit,
        },
        status: booking.status,
    };
}
function generatePickupCode(bookingId) {
    return bookingId.slice(0, 8).toUpperCase();
}
async function cancelUserBooking(userId, bookingId) {
    const booking = await prisma_1.prisma.booking.findFirst({
        where: { id: bookingId, userId },
    });
    if (!booking) {
        throw new Error("Booking not found");
    }
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
        throw new Error("Cannot cancel this booking");
    }
    if (booking.pickupAt <= new Date()) {
        throw new Error("Pickup time already passed");
    }
    return prisma_1.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
    });
}
// ⚠️ In production:
// This endpoint should be called by:
// Payment webhook
// NOT frontend directly
async function confirmUserBooking(bookingId) {
    const booking = await prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
    });
    if (!booking) {
        throw new Error("Booking not found");
    }
    if (booking.status !== "PENDING") {
        throw new Error("Booking already processed");
    }
    return prisma_1.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
    });
}
