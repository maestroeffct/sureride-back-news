import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  adminCarListQuerySchema,
  adminCreateCarSchema,
  adminUpdateCarSchema,
  adminApproveSchema,
  adminRejectSchema,
  adminFlagSchema,
  adminUnflagSchema,
  adminDeactivateSchema,
} from "./admin.cars.validation";
import {
  adminListCars,
  adminGetCar,
  adminCreateCar,
  adminUpdateCar,
  adminApproveCar,
  adminRejectCar,
  adminFlagCar,
  adminUnflagCar,
  adminActivateCar,
  adminDeactivateCar,
} from "./admin.cars.service";

function zodFail(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
}

function getRequiredCarId(req: Request, res: Response): string | undefined {
  const rawCarId = req.params.carId;
  const carId = Array.isArray(rawCarId) ? rawCarId[0] : rawCarId;

  if (!carId) {
    res.status(400).json({ message: "carId is required" });
    return undefined;
  }

  return carId;
}

export async function adminListCarsController(req: Request, res: Response) {
  try {
    const q = adminCarListQuerySchema.parse(req.query);
    const data = await adminListCars(q);
    return res.json(data);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminGetCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const car = await adminGetCar(carId);
    return res.json(car);
  } catch (err: any) {
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminCreateCarController(req: Request, res: Response) {
  try {
    const body = adminCreateCarSchema.parse(req.body);
    const car = await adminCreateCar(body);
    return res.status(201).json({ message: "Car created", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);

    if (err.message === "PROVIDER_NOT_FOUND")
      return res.status(404).json({ message: "Provider not found" });
    if (err.message === "LOCATION_NOT_FOUND")
      return res.status(404).json({ message: "Location not found" });
    if (err.message === "LOCATION_NOT_OWNED_BY_PROVIDER")
      return res
        .status(400)
        .json({ message: "Location does not belong to provider" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminUpdateCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const body = adminUpdateCarSchema.parse(req.body);
    const car = await adminUpdateCar(carId, body);
    return res.json({ message: "Car updated", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "LOCATION_NOT_FOUND")
      return res.status(404).json({ message: "Location not found" });
    if (err.message === "LOCATION_NOT_OWNED_BY_PROVIDER")
      return res
        .status(400)
        .json({ message: "Location does not belong to car provider" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminApproveCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const { note } = adminApproveSchema.parse(req.body);
    const car = await adminApproveCar(carId, note);
    return res.json({ message: "Car approved", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminRejectCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const { reason } = adminRejectSchema.parse(req.body);
    const car = await adminRejectCar(carId, reason);
    return res.json({ message: "Car rejected", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminFlagCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const { reason } = adminFlagSchema.parse(req.body);
    const car = await adminFlagCar(carId, reason);
    return res.json({ message: "Car flagged", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminUnflagCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const { note } = adminUnflagSchema.parse(req.body);
    const car = await adminUnflagCar(carId, note);
    return res.json({ message: "Car unflagged", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminActivateCarController(req: Request, res: Response) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const car = await adminActivateCar(carId);
    return res.json({ message: "Car activated", car });
  } catch (err: any) {
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    if (err.message === "CAR_NOT_APPROVED")
      return res
        .status(400)
        .json({ message: "Car must be approved before activation" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function adminDeactivateCarController(
  req: Request,
  res: Response,
) {
  try {
    const carId = getRequiredCarId(req, res);
    if (!carId) return;

    const { reason } = adminDeactivateSchema.parse(req.body);
    const car = await adminDeactivateCar(carId, reason);
    return res.json({ message: "Car deactivated", car });
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    if (err.message === "CAR_NOT_FOUND")
      return res.status(404).json({ message: "Car not found" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
