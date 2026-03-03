import { Request, Response } from "express";
import { listAllLocations, searchLocations } from "./location.service";

export async function searchLocationController(req: Request, res: Response) {
  try {
    const { q, countryId } = req.query;

    const locations = await searchLocations({
      query: String(q),
      countryId: countryId ? String(countryId) : undefined,
    });

    return res.json(locations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to search locations" });
  }
}

export async function listLocations(_req: Request, res: Response) {
  try {
    const locations = await listAllLocations();
    return res.json(locations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch locations" });
  }
}
