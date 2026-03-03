import dayjs from "dayjs";
import { prisma } from "../../../prisma";

export async function calculateDailyPrice(params: {
  carId: string;
  pickupAt: Date;
  returnAt: Date;
  insuranceId?: string;
}) {
  const { carId, pickupAt, returnAt, insuranceId } = params;

  if (dayjs(returnAt).isBefore(dayjs(pickupAt))) {
    throw new Error("INVALID_DATE_RANGE");
  }

  const car = await prisma.car.findUnique({
    where: { id: carId },
  });

  if (!car || !car.isActive) {
    throw new Error("CAR_NOT_AVAILABLE");
  }

  // 🔥 Calculate number of days (minimum 1 day)
  const days = Math.max(1, dayjs(returnAt).diff(dayjs(pickupAt), "day", true));

  const rentalDays = Math.ceil(days);

  const basePrice = rentalDays * car.dailyRate;

  let insuranceFee = 0;

  if (insuranceId) {
    const insurance = await prisma.insurancePackage.findFirst({
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

    if (!insurance) throw new Error("INSURANCE_NOT_ALLOWED_FOR_THIS_CAR");

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
