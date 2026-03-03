import { Request, Response } from "express";
import {
  cancelUserBooking,
  confirmUserBooking,
  createBooking,
  fetchBookingDetails,
  fetchUserBookings,
} from "./booking.service";

function getString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

export async function createBookingController(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const booking = await createBooking({
      userId,
      carId: req.body.carId,
      pickupAt: new Date(req.body.pickupAt),
      returnAt: new Date(req.body.returnAt),
      pickupLocationId: req.body.pickupLocationId,
      dropoffLocationId: req.body.dropoffLocationId,
      insuranceId: req.body.insuranceId,
    });

    return res.json({
      message: "Booking created successfully",
      booking,
    });
  } catch (err: any) {
    if (err.message === "PROFILE_INCOMPLETE") {
      return res.status(403).json({
        message: "Complete your profile before booking",
      });
    }

    return res.status(400).json({ message: err.message });
  }
}

export async function getUserBookings(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const status = getString(req.query.status);

    const bookings = await fetchUserBookings(userId, status);

    return res.json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
}

export async function getBookingDetails(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookingId = getString(req.params.bookingId);
    if (!bookingId) {
      return res.status(400).json({ message: "Missing bookingId" });
    }

    const booking = await fetchBookingDetails(userId, bookingId);

    return res.json(booking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch booking details" });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookingId = getString(req.params.bookingId);
    if (!bookingId) {
      return res.status(400).json({ message: "Missing bookingId" });
    }

    const booking = await cancelUserBooking(userId, bookingId);

    return res.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function confirmBooking(req: Request, res: Response) {
  try {
    const bookingId = getString(req.params.bookingId);
    if (!bookingId) {
      return res.status(400).json({ message: "Missing bookingId" });
    }

    const booking = await confirmUserBooking(bookingId);

    return res.json({
      message: "Booking confirmed",
      booking,
    });
  } catch (error: any) {
    if (error.message === "PAYMENT_NOT_COMPLETED") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    return res.status(400).json({ message: error.message });
  }
}
