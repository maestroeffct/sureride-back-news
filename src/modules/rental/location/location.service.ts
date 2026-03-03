import { prisma } from "../../../prisma";

type SearchLocationInput = {
  query: string;
  countryId?: string;
};

export async function searchLocations(input: SearchLocationInput) {
  if (!input.query || input.query.length < 3) {
    return [];
  }

  return prisma.location.findMany({
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

export async function listAllLocations() {
  return prisma.location.findMany({
    include: {
      country: true,
      provider: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
