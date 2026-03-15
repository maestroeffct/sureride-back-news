import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  providerCreateCarSchema,
  providerUpdateCarSchema,
  providerSubmitSchema,
  providerAttachFeaturesSchema,
} from "./provider.cars.validation";
import {
  providerCreateCar,
  providerUpdateCar,
  providerSubmitCar,
  providerUploadCarImages,
  providerDeleteCarImage,
  providerAttachCarFeatures,
} from "./provider.cars.service";

function zodFail(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getRequiredParam(
  req: Request,
  res: Response,
  paramName: string,
): string | undefined {
  const value = getSingleParam(req.params[paramName]);

  if (!value) {
    res.status(400).json({ message: `${paramName} is required` });
    return undefined;
  }

  return value;
}

function getAuthenticatedProviderId(
  req: Request,
  res: Response,
): string | undefined {
  const providerId = req.user?.providerId;
  if (!providerId) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }
  return providerId;
}

export async function providerCreateCarController(req: Request, res: Response) {
  try {
    const providerId = getAuthenticatedProviderId(req, res);
    if (!providerId) return;
    const body = providerCreateCarSchema.parse(req.body);

    const car = await providerCreateCar(providerId, body);

    return res.status(201).json({ message: "Car created", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);

    if (err.message === "LOCATION_NOT_FOUND")
      return res.status(404).json({ message: "Location not found" });
    if (err.message === "LOCATION_NOT_OWNED")
      return res
        .status(403)
        .json({ message: "Location not owned by provider" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function providerUpdateCarController(req: Request, res: Response) {
  try {
    const providerId = getAuthenticatedProviderId(req, res);
    if (!providerId) return;
    const carId = getRequiredParam(req, res, "carId");
    if (!carId) return;

    const body = providerUpdateCarSchema.parse(req.body);

    const car = await providerUpdateCar(providerId, carId, body);

    return res.json({ message: "Car updated", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);

    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "FORBIDDEN")
      return res.status(403).json({ message: "Not your car" });
    if (err.message === "CAR_FLAGGED")
      return res
        .status(403)
        .json({ message: "Car is flagged. Contact support." });
    if (err.message === "LOCATION_NOT_FOUND")
      return res.status(404).json({ message: "Location not found" });
    if (err.message === "LOCATION_NOT_OWNED")
      return res
        .status(403)
        .json({ message: "Location not owned by provider" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function providerSubmitCarController(req: Request, res: Response) {
  try {
    const providerId = getAuthenticatedProviderId(req, res);
    if (!providerId) return;
    const carId = getRequiredParam(req, res, "carId");
    if (!carId) return;

    const { note } = providerSubmitSchema.parse(req.body);

    const car = await providerSubmitCar(providerId, carId, note);

    return res.json({ message: "Car submitted for approval", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);

    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "FORBIDDEN")
      return res.status(403).json({ message: "Not your car" });
    if (err.message === "INVALID_STATUS_FOR_SUBMIT")
      return res
        .status(400)
        .json({ message: "Only draft/rejected cars can be submitted" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function providerUploadCarImagesController(
  req: Request,
  res: Response,
) {
  try {
    const providerId = getAuthenticatedProviderId(req, res);
    if (!providerId) return;
    const carId = getRequiredParam(req, res, "carId");
    if (!carId) return;

    const files = (req.files as Express.Multer.File[]) || [];
    await providerUploadCarImages(providerId, carId, files);

    return res.status(201).json({ message: "Images uploaded successfully" });
  } catch (err: any) {
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "FORBIDDEN")
      return res.status(403).json({ message: "Not your car" });
    if (err.message === "CAR_FLAGGED")
      return res
        .status(403)
        .json({ message: "Car is flagged. Contact support." });
    if (err.message === "NO_FILES")
      return res.status(400).json({ message: "No files uploaded" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function providerDeleteCarImageController(
  req: Request,
  res: Response,
) {
  try {
    const providerId = getAuthenticatedProviderId(req, res);
    if (!providerId) return;
    const carId = getRequiredParam(req, res, "carId");
    if (!carId) return;
    const imageId = getRequiredParam(req, res, "imageId");
    if (!imageId) return;

    const result = await providerDeleteCarImage(providerId, carId, imageId);

    return res.json(result);
  } catch (err: any) {
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "FORBIDDEN")
      return res.status(403).json({ message: "Not your car" });
    if (err.message === "IMAGE_NOT_FOUND")
      return res.status(404).json({ message: "Image not found" });
    if (err.message === "IMAGE_NOT_IN_CAR")
      return res
        .status(400)
        .json({ message: "Image does not belong to this car" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function providerAttachCarFeaturesController(
  req: Request,
  res: Response,
) {
  try {
    const providerId = getAuthenticatedProviderId(req, res);
    if (!providerId) return;
    const carId = getRequiredParam(req, res, "carId");
    if (!carId) return;

    const { featureIds } = providerAttachFeaturesSchema.parse(req.body);

    const result = await providerAttachCarFeatures(
      providerId,
      carId,
      featureIds,
    );

    return res.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);

    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "NOT_YOUR_CAR" || err.message === "FORBIDDEN")
      return res.status(403).json({ message: "Not your car" });

    if (err.message === "INVALID_FEATURE_OWNERSHIP")
      return res.status(403).json({ message: "Invalid feature ownership" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
