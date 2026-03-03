import { Request, Response } from "express";
import { listAllCars, searchAvailableCars } from "./car.service";

export async function searchCars(req: Request, res: Response) {
  const {
    pickupLocationId,
    dropoffLocationId,
    pickupAt,
    returnAt,
    countryCode,
  } = req.query;

  if (!pickupLocationId || !pickupAt || !returnAt || !countryCode) {
    return res.status(400).json({
      message: "Missing required search parameters",
    });
  }

  const cars = await searchAvailableCars({
    pickupLocationId: pickupLocationId as string,
    dropoffLocationId: dropoffLocationId as string | undefined,
    pickupAt: new Date(pickupAt as string),
    returnAt: new Date(returnAt as string),
    countryCode: countryCode as string,
  });

  res.json({
    search: {
      pickupAt,
      returnAt,
      countryCode,
    },
    total: cars.length,
    cars,
  });
}

export async function listCars(_req: Request, res: Response) {
  try {
    const cars = await listAllCars();
    return res.json(cars);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch cars" });
  }
}
