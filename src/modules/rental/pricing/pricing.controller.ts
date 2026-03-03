import { calculateDailyPrice } from "./pricing.service";
import { Request, Response } from "express";

export async function previewPrice(req: Request, res: Response) {
  try {
    const result = await calculateDailyPrice(req.body);

    res.json({
      message: "Price calculated",
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
