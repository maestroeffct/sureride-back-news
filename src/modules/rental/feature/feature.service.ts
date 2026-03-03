import { prisma } from "../../../prisma";
import { FeatureCategory } from "@prisma/client";

/**
 * ADMIN - Create Global Feature
 * providerId = null
 */
export async function createGlobalFeature(data: {
  name: string;
  category: FeatureCategory;
  icon?: string;
}) {
  return prisma.feature.create({
    data: {
      name: data.name,
      category: data.category,
      icon: data.icon,
      providerId: null,
    },
  });
}

/**
 * PROVIDER - Create Custom Feature
 */
export async function createProviderFeature(
  providerId: string,
  data: {
    name: string;
    category: FeatureCategory;
    icon?: string;
  },
) {
  return prisma.feature.create({
    data: {
      name: data.name,
      category: data.category,
      icon: data.icon,
      providerId,
    },
  });
}

/**
 * List features for provider (global + provider owned)
 */
export async function listProviderFeatures(providerId: string) {
  return prisma.feature.findMany({
    where: {
      OR: [
        { providerId: null }, // global
        { providerId }, // owned
      ],
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Attach features to car (bulk)
 */
export async function attachFeaturesToCar(
  providerId: string,
  carId: string,
  featureIds: string[],
) {
  const car = await prisma.car.findUnique({
    where: { id: carId },
  });

  if (!car) {
    throw new Error("CAR_NOT_FOUND");
  }

  if (car.providerId !== providerId) {
    throw new Error("NOT_YOUR_CAR");
  }

  // Validate features ownership
  const features = await prisma.feature.findMany({
    where: { id: { in: featureIds } },
  });

  for (const feature of features) {
    if (feature.providerId && feature.providerId !== providerId) {
      throw new Error("INVALID_FEATURE_OWNERSHIP");
    }
  }

  // Remove existing
  await prisma.carFeature.deleteMany({
    where: { carId },
  });

  // Attach new
  await prisma.carFeature.createMany({
    data: featureIds.map((featureId) => ({
      carId,
      featureId,
    })),
  });

  return { message: "Features attached successfully" };
}

/**
 * Get Car With Grouped Features
 */
export async function getCarWithFeatures(carId: string) {
  const car = await prisma.car.findUnique({
    where: { id: carId },
    include: {
      images: true,
      provider: true,
      location: {
        include: { country: true },
      },
      insurancePackages: true,
      features: {
        include: {
          feature: true,
        },
      },
    },
  });

  if (!car) {
    throw new Error("CAR_NOT_FOUND");
  }

  // Group features by category
  const grouped: Record<string, any[]> = {};

  car.features.forEach((cf) => {
    const category = cf.feature.category;

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      id: cf.feature.id,
      name: cf.feature.name,
      icon: cf.feature.icon,
    });
  });

  return {
    ...car,
    groupedFeatures: grouped,
  };
}
