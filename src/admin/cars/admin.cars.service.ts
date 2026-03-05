import { prisma } from "../../prisma";
import { CarStatus } from "@prisma/client";

export async function adminListCars(input: {
  q?: string;
  status?: CarStatus;
  providerId?: string;
  city?: string;
  page: number;
  limit: number;
}) {
  const { q, status, providerId, city, page, limit } = input;

  const where: any = {};

  if (status) where.status = status;
  if (providerId) where.providerId = providerId;

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
    prisma.car.findMany({
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
    prisma.car.count({ where }),
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

export async function adminGetCar(carId: string) {
  const car = await prisma.car.findUnique({
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

  if (!car) throw new Error("CAR_NOT_FOUND");

  return car;
}

export async function adminCreateCar(input: {
  providerId: string;
  locationId: string;

  brand: string;
  model: string;
  category: any;
  year: number;

  seats: number;
  bags: string;
  hasAC: boolean;
  transmission: any;
  mileagePolicy: any;

  dailyRate: number;
  hourlyRate?: number | null;

  autoApprove: boolean;
  note?: string;
}) {
  const { autoApprove, note, ...data } = input;

  // Ensure provider exists
  const provider = await prisma.rentalProvider.findUnique({
    where: { id: data.providerId },
  });
  if (!provider) throw new Error("PROVIDER_NOT_FOUND");

  // Ensure location belongs to provider
  const location = await prisma.location.findUnique({
    where: { id: data.locationId },
  });
  if (!location) throw new Error("LOCATION_NOT_FOUND");
  if (location.providerId !== data.providerId)
    throw new Error("LOCATION_NOT_OWNED_BY_PROVIDER");

  const status: CarStatus = autoApprove ? "APPROVED" : "DRAFT";

  const car = await prisma.car.create({
    data: {
      ...data,
      status,
      isActive: autoApprove ? true : false,
      moderationNote: note ?? null,
      flaggedReason: null,
    } as any,
  });

  return car;
}

export async function adminUpdateCar(carId: string, data: any) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  // If admin changes location, validate provider ownership consistency
  if (data.locationId) {
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    });
    if (!location) throw new Error("LOCATION_NOT_FOUND");
    if (location.providerId !== car.providerId)
      throw new Error("LOCATION_NOT_OWNED_BY_PROVIDER");
  }

  return prisma.car.update({
    where: { id: carId },
    data,
  });
}

export async function adminApproveCar(carId: string, note?: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  return prisma.car.update({
    where: { id: carId },
    data: {
      status: "APPROVED",
      isActive: true,
      moderationNote: note ?? null,
      flaggedReason: null,
    } as any,
  });
}

export async function adminRejectCar(carId: string, reason: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  return prisma.car.update({
    where: { id: carId },
    data: {
      status: "REJECTED",
      isActive: false,
      moderationNote: reason,
    } as any,
  });
}

export async function adminFlagCar(carId: string, reason: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  return prisma.car.update({
    where: { id: carId },
    data: {
      status: "FLAGGED",
      isActive: false,
      flaggedReason: reason,
    } as any,
  });
}

export async function adminUnflagCar(carId: string, note?: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  // After unflag, safest is back to APPROVED (not DRAFT)
  return prisma.car.update({
    where: { id: carId },
    data: {
      status: "APPROVED",
      isActive: true,
      flaggedReason: null,
      moderationNote: note ?? car.moderationNote ?? null,
    } as any,
  });
}

export async function adminActivateCar(carId: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  if (car.status !== "APPROVED") {
    throw new Error("CAR_NOT_APPROVED");
  }

  return prisma.car.update({
    where: { id: carId },
    data: { isActive: true } as any,
  });
}

export async function adminDeactivateCar(carId: string, reason?: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");

  return prisma.car.update({
    where: { id: carId },
    data: {
      isActive: false,
      moderationNote: reason ?? car.moderationNote ?? null,
    } as any,
  });
}
