import { prisma } from "../../../prisma";
import { CarStatus } from "@prisma/client";
import { attachFeaturesToCar } from "../../rental/feature/feature.service";

async function assertProviderOwnsCar(providerId: string, carId: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("CAR_NOT_FOUND");
  if (car.providerId !== providerId) throw new Error("FORBIDDEN");
  return car;
}

export async function providerCreateCar(providerId: string, data: any) {
  // Ensure location belongs to provider
  const location = await prisma.location.findUnique({
    where: { id: data.locationId },
  });
  if (!location) throw new Error("LOCATION_NOT_FOUND");
  if (location.providerId !== providerId) throw new Error("LOCATION_NOT_OWNED");

  // Provider cannot control moderation fields
  const car = await prisma.car.create({
    data: {
      ...data,
      providerId,
      status: "DRAFT",
      isActive: false,
      moderationNote: null,
      flaggedReason: null,
    } as any,
  });

  return car;
}

export async function providerUpdateCar(
  providerId: string,
  carId: string,
  data: any,
) {
  const car = await assertProviderOwnsCar(providerId, carId);

  if (car.status === "FLAGGED") {
    // Admin must unflag before provider can modify
    throw new Error("CAR_FLAGGED");
  }

  // Ensure location belongs to provider if changed
  if (data.locationId) {
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    });
    if (!location) throw new Error("LOCATION_NOT_FOUND");
    if (location.providerId !== providerId)
      throw new Error("LOCATION_NOT_OWNED");
  }

  // Strip forbidden fields from provider
  delete data.status;
  delete data.isActive;
  delete data.flaggedReason;
  delete data.moderationNote;
  delete data.providerId;

  // If provider edits an approved/rejected/pending car, force moderation again
  const nextStatus: CarStatus =
    car.status === "APPROVED" ? "PENDING_APPROVAL" : car.status;

  const shouldReset = car.status === "APPROVED" || car.status === "REJECTED";

  const updated = await prisma.car.update({
    where: { id: carId },
    data: {
      ...data,
      ...(shouldReset
        ? {
            status: "PENDING_APPROVAL",
            isActive: false,
          }
        : { status: nextStatus }),
    } as any,
  });

  return updated;
}

export async function providerSubmitCar(
  providerId: string,
  carId: string,
  note?: string,
) {
  const car = await assertProviderOwnsCar(providerId, carId);

  if (car.status !== "DRAFT" && car.status !== "REJECTED") {
    throw new Error("INVALID_STATUS_FOR_SUBMIT");
  }

  return prisma.car.update({
    where: { id: carId },
    data: {
      status: "PENDING_APPROVAL",
      isActive: false,
      moderationNote: note ?? car.moderationNote ?? null,
    } as any,
  });
}

export async function providerUploadCarImages(
  providerId: string,
  carId: string,
  files: Express.Multer.File[],
) {
  const car = await assertProviderOwnsCar(providerId, carId);

  if (car.status === "FLAGGED") throw new Error("CAR_FLAGGED");

  if (!files?.length) throw new Error("NO_FILES");

  // Convert file names to URLs relative to /uploads
  const records = await prisma.carImage.createMany({
    data: files.map((f, idx) => ({
      carId,
      url: `/uploads/cars/${f.filename}`,
      isPrimary: idx === 0, // first image primary by default
    })),
  });

  return records;
}

export async function providerDeleteCarImage(
  providerId: string,
  carId: string,
  imageId: string,
) {
  await assertProviderOwnsCar(providerId, carId);

  const img = await prisma.carImage.findUnique({ where: { id: imageId } });
  if (!img) throw new Error("IMAGE_NOT_FOUND");
  if (img.carId !== carId) throw new Error("IMAGE_NOT_IN_CAR");

  await prisma.carImage.delete({ where: { id: imageId } });

  return { message: "Image deleted" };
}

export async function providerAttachCarFeatures(
  providerId: string,
  carId: string,
  featureIds: string[],
) {
  // Reuse your feature module (it already validates global vs provider ownership)
  return attachFeaturesToCar(providerId, carId, featureIds);
}
