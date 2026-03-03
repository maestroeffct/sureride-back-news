"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDailyPrice = calculateDailyPrice;
const dayjs_1 = __importDefault(require("dayjs"));
const prisma_1 = require("../../../prisma");
async function calculateDailyPrice(params) {
    const { carId, pickupAt, returnAt, insuranceId } = params;
    if ((0, dayjs_1.default)(returnAt).isBefore((0, dayjs_1.default)(pickupAt))) {
        throw new Error("INVALID_DATE_RANGE");
    }
    const car = await prisma_1.prisma.car.findUnique({
        where: { id: carId },
    });
    if (!car || !car.isActive) {
        throw new Error("CAR_NOT_AVAILABLE");
    }
    // 🔥 Calculate number of days (minimum 1 day)
    const days = Math.max(1, (0, dayjs_1.default)(returnAt).diff((0, dayjs_1.default)(pickupAt), "day", true));
    const rentalDays = Math.ceil(days);
    const basePrice = rentalDays * car.dailyRate;
    let insuranceFee = 0;
    if (insuranceId) {
        const insurance = await prisma_1.prisma.insurancePackage.findFirst({
            where: {
                id: insuranceId,
                isActive: true,
                OR: [
                    { providerId: null }, // admin insurance
                    { providerId: car.providerId }, // provider insurance
                    { carId: car.id }, // car specific
                ],
            },
        });
        if (!insurance)
            throw new Error("INSURANCE_NOT_ALLOWED_FOR_THIS_CAR");
        insuranceFee = rentalDays * insurance.dailyPrice;
    }
    const totalPrice = basePrice + insuranceFee;
    return {
        rentalDays,
        basePrice,
        insuranceFee,
        totalPrice,
    };
}
