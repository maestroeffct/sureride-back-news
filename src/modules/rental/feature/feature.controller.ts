import { Request, Response } from "express";
import {
  createGlobalFeature,
  createProviderFeature,
  listProviderFeatures,
  attachFeaturesToCar,
  getCarWithFeatures,
} from "./feature.service";
import { FeatureCategory } from "@prisma/client";

function getString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

/**
 * ADMIN - Create Global Feature
 */
export async function createGlobalFeatureController(
  req: Request,
  res: Response,
) {
  try {
    const { name, category, icon } = req.body;

    const feature = await createGlobalFeature({
      name,
      category: category as FeatureCategory,
      icon,
    });

    return res.status(201).json(feature);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create feature" });
  }
}

/**
 * PROVIDER - Create Feature
 */
export async function createProviderFeatureController(
  req: Request,
  res: Response,
) {
  try {
    const providerId = req.user?.providerId;
    if (!providerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, category, icon } = req.body;

    const feature = await createProviderFeature(providerId, {
      name,
      category: category as FeatureCategory,
      icon,
    });

    return res.status(201).json(feature);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to create provider feature" });
  }
}

/**
 * PROVIDER - List features
 */
export async function listProviderFeaturesController(
  req: Request,
  res: Response,
) {
  try {
    const providerId = req.user?.providerId;
    if (!providerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const features = await listProviderFeatures(providerId);

    return res.json(features);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch features" });
  }
}

/**
 * PROVIDER - Attach Features to Car
 */
export async function attachFeaturesController(req: Request, res: Response) {
  try {
    const providerId = req.user?.providerId;
    if (!providerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const carId = getString(req.params.carId);
    if (!carId) {
      return res.status(400).json({ message: "Missing carId" });
    }
    const { featureIds } = req.body;

    const result = await attachFeaturesToCar(providerId, carId, featureIds);

    return res.json(result);
  } catch (err: any) {
    console.error(err);

    if (err.message === "NOT_YOUR_CAR") {
      return res.status(403).json({ message: "Unauthorized car access" });
    }

    if (err.message === "INVALID_FEATURE_OWNERSHIP") {
      return res.status(403).json({ message: "Invalid feature ownership" });
    }

    return res.status(500).json({ message: "Failed to attach features" });
  }
}

/**
 * PUBLIC - Get car with features
 */
export async function getCarWithFeaturesController(
  req: Request,
  res: Response,
) {
  try {
    const carId = getString(req.params.carId);
    if (!carId) {
      return res.status(400).json({ message: "Missing carId" });
    }

    const car = await getCarWithFeatures(carId);

    return res.json(car);
  } catch (err) {
    console.error(err);
    return res.status(404).json({ message: "Car not found" });
  }
}
