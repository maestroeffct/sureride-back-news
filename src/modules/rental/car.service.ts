import { prisma } from "../../prisma";

type SearchCarsInput = {
  pickupLocationId: string;
  dropoffLocationId?: string;
  pickupAt: Date;
  returnAt: Date;
  countryCode: string;
};

export async function searchAvailableCars(input: SearchCarsInput) {
  return prisma.car.findMany({
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

export async function listAllCars() {
  return prisma.car.findMany({
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
