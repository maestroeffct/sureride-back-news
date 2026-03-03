import { prisma } from "../../../prisma";

type CreateBookingInput = {
  userId: string;
  carId: string;
  pickupAt: Date;
  returnAt: Date;
  pickupLocationId: string;
  dropoffLocationId: string;
  insuranceId?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.profileStatus !== "VERIFIED") {
    throw new Error("PROFILE_INCOMPLETE");
  }

  const car = await prisma.car.findUnique({
    where: { id: input.carId },
    include: { insurancePackages: true },
  });

  if (!car || !car.isActive) {
    throw new Error("CAR_NOT_AVAILABLE");
  }

  const overlapping = await prisma.booking.findFirst({
    where: {
      carId: input.carId,
      AND: [
        { pickupAt: { lt: input.returnAt } },
        { returnAt: { gt: input.pickupAt } },
        { status: { in: ["PENDING", "CONFIRMED"] } },
      ],
    },
  });

  if (overlapping) throw new Error("CAR_ALREADY_BOOKED");

  const ms = input.returnAt.getTime() - input.pickupAt.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));

  const basePrice = days * car.dailyRate;

  let insuranceFee = 0;

  if (input.insuranceId) {
    const insurance = await prisma.insurancePackage.findUnique({
      where: { id: input.insuranceId },
    });

    if (insurance) {
      insuranceFee = days * insurance.dailyPrice;
    }
  }

  const totalPrice = basePrice + insuranceFee;

  return prisma.booking.create({
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

export async function fetchUserBookings(userId: string, status?: string) {
  let filter: any = { userId };

  if (status === "IN_PROGRESS") {
    filter.status = {
      in: ["PENDING", "CONFIRMED"],
    };
  }

  if (status === "COMPLETED") {
    filter.status = "COMPLETED";
  }

  return prisma.booking.findMany({
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

export async function fetchBookingDetails(userId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
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
      status: booking.paymentStatus,
      provider: booking.paymentProvider,
      reference: booking.paymentReference,
      paidAt: booking.paidAt,
    },

    status: booking.status,
  };
}

function generatePickupCode(bookingId: string) {
  return bookingId.slice(0, 8).toUpperCase();
}

export async function cancelUserBooking(userId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
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

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
}

// ⚠️ In production:
// This endpoint should be called by:

// Payment webhook

// NOT frontend directly

export async function confirmUserBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "PENDING") {
    throw new Error("Booking already processed");
  }

  if (booking.paymentStatus !== "SUCCEEDED") {
    throw new Error("PAYMENT_NOT_COMPLETED");
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  });
}
